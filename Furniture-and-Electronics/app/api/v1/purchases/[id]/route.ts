import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const purchaseId = parseInt(id);
    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        vendor: true,
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
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    return NextResponse.json({ error: "Failed to fetch purchase" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only owner can delete purchases" }, { status: 403 });
    }

    const { id } = await params;
    const purchaseId = parseInt(id);
    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Atomic delete with inventory rollback if stock was added
    await prisma.$transaction(async (tx) => {
      if (purchase.isStockAdded) {
        for (const item of purchase.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantityInStock: {
                  decrement: Math.max(0, item.quantity),
                },
              },
            });
          }
        }
      }

      // Delete payments and items cascade, then purchase
      await tx.purchasePayment.deleteMany({ where: { purchaseId } });
      await tx.purchaseItem.deleteMany({ where: { purchaseId } });
      await tx.purchase.delete({ where: { id: purchaseId } });
    });

    return NextResponse.json({ success: true, message: "Purchase deleted and stock rolled back" });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json({ error: "Failed to delete purchase" }, { status: 500 });
  }
}
