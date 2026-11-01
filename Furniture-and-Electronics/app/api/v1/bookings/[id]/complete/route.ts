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
    const bookingId = parseInt(id, 10);
    if (!bookingId || isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        bookingItems: {
          include: {
            product: true,
          },
        },
        bills: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const now = new Date();

    // Update booking status to COMPLETED and all delivery schedules to DELIVERED
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const completed = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          remainingBalance: 0,
        },
      });

      await tx.deliverySchedule.updateMany({
        where: { bookingId },
        data: {
          status: "DELIVERED",
          actualDelivery: now,
        },
      });

      return completed;
    });

    // Auto-dispatch Settlement WhatsApp Message to Customer
    if (booking.customer?.phone) {
      try {
        const { dispatchWhatsappNotification } = await import("@/lib/whatsapp/dispatch");
        const { formatBookingSettledMessage } = await import("@/lib/whatsapp/templates");

        const customerName = booking.customer?.name || "Valued Customer";
        const settledMsg = formatBookingSettledMessage({
          customerName,
          bookingNumber: booking.bookingNumber,
          totalAmount: Number(booking.totalEstimatedAmount),
        });

        await dispatchWhatsappNotification({
          phone: booking.customer.phone,
          text: settledMsg,
          billNumber: booking.bookingNumber,
          customerName,
        });
      } catch (waErr) {
        console.error("Failed to dispatch booking settlement WhatsApp message:", waErr);
      }
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error("Error completing booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark booking as completed" },
      { status: 500 }
    );
  }
}
