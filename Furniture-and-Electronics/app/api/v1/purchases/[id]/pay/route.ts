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
    const purchaseId = parseInt(id);
    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      amountPaid: inputAmount,
      paymentMode = "CASH",
      transactionRef,
      notes,
    } = body;

    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "A valid positive installment amount is required" }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const currentDue = Number(purchase.dueAmount);
    if (currentDue <= 0) {
      return NextResponse.json({ error: "This purchase has already been fully paid" }, { status: 400 });
    }

    const actualPayment = Math.min(amount, currentDue);
    const newPaid = Number(purchase.paidAmount) + actualPayment;
    const newDue = Math.max(0, currentDue - actualPayment);
    const newStatus = newDue === 0 ? "PAID" : "PARTIAL";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const paymentRecord = await tx.purchasePayment.create({
        data: {
          purchaseId,
          amountPaid: actualPayment,
          paymentDate: new Date(),
          paymentMode,
          transactionRef: transactionRef?.trim() || null,
          notes: notes?.trim() || "Installment settlement",
        },
      });

      // 2. Update Purchase Balance
      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newStatus,
        },
        include: {
          vendor: true,
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      });

      return { paymentRecord, updatedPurchase };
    });

    // Auto-dispatch WhatsApp Payment Advice to Vendor / Supplier
    const vendorPhone = result.updatedPurchase.vendor?.phone;
    if (vendorPhone) {
      try {
        const { dispatchWhatsappNotification } = await import("@/lib/whatsapp/dispatch");
        const { formatVendorPaymentMessage } = await import("@/lib/whatsapp/templates");

        const isFullySettled = newDue === 0;
        const vendorMsg = formatVendorPaymentMessage({
          vendorName: result.updatedPurchase.vendor.name,
          purchaseNumber: result.updatedPurchase.purchaseNumber,
          amountPaid: actualPayment,
          paymentMode,
          transactionRef: transactionRef?.trim() || null,
          paymentDate: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          totalAmount: Number(result.updatedPurchase.totalAmount),
          paidAmount: Number(result.updatedPurchase.paidAmount),
          dueAmount: Number(result.updatedPurchase.dueAmount),
          isFullySettled,
        });

        await dispatchWhatsappNotification({
          phone: vendorPhone,
          text: vendorMsg,
          billNumber: result.updatedPurchase.purchaseNumber,
          customerName: result.updatedPurchase.vendor.name,
          isVendor: true,
        });
      } catch (waErr) {
        console.error("Failed to dispatch vendor payment WhatsApp message:", waErr);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error settling purchase installment:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}

