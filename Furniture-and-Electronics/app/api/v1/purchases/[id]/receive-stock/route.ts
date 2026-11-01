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

    const { id: rawId } = await params;
    const purchaseId = parseInt(rawId);

    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }

    // 1. Fetch current purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        items: true,
        vendor: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.isStockAdded) {
      return NextResponse.json(
        { error: "Stock for this purchase has already been added to inventory." },
        { status: 400 }
      );
    }

    const currentUserId = parseInt((session.user as any)?.id) || 1;

    // 2. Execute stock reception transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Find default category fallback if custom item needs a product record
      const defaultCategory = await tx.category.findFirst({
        where: { department: purchase.department },
      });
      const categoryId = defaultCategory ? defaultCategory.id : 1;

      for (const item of purchase.items) {
        let targetProductId = item.productId;

        // If no product is linked yet, create a new product or link to an existing matching name
        if (!targetProductId) {
          const existingProduct = await tx.product.findFirst({
            where: {
              name: { equals: item.itemName, mode: "insensitive" },
              department: purchase.department,
            },
          });

          if (existingProduct) {
            targetProductId = existingProduct.id;
          } else {
            const newProd = await tx.product.create({
              data: {
                name: item.itemName.trim(),
                categoryId,
                department: purchase.department,
                productType: purchase.department === "ELECTRONICS" ? "electronics" : "quantity",
                costPrice: Number(item.unitCostPrice),
                sellingPrice: Number(item.unitCostPrice) * 1.25,
                warrantyMonths: item.warrantyMonths || (purchase.department === "ELECTRONICS" ? 12 : null),
                quantityInStock: 0,
                isActive: true,
              },
            });
            targetProductId = newProd.id;
          }

          // Link the purchase item to the product
          await tx.purchaseItem.update({
            where: { id: item.id },
            data: { productId: targetProductId },
          });
        }

        // Increment inventory stock and update cost price with latest purchase rate
        await tx.product.update({
          where: { id: targetProductId },
          data: {
            quantityInStock: { increment: item.quantity },
            costPrice: Number(item.unitCostPrice),
            ...(item.warrantyMonths ? { warrantyMonths: item.warrantyMonths } : {}),
          },
        });

        // Create StockInRecord audit entry
        await tx.stockInRecord.create({
          data: {
            productId: targetProductId,
            quantityAdded: item.quantity,
            costPrice: Number(item.unitCostPrice),
            addedByUserId: currentUserId,
          },
        });

        // Handle serialized units if provided
        if (item.serialNumbers) {
          const serials = item.serialNumbers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          for (const sn of serials) {
            const existingUnit = await tx.productUnit.findUnique({
              where: { imeiNumber: sn },
            });
            if (!existingUnit) {
              await tx.productUnit.create({
                data: {
                  productId: targetProductId,
                  imeiNumber: sn,
                  status: "in_stock",
                  costPrice: Number(item.unitCostPrice),
                },
              });
            }
          }
        }
      }

      // Mark purchase as stock added
      return await tx.purchase.update({
        where: { id: purchaseId },
        data: { isStockAdded: true },
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
    });

    return NextResponse.json({
      message: "Stock successfully added to inventory.",
      purchase: updatedPurchase,
    });
  } catch (error) {
    console.error("Error receiving stock for purchase:", error);
    return NextResponse.json(
      { error: "Failed to add purchase stock to inventory" },
      { status: 500 }
    );
  }
}

