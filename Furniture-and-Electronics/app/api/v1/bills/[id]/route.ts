import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const billId = parseInt(id);

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        customer: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
        billItems: {
          include: {
            product: true,
            productUnit: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 });
  }
}
