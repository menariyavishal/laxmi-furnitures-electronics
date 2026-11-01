import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const department = searchParams.get("department");

    const where: any = {};

    // Live / Active bookings ONLY. Completed & Cancelled orders are exclusively served by /api/v1/bookings/history
    if (status === "CONFIRMED" || status === "PARTIALLY_DELIVERED") {
      where.status = status;
    } else {
      where.status = { in: ["CONFIRMED", "PARTIALLY_DELIVERED"] };
    }

    if (department && department !== "ALL") {
      where.bookingItems = {
        some: {
          department: department.toUpperCase(),
        },
      };
    }

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (!prisma.booking) {
      console.warn("prisma.booking delegate is missing on current instance. Re-evaluating client...");
      return NextResponse.json([]);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: true,
        bookingItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                warrantyMonths: true,
                productType: true,
                quantityInStock: true,
              },
            },
          },
        },
        deliveries: {
          orderBy: { scheduledDate: "asc" },
        },
        bills: {
          select: {
            id: true,
            billNumber: true,
            department: true,
            billType: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { expectedDeliveryDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      eventDate,
      expectedDeliveryDate,
      totalEstimatedAmount,
      advancePaid = 0,
      discount = 0,
      notes,
      items,
    } = body;

    if (!expectedDeliveryDate) {
      return NextResponse.json({ error: "Delivery date is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item must be added to the booking" }, { status: 400 });
    }

    // Resolve creator ID before transaction
    let creatorId = parseInt(session.user?.id);
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

    const booking = await prisma.$transaction(
      async (tx) => {
        // 1. Resolve or create customer
        let resolvedCustomerId = customerId ? parseInt(customerId) : null;
        if (!resolvedCustomerId && customerPhone) {
          let existingCust = await tx.customer.findFirst({
            where: { phone: customerPhone.trim() },
          });

          if (existingCust) {
            resolvedCustomerId = existingCust.id;
            if (customerAddress && !existingCust.address) {
              await tx.customer.update({
                where: { id: existingCust.id },
                data: { address: customerAddress },
              });
            }
          } else {
            const newCust = await tx.customer.create({
              data: {
                name: customerName?.trim() || "Valued Customer",
                phone: customerPhone.trim(),
                address: customerAddress?.trim() || null,
              },
            });
            resolvedCustomerId = newCust.id;
          }
        }

        if (!resolvedCustomerId) {
          const fallbackCust = await tx.customer.create({
            data: {
              name: customerName?.trim() || "Walk-in Customer",
              address: customerAddress?.trim() || null,
            },
          });
          resolvedCustomerId = fallbackCust.id;
        }

        // 2. Generate Collision-Proof Booking Number e.g. ADB-2026-0001
        const year = new Date().getFullYear();
        let nextBookingNum = (await tx.booking.count()) + 1;
        const lastBooking = await tx.booking.findFirst({
          where: { bookingNumber: { startsWith: `ADB-${year}-` } },
          orderBy: { id: "desc" },
          select: { bookingNumber: true },
        });
        if (lastBooking) {
          const parts = lastBooking.bookingNumber.split("-");
          const lastSeq = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastSeq) && lastSeq >= nextBookingNum) {
            nextBookingNum = lastSeq + 1;
          }
        }
        let bookingNumber = `ADB-${year}-${String(nextBookingNum).padStart(4, "0")}`;
        while (await tx.booking.findUnique({ where: { bookingNumber }, select: { id: true } })) {
          nextBookingNum++;
          bookingNumber = `ADB-${year}-${String(nextBookingNum).padStart(4, "0")}`;
        }

        const totalEst = parseFloat(totalEstimatedAmount) || 0;
        const disc = parseFloat(discount) || 0;
        const netTotal = Math.max(0, totalEst - disc);
        const advPaid = parseFloat(advancePaid) || 0;
        const remaining = Math.max(0, netTotal - advPaid);

        // Record discount transparently in notes
        const bookingNotes = disc > 0
          ? (notes ? `${notes} (Discount: ₹${disc})` : `Discount: ₹${disc}`)
          : (notes || null);

        // 3. Create Master Booking
        const newBooking = await tx.booking.create({
          data: {
            bookingNumber,
            customerId: resolvedCustomerId,
            eventDate: eventDate ? new Date(eventDate) : null,
            expectedDeliveryDate: new Date(expectedDeliveryDate),
            totalEstimatedAmount: netTotal,
            advancePaid: advPaid,
            remainingBalance: remaining,
            status: "CONFIRMED",
            notes: bookingNotes,
          },
        });

        // 4. Check for Furniture Items to generate immediate Furniture Tax Invoice
        const furnitureItems = items.filter(
          (item: any) => (item.department || "FURNITURE").toUpperCase() === "FURNITURE"
        );

        let furnitureBillId: number | null = null;
        let createdFurnitureBill: any = null;

        if (furnitureItems.length > 0) {
          let nextBillNum = (await tx.bill.count()) + 1;
          const lastFurnBill = await tx.bill.findFirst({
            where: { billNumber: { startsWith: `FURN-${year}-` } },
            orderBy: { id: "desc" },
            select: { billNumber: true },
          });
          if (lastFurnBill) {
            const parts = lastFurnBill.billNumber.split("-");
            const lastSeq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastSeq) && lastSeq >= nextBillNum) {
              nextBillNum = lastSeq + 1;
            }
          }
          let furnitureBillNumber = `FURN-${year}-${String(nextBillNum).padStart(4, "0")}`;
          while (await tx.bill.findUnique({ where: { billNumber: furnitureBillNumber }, select: { id: true } })) {
            nextBillNum++;
            furnitureBillNumber = `FURN-${year}-${String(nextBillNum).padStart(4, "0")}`;
          }

          const furnitureSubtotal = furnitureItems.reduce(
            (sum: number, item: any) => sum + (parseFloat(item.lineTotal) || 0),
            0
          );

          // Allocate discount toward furniture invoice if any
          const furnitureDiscount = Math.min(furnitureSubtotal, disc);
          const furnitureNet = Math.max(0, furnitureSubtotal - furnitureDiscount);

          // Allocate advance toward furniture invoice
          const furniturePaid = Math.min(furnitureNet, advPaid);
          const furnitureDue = Math.max(0, furnitureNet - furniturePaid);
          const furniturePaymentStatus =
            furnitureDue === 0 ? "PAID" : furniturePaid > 0 ? "PARTIAL" : "UNPAID";

          createdFurnitureBill = await tx.bill.create({
            data: {
              billNumber: furnitureBillNumber,
              billType: "REGULAR",
              department: "FURNITURE",
              bookingId: newBooking.id,
              customerId: resolvedCustomerId,
              createdByUserId: creatorId,
              deliveryDate: new Date(), // Immediate booking day bill
              subtotal: furnitureSubtotal,
              discount: furnitureDiscount,
              totalAmount: furnitureNet,
              paidAmount: furniturePaid,
              dueAmount: furnitureDue,
              paymentStatus: furniturePaymentStatus,
              paymentMode: "CASH",
              status: "completed",
              createdAt: new Date(),
            },
          });
          furnitureBillId = createdFurnitureBill.id;

          // Create BillItems for furniture and deduct furniture stock
          for (const fItem of furnitureItems) {
            await tx.billItem.create({
              data: {
                billId: createdFurnitureBill.id,
                productId: parseInt(fItem.productId),
                quantity: parseInt(fItem.quantity) || 1,
                mrp: fItem.mrp ? parseFloat(fItem.mrp) : undefined,
                unitPrice: parseFloat(fItem.unitPrice),
                lineTotal: parseFloat(fItem.lineTotal),
                customisations: fItem.customisations || null,
              },
            });

            // Deduct inventory quantity in stock for furniture immediately
            await tx.product.update({
              where: { id: parseInt(fItem.productId) },
              data: {
                quantityInStock: {
                  decrement: parseInt(fItem.quantity) || 1,
                },
              },
            });
          }
        }

        // 5. Create Booking Items
        // Furniture items are marked isBilled = true with billId
        // Electronics items remain isBilled = false, billId = null (stock untouched until delivery day)
        for (const item of items) {
          const isFurn = (item.department || "FURNITURE").toUpperCase() === "FURNITURE";
          await tx.bookingItem.create({
            data: {
              bookingId: newBooking.id,
              productId: parseInt(item.productId),
              department: (item.department || "FURNITURE").toUpperCase(),
              quantity: parseInt(item.quantity) || 1,
              mrp: item.mrp ? parseFloat(item.mrp) : undefined,
              unitPrice: parseFloat(item.unitPrice),
              lineTotal: parseFloat(item.lineTotal),
              customisations: item.customisations || null,
              isBilled: isFurn,
              billId: isFurn ? furnitureBillId : null,
            },
          });
        }

        // 6. Create initial Delivery Schedule
        await tx.deliverySchedule.create({
          data: {
            bookingId: newBooking.id,
            scheduledDate: new Date(expectedDeliveryDate),
            status: "SCHEDULED",
            driverNotes: notes ? `Booking notes: ${notes}` : null,
          },
        });

        return {
          ...newBooking,
          furnitureBill: createdFurnitureBill,
        };
      },
      {
        maxWait: 15000,
        timeout: 45000,
      }
    );

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    const detail = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    return NextResponse.json({ error: detail || "Failed to create booking" }, { status: 500 });
  }
}
