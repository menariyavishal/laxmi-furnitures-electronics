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
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.toUpperCase();
    const vendorId = searchParams.get("vendorId");
    const paymentStatus = searchParams.get("paymentStatus");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (department && department !== "ALL") {
      where.department = department;
    }

    if (vendorId && vendorId !== "ALL" && !isNaN(parseInt(vendorId))) {
      where.vendorId = parseInt(vendorId);
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      if (paymentStatus === "PENDING_DUE") {
        where.paymentStatus = { in: ["UNPAID", "PARTIAL"] };
      } else {
        where.paymentStatus = paymentStatus;
      }
    }

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: "insensitive" } },
        { vendorInvoiceNo: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { vendor: { phone: { contains: search } } },
        {
          items: {
            some: {
              itemName: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    // 1. Fetch paginated records
    const [purchases, totalCount] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: "desc" },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
              gstin: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  quantityInStock: true,
                  costPrice: true,
                  sellingPrice: true,
                  warrantyMonths: true,
                },
              },
            },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    // 2. Fetch global KPIs
    const kpiWhere: any = {};
    if (department && department !== "ALL") {
      kpiWhere.department = department;
    }
    if (vendorId && vendorId !== "ALL" && !isNaN(parseInt(vendorId))) {
      kpiWhere.vendorId = parseInt(vendorId);
    }

    const allPurchases = await prisma.purchase.findMany({
      where: kpiWhere,
      select: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        paymentStatus: true,
      },
    });

    const kpis = {
      totalPurchasesCount: allPurchases.length,
      totalPurchaseAmount: allPurchases.reduce((s, p) => s + Number(p.totalAmount), 0),
      // Only count paid amounts for purchases that are NOT fully settled (i.e. dueAmount > 0 or paymentStatus !== 'PAID')
      totalPaidAmount: allPurchases
        .filter((p) => Number(p.dueAmount) > 0 || p.paymentStatus !== "PAID")
        .reduce((s, p) => s + Number(p.paidAmount), 0),
      totalDueAmount: allPurchases.reduce((s, p) => s + Number(p.dueAmount), 0),
      unpaidPurchasesCount: allPurchases.filter((p) => p.paymentStatus !== "PAID").length,
    };

    return NextResponse.json({
      items: purchases,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      kpis,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
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
      vendorId: inputVendorId,
      newVendor,
      vendorInvoiceNo,
      department = "FURNITURE",
      purchaseDate = new Date().toISOString(),
      notes,
      items,
      paidAmount: inputPaidAmount = 0,
      paymentMode = "CASH",
      transactionRef,
      isStockAdded = true,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one purchase item is required" }, { status: 400 });
    }

    const currentUserId = parseInt((session.user as any)?.id) || 1;

    // Run creation inside an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve or create Vendor
      let resolvedVendorId =
        inputVendorId && !isNaN(parseInt(inputVendorId)) ? parseInt(inputVendorId) : null;

      if (!resolvedVendorId && newVendor && newVendor.phone) {
        let existingVendor = await tx.vendor.findFirst({
          where: { phone: newVendor.phone.trim() },
        });

        if (existingVendor) {
          resolvedVendorId = existingVendor.id;
          if (!existingVendor.isActive) {
            await tx.vendor.update({
              where: { id: existingVendor.id },
              data: { isActive: true },
            });
          }
        } else {
          const createdV = await tx.vendor.create({
            data: {
              name: newVendor.name?.trim() || "Vendor",
              phone: newVendor.phone.trim(),
              address: newVendor.address?.trim() || null,
              gstin: newVendor.gstin?.trim() || null,
              isActive: true,
            },
          });
          resolvedVendorId = createdV.id;
        }
      }

      if (!resolvedVendorId) {
        throw new Error("A valid vendor is required for recording purchases");
      }

      // 2. Generate Collision-Proof Sequential Purchase Number (e.g. PUR-2026-0001)
      const year = new Date(purchaseDate).getFullYear() || new Date().getFullYear();
      let nextSeq = (await tx.purchase.count()) + 1;
      const lastPurchase = await tx.purchase.findFirst({
        where: { purchaseNumber: { startsWith: `PUR-${year}-` } },
        orderBy: { id: "desc" },
        select: { purchaseNumber: true },
      });

      if (lastPurchase) {
        const parts = lastPurchase.purchaseNumber.split("-");
        const parsed = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(parsed) && parsed >= nextSeq) {
          nextSeq = parsed + 1;
        }
      }

      let purchaseNumber = `PUR-${year}-${String(nextSeq).padStart(4, "0")}`;
      while (await tx.purchase.findUnique({ where: { purchaseNumber }, select: { id: true } })) {
        nextSeq++;
        purchaseNumber = `PUR-${year}-${String(nextSeq).padStart(4, "0")}`;
      }

      // 3. Calculate Item Totals and Prepare Items
      let grandTotal = 0;
      const preparedItems: any[] = [];
      const deptUpper = department.toUpperCase() === "ELECTRONICS" ? "ELECTRONICS" : "FURNITURE";

      // Fallback category for new products
      const defaultCategory = await tx.category.findFirst({
        where: { department: deptUpper },
      });
      const fallbackCatId = defaultCategory ? defaultCategory.id : 1;

      for (const item of items) {
        const qty = parseInt(item.quantity) || 1;
        const unitCost = parseFloat(item.unitCostPrice) || 0;
        const lineTotal = qty * unitCost;
        grandTotal += lineTotal;

        let productId =
          item.productId && !isNaN(parseInt(item.productId)) ? parseInt(item.productId) : null;
        const warrantyMonths =
          item.warrantyMonths && !isNaN(parseInt(item.warrantyMonths))
            ? parseInt(item.warrantyMonths)
            : null;

        // Auto-create or link product when isStockAdded is true and no productId is provided
        if (!productId && item.itemName && Boolean(isStockAdded)) {
          const existingProd = await tx.product.findFirst({
            where: {
              name: { equals: item.itemName.trim(), mode: "insensitive" },
              department: deptUpper,
            },
          });

          if (existingProd) {
            productId = existingProd.id;
          } else {
            const newProd = await tx.product.create({
              data: {
                name: item.itemName.trim(),
                brand: item.brand?.trim() || null,
                categoryId: parseInt(item.categoryId) || fallbackCatId,
                department: deptUpper,
                productType: deptUpper === "ELECTRONICS" ? "electronics" : "quantity",
                costPrice: unitCost,
                sellingPrice: parseFloat(item.sellingPrice) || unitCost * 1.25,
                warrantyMonths: warrantyMonths || (deptUpper === "ELECTRONICS" ? 12 : null),
                quantityInStock: 0, // Will increment below in step 5
                isActive: true,
              },
            });
            productId = newProd.id;
          }
        }

        preparedItems.push({
          productId,
          itemName: item.itemName?.trim() || "Item",
          quantity: qty,
          unitCostPrice: unitCost,
          lineTotal,
          serialNumbers: item.serialNumbers?.trim() || null,
          warrantyMonths,
        });
      }

      const paid = Math.min(grandTotal, Math.max(0, parseFloat(inputPaidAmount) || 0));
      const due = Math.max(0, grandTotal - paid);
      const paymentStatus = due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

      // 4. Create Master Purchase
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          vendorInvoiceNo: vendorInvoiceNo?.trim() || null,
          vendorId: resolvedVendorId,
          department: deptUpper,
          purchaseDate: new Date(purchaseDate),
          totalAmount: grandTotal,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus,
          isStockAdded: Boolean(isStockAdded),
          notes: notes?.trim() || null,
          createdByUserId: currentUserId,
        },
      });

      // 5. Create Purchase Items & Increment Inventory Stock
      for (const pItem of preparedItems) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: createdPurchase.id,
            productId: pItem.productId,
            itemName: pItem.itemName,
            quantity: pItem.quantity,
            unitCostPrice: pItem.unitCostPrice,
            lineTotal: pItem.lineTotal,
            serialNumbers: pItem.serialNumbers,
            warrantyMonths: pItem.warrantyMonths,
          },
        });

        // Auto-increment inventory stock if flag is enabled and item is linked to a Product
        if (isStockAdded && pItem.productId) {
          const product = await tx.product.findUnique({
            where: { id: pItem.productId },
            select: { id: true, productType: true },
          });

          if (product) {
            // Update product stock, costPrice, and warrantyMonths with latest purchase rate
            await tx.product.update({
              where: { id: pItem.productId },
              data: {
                quantityInStock: { increment: pItem.quantity },
                costPrice: pItem.unitCostPrice,
                ...(pItem.warrantyMonths ? { warrantyMonths: pItem.warrantyMonths } : {}),
              },
            });

            // Create StockInRecord for audit trail with purchaseId link
            await tx.stockInRecord.create({
              data: {
                productId: pItem.productId,
                quantityAdded: pItem.quantity,
                costPrice: pItem.unitCostPrice,
                addedByUserId: currentUserId,
                purchaseId: createdPurchase.id,
              },
            });

            // If serialized/electronics and serial numbers provided
            if (pItem.serialNumbers) {
              const serials = pItem.serialNumbers
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);

              for (const sn of serials) {
                const existingUnit = await tx.productUnit.findUnique({
                  where: { imeiNumber: sn },
                });
                if (!existingUnit) {
                  await tx.productUnit.create({
                    data: {
                      productId: pItem.productId,
                      imeiNumber: sn,
                      status: "in_stock",
                      costPrice: pItem.unitCostPrice,
                    },
                  });
                }
              }
            }
          }
        }
      }

      // 6. Record Initial Payment (Down payment/token) if paid > 0
      if (paid > 0) {
        await tx.purchasePayment.create({
          data: {
            purchaseId: createdPurchase.id,
            amountPaid: paid,
            paymentDate: new Date(purchaseDate),
            paymentMode,
            transactionRef: transactionRef?.trim() || null,
            notes: "Initial payment upon purchase receipt",
          },
        });
      }

      return createdPurchase.id;
    },
    {
      maxWait: 15000,
      timeout: 30000,
    });

    // Return fully hydrated purchase with relations outside transaction
    const hydratedPurchase = await prisma.purchase.findUnique({
      where: { id: result },
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(hydratedPurchase, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase" },
      { status: 500 }
    );
  }
}
