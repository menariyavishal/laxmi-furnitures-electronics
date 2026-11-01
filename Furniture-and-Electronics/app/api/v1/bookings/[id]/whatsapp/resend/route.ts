import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dispatchWhatsappNotification } from "@/lib/whatsapp/dispatch";
import {
  formatBookingNewMessage,
  formatBookingSlipCopyMessage,
} from "@/lib/whatsapp/templates";
import { extractDesignPhotos } from "@/lib/booking-photos";

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

    const body = await req.json().catch(() => ({}));
    const { pdfBase64, isNewBooking = false } = body;

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

    const phone = booking.customer?.phone;
    if (!phone) {
      return NextResponse.json(
        { error: "Customer does not have a phone number attached" },
        { status: 400 }
      );
    }

    const formattedDeliveryDate = new Date(booking.expectedDeliveryDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const formattedEventDate = booking.eventDate
      ? new Date(booking.eventDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

    const furnitureItems = booking.bookingItems.filter((i) => i.department === "FURNITURE");
    const electronicsItems = booking.bookingItems.filter((i) => i.department === "ELECTRONICS");

    const furnitureSubtotal = furnitureItems.reduce(
      (sum, i) => sum + Number(i.lineTotal),
      0
    );
    const electronicsSubtotal = electronicsItems.reduce(
      (sum, i) => sum + Number(i.lineTotal),
      0
    );

    const furnitureBill = booking.bills?.find((b) => b.department === "FURNITURE");
    const designPhotos = extractDesignPhotos(booking.notes);

    const customerName = booking.customer?.name || "Customer";
    let messageText = "";
    if (isNewBooking) {
      messageText = formatBookingNewMessage({
        customerName,
        bookingNumber: booking.bookingNumber,
        expectedDeliveryDate: formattedDeliveryDate,
        eventDate: formattedEventDate,
        furnitureCount: furnitureItems.length,
        furnitureSubtotal,
        furnitureBillNumber: furnitureBill?.billNumber,
        electronicsCount: electronicsItems.length,
        electronicsSubtotal,
        totalAmount: Number(booking.totalEstimatedAmount),
        advancePaid: Number(booking.advancePaid),
        remainingBalance: Number(booking.remainingBalance),
        hasDesigns: designPhotos.length > 0,
      });
    } else {
      messageText = formatBookingSlipCopyMessage({
        customerName,
        bookingNumber: booking.bookingNumber,
        expectedDeliveryDate: formattedDeliveryDate,
        totalAmount: Number(booking.totalEstimatedAmount),
        advancePaid: Number(booking.advancePaid),
        remainingBalance: Number(booking.remainingBalance),
      });
    }

    const result = await dispatchWhatsappNotification({
      phone,
      text: messageText,
      pdfFilename: `BookingSlip_${booking.bookingNumber}.pdf`,
      pdfBase64,
      billId: furnitureBill?.id ?? 0,
      billNumber: booking.bookingNumber,
      customerName,
    });

    return NextResponse.json({
      success: result.success,
      deliveryId: result.deliveryId,
      error: result.error,
    });
  } catch (error: any) {
    console.error("Error dispatching booking slip via WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch booking slip" },
      { status: 500 }
    );
  }
}
