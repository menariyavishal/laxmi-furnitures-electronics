import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { billIds } = body;

    if (!Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json({ error: "No billIds provided" }, { status: 400 });
    }

    const ids = billIds
      .map((id: any) => parseInt(id, 10))
      .filter((id: number) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json({ error: "Invalid billIds provided" }, { status: 400 });
    }

    const result = await prisma.bill.updateMany({
      where: { id: { in: ids } },
      data: {
        whatsappSentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Error snoozing overdue bills:", error);
    return NextResponse.json(
      { error: error.message || "Failed to snooze overdue bills" },
      { status: 500 }
    );
  }
}

