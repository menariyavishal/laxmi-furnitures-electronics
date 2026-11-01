import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only owners can void bills" }, { status: 403 });
    }

    const { id } = await params;
    const billId = parseInt(id);

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        billItems: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.status === "voided") {
      return NextResponse.json({ error: "Bill is already voided" }, { status: 400 });
    }

    // Check same calendar day constraint
    const billDate = new Date(bill.createdAt);
    const today = new Date();
    const isSameDay = 
      billDate.getFullYear() === today.getFullYear() &&
      billDate.getMonth() === today.getMonth() &&
      billDate.getDate() === today.getDate();

    if (!isSameDay) {
      return NextResponse.json({ 
        error: "Voiding is restricted to the same calendar day as the bill creation date." 
      }, { status: 400 });
    }

    // Process reversion in transaction
    const updatedBill = await prisma.$transaction(async (tx) => {
      // 1. Update bill status
      const updated = await tx.bill.update({
        where: { id: billId },
        data: { status: "voided" },
      });

      // 2. Revert inventory increments
      for (const item of bill.billItems) {
        if (item.productUnitId) {
          // Serialized unit: set status back to in_stock and remove soldAt
          await tx.productUnit.update({
            where: { id: item.productUnitId },
            data: { status: "in_stock", soldAt: null },
          });

          // Increment product quantity by 1
          await tx.product.update({
            where: { id: item.productId },
            data: { quantityInStock: { increment: 1 } },
          });
        } else {
          // Quantity based product: increment product quantity
          await tx.product.update({
            where: { id: item.productId },
            data: { quantityInStock: { increment: item.quantity } },
          });
        }
      }

      return updated;
    },
    {
      maxWait: 10000,
      timeout: 25000,
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error("Error voiding bill:", error);
    return NextResponse.json({ error: error.message || "Failed to void bill" }, { status: 500 });
  }
}
