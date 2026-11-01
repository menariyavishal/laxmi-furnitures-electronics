import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBookingDesign } from "@/lib/supabase/storage";
import { extractDesignPhotos } from "@/lib/booking-photos";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let bookingNumber = (formData.get("bookingNumber") as string) || "";
    const rawBookingId = formData.get("bookingId") as string | null;
    const bookingId = rawBookingId ? parseInt(rawBookingId, 10) : null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Max 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size exceeds 5MB limit" }, { status: 400 });
    }

    let booking: any = null;
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (booking) {
        bookingNumber = booking.bookingNumber;
      }
    }

    if (!bookingNumber) {
      bookingNumber = "ADB-MISC";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadBookingDesign(
      bookingNumber,
      file.name || "design.jpg",
      buffer,
      file.type || "image/jpeg"
    );

    // If attached to an existing booking, update the notes field with the public URL
    if (booking && bookingId) {
      const existingPhotos = extractDesignPhotos(booking.notes);
      const updatedPhotos = [...existingPhotos, result.publicUrl];
      const cleanNotes = booking.notes
        ? booking.notes.replace(/\[DESIGNS\]:\[.*?\]/g, "").trim()
        : "";
      const updatedNotes = cleanNotes
        ? `${cleanNotes}\n[DESIGNS]:${JSON.stringify(updatedPhotos)}`
        : `[DESIGNS]:${JSON.stringify(updatedPhotos)}`;

      await prisma.booking.update({
        where: { id: bookingId },
        data: { notes: updatedNotes },
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error uploading design image to Supabase:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload design image" },
      { status: 500 }
    );
  }
}

