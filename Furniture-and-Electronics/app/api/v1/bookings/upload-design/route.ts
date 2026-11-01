import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadBookingDesign } from "@/lib/supabase/storage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bookingNumber = (formData.get("bookingNumber") as string) || "DRAFT";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Max 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size exceeds 5MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadBookingDesign(
      bookingNumber,
      file.name || "design.jpg",
      buffer,
      file.type || "image/jpeg"
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error uploading design image to Supabase:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload design image" },
      { status: 500 }
    );
  }
}

