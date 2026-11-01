import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      deliveryDate = new Date().toISOString(),
      itemSerialNumbers = {}, // { [bookingItemId]: serialNumber }
      paymentMode = "CASH",
      amountPaidNow = 0,
      itemIdsToBill, // Optional: list of specific bookingItem IDs to bill
      sgstPercent = 0,
      cgstPercent = 0,
      sgstAmount = 0,
      cgstAmount = 0,
      isGstInclusive = true,
      totalAmount,
    } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        bookingItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Determine unbilled items to include in this delivery invoice
    const itemsToBill = booking.bookingItems.filter((item) => {
      if (item.isBilled) return false;
      if (itemIdsToBill && Array.isArray(itemIdsToBill)) {
        return itemIdsToBill.includes(item.id);
      }
      return true;
    });

    if (itemsToBill.length === 0) {
      return NextResponse.json({ error: "All items in this booking are already billed." }, { status: 400 });
    }

    // Pre-calculate values outside transaction to minimize lock holding time
    const subtotal = itemsToBill.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const paid = parseFloat(amountPaidNow) || 0;

    // GST Calculation: Support both Inclusive (reverse calculation) and Exclusive (subtotal + GST)
    const sPercent = parseFloat(sgstPercent) || 0;
    const cPercent = parseFloat(cgstPercent) || 0;
    const totalGstPercent = sPercent + cPercent;
    const isInclusive = isGstInclusive !== false;

    let taxableAmount = subtotal;
    let calculatedSgstAmt = 0;
    let calculatedCgstAmt = 0;
    let finalTotal = subtotal;

    if (totalGstPercent > 0) {
      if (isInclusive) {
        // Reverse GST calculation (price already includes GST)
        taxableAmount = subtotal / (1 + totalGstPercent / 100);
        calculatedSgstAmt = taxableAmount * (sPercent / 100);
        calculatedCgstAmt = taxableAmount * (cPercent / 100);
        finalTotal = subtotal;
      } else {
        // Exclusive GST: tax added on top of total (total + GST)
        taxableAmount = subtotal;
        calculatedSgstAmt = taxableAmount * (sPercent / 100);
        calculatedCgstAmt = taxableAmount * (cPercent / 100);
        finalTotal = subtotal + calculatedSgstAmt + calculatedCgstAmt;
      }
    } else {
      calculatedSgstAmt = parseFloat(sgstAmount) || 0;
      calculatedCgstAmt = parseFloat(cgstAmount) || 0;
      finalTotal = subtotal + calculatedSgstAmt + calculatedCgstAmt;
    }

    const due = Math.max(0, finalTotal - paid);
    const paymentStatus = due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

    // Generate unique Collision-Proof Bill Number (e.g., ELEC-YYYY-XXXX / FURN-YYYY-XXXX)
    const year = new Date().getFullYear();
    const primaryDept = itemsToBill.some((i) => i.department === "ELECTRONICS")
      ? "ELEC"
      : "FURN";
    let nextBillNum = (await prisma.bill.count()) + 1;
    const lastDeptBill = await prisma.bill.findFirst({
      where: { billNumber: { startsWith: `${primaryDept}-${year}-` } },
      orderBy: { id: "desc" },
      select: { billNumber: true },
    });
    if (lastDeptBill) {
      const parts = lastDeptBill.billNumber.split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq) && lastSeq >= nextBillNum) {
        nextBillNum = lastSeq + 1;
      }
    }
    let billNumber = `${primaryDept}-${year}-${String(nextBillNum).padStart(4, "0")}`;
    while (await prisma.bill.findUnique({ where: { billNumber }, select: { id: true } })) {
      nextBillNum++;
      billNumber = `${primaryDept}-${year}-${String(nextBillNum).padStart(4, "0")}`;
    }

    const deliveryDt = new Date(deliveryDate);

    // Resolve valid user ID for foreign key constraint before entering transaction
    let creatorId = parseInt(session.user.id);
    if (!creatorId || isNaN(creatorId)) {
      creatorId = 1;
    }
    const existingUser = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });
    if (!existingUser) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      creatorId = firstUser ? firstUser.id : 1;
    }

    // Pre-determine if all items are billed after this invoice
    const billedItemIds = new Set(itemsToBill.map((item) => item.id));
    const allBilled = booking.bookingItems.every(
      (item) => item.isBilled || billedItemIds.has(item.id)
    );

    const currentBalance = Number(booking.remainingBalance);
    const newRemainingBalance = Math.max(0, currentBalance - paid);

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create the Bill (dated on DELIVERY DAY for warranty, with reverse GST calculation)
        const newBill = await tx.bill.create({
          data: {
            billNumber,
            billType: "DELIVERY_INVOICE",
            department: primaryDept === "ELEC" ? "ELECTRONICS" : "FURNITURE",
            bookingId: booking.id,
            customerId: booking.customerId,
            createdByUserId: creatorId,
            deliveryDate: deliveryDt,
            warrantyStarts: deliveryDt, // CRITICAL: Warranty officially begins TODAY
            subtotal: taxableAmount,
            discount: 0,
            sgstPercent: sPercent,
            cgstPercent: cPercent,
            sgstAmount: calculatedSgstAmt,
            cgstAmount: calculatedCgstAmt,
            totalAmount: finalTotal,
            paidAmount: paid,
            dueAmount: due,
            paymentStatus,
            paymentMode,
            status: "completed",
            createdAt: deliveryDt, // Timestamped at delivery date
          },
        });

        // 2. Create BillItems, attach Serial Numbers, and deduct Stock
        for (const bItem of itemsToBill) {
          const serialNo = itemSerialNumbers[bItem.id];

          let unitId: number | null = null;
          if (serialNo && serialNo.trim()) {
            const cleanSerial = serialNo.trim();
            // Record or look up unit with serial number
            const existingUnit = await tx.productUnit.findUnique({
              where: { imeiNumber: cleanSerial },
            });

            if (existingUnit) {
              unitId = existingUnit.id;
              await tx.productUnit.update({
                where: { id: existingUnit.id },
                data: {
                  status: "sold",
                  soldAt: deliveryDt,
                },
              });
            } else {
              const newUnit = await tx.productUnit.create({
                data: {
                  productId: bItem.productId,
                  imeiNumber: cleanSerial,
                  status: "sold",
                  costPrice: bItem.product.costPrice,
                  soldAt: deliveryDt,
                },
              });
              unitId = newUnit.id;
            }
          }

          // Create line item in the tax bill
          await tx.billItem.create({
            data: {
              billId: newBill.id,
              productId: bItem.productId,
              productUnitId: unitId,
              quantity: bItem.quantity,
              mrp: bItem.mrp,
              unitPrice: bItem.unitPrice,
              lineTotal: bItem.lineTotal,
              customisations: bItem.customisations,
            },
          });

          // Deduct inventory quantity in stock
          await tx.product.update({
            where: { id: bItem.productId },
            data: {
              quantityInStock: {
                decrement: bItem.quantity,
              },
            },
          });

          // Mark the booking item as billed
          await tx.bookingItem.update({
            where: { id: bItem.id },
            data: {
              isBilled: true,
              billId: newBill.id,
            },
          });
        }

        // 3. Update Booking status and remaining balance
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: allBilled ? "COMPLETED" : "PARTIALLY_DELIVERED",
            remainingBalance: newRemainingBalance,
          },
        });

        // 4. Update Delivery Schedule
        await tx.deliverySchedule.updateMany({
          where: {
            bookingId: booking.id,
            status: "SCHEDULED",
          },
          data: {
            actualDelivery: deliveryDt,
            status: "DELIVERED",
          },
        });

        return newBill;
      },
      {
        maxWait: 10000, // 10s to acquire connection
        timeout: 30000, // 30s execution timeout for cloud database roundtrips
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error generating delivery invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to generate delivery invoice" }, { status: 500 });
  }
}
