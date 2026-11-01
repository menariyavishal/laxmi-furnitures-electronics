import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Keep Neon serverless database active and verify connection
    await prisma.$queryRawUnsafe("SELECT 1");
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Health check / keep-alive failed:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Database connection error" },
      { status: 500 }
    );
  }
}
