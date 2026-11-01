import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        purchases: {
          orderBy: { purchaseDate: "desc" },
          include: {
            items: true,
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const totalPurchased = vendor.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalPaid = vendor.purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const totalDue = vendor.purchases.reduce((sum, p) => sum + Number(p.dueAmount), 0);

    return NextResponse.json({
      ...vendor,
      totalPurchased,
      totalPaid,
      totalDue,
    });
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, address, gstin } = body;

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name: name?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
        gstin: gstin?.trim(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only owner can delete vendors" }, { status: 403 });
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    // Safety rule: Cannot delete vendor if any unpaid purchases exist
    const unpaidPurchases = await prisma.purchase.findFirst({
      where: {
        vendorId,
        dueAmount: { gt: 0 },
      },
    });

    if (unpaidPurchases) {
      return NextResponse.json(
        {
          error: "Cannot delete vendor with outstanding dues. Please settle all pending balances first.",
        },
        { status: 400 }
      );
    }

    // Soft delete vendor
    const softDeleted = await prisma.vendor.update({
      where: { id: vendorId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Vendor deleted successfully", vendor: softDeleted });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}

