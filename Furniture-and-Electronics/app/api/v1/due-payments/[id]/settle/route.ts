import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const billId = parseInt(resolvedParams.id);
    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    // Get the current bill
    const currentBill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!currentBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    let amountPaid: number | null = null;
    let paymentMode: string | null = null;
    let notes: string | null = null;

    try {
      const body = await req.json();
      if (body.amountPaid !== undefined && body.amountPaid !== null) {
        amountPaid = parseFloat(body.amountPaid);
      }
      if (body.paymentMode) {
        paymentMode = String(body.paymentMode).trim();
      }
      if (body.notes) {
        notes = String(body.notes).trim();
      }
    } catch {
      // Body may be empty if called without payload (default to full settlement)
    }

    const currentDue = Number(currentBill.dueAmount || 0);
    if (currentDue <= 0 && currentBill.isSettled) {
      return NextResponse.json(
        { error: "This bill has no outstanding due amount" },
        { status: 400 }
      );
    }

    // If amountPaid is not provided or <= 0, default to full remaining due
    const collectedAmount =
      amountPaid !== null && !isNaN(amountPaid) && amountPaid > 0
        ? Math.min(amountPaid, currentDue)
        : currentDue;

    const newPaidAmount = Number(currentBill.paidAmount || 0) + collectedAmount;
    const newDueAmount = Math.max(0, currentDue - collectedAmount);
    const isFullyPaid = newDueAmount === 0;
    const newPaymentStatus = isFullyPaid ? "PAID" : "PARTIAL";

    // Update the bill
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        paymentStatus: newPaymentStatus,
        isSettled: isFullyPaid,
        ...(paymentMode ? { paymentMode } : {}),
      },
      include: {
        customer: true,
      },
    });

    // If this bill is tied to an Advance Booking, accurately recalculate and synchronize the booking's remainingBalance
    if (currentBill.bookingId) {
      const allBills = await prisma.bill.findMany({
        where: { bookingId: currentBill.bookingId },
        select: { id: true, dueAmount: true },
      });
      const unbilledItems = await prisma.bookingItem.findMany({
        where: { bookingId: currentBill.bookingId, isBilled: false },
        select: { lineTotal: true },
      });

      // Sum dues of other bills + this bill's newDueAmount + unbilled package items
      const otherBillsDue = allBills
        .filter((b) => b.id !== billId)
        .reduce((sum, b) => sum + Number(b.dueAmount || 0), 0);
      const unbilledTotal = unbilledItems.reduce(
        (sum, i) => sum + Number(i.lineTotal || 0),
        0
      );
      const newRemainingBalance = Math.max(0, otherBillsDue + newDueAmount + unbilledTotal);

      await prisma.booking.update({
        where: { id: currentBill.bookingId },
        data: {
          remainingBalance: newRemainingBalance,
        },
      });
    }

    return NextResponse.json({
      success: true,
      bill: updatedBill,
      collectedAmount,
      isFullyPaid,
      newDueAmount,
    });
  } catch (error) {
    console.error("Error settling due payment:", error);
    return NextResponse.json(
      { error: "Failed to settle payment" },
      { status: 500 }
    );
  }
}
