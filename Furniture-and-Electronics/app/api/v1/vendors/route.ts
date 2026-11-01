import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { purchases: true },
        },
        purchases: {
          select: {
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
          },
        },
      },
    });

    // Format vendors with cumulative financial summary
    const formatted = vendors.map((v) => {
      const totalPurchased = v.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const totalPaid = v.purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0);
      const totalDue = v.purchases.reduce((sum, p) => sum + Number(p.dueAmount), 0);

      const { purchases, ...rest } = v;
      return {
        ...rest,
        totalPurchased,
        totalPaid,
        totalDue,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, address, gstin } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }
    if (!phone || !phone.trim() || phone.trim().length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit phone number is required" }, { status: 400 });
    }

    // Check if phone already exists
    const existing = await prisma.vendor.findFirst({
      where: { phone: phone.trim() },
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const reactivated = await prisma.vendor.update({
          where: { id: existing.id },
          data: {
            name: name.trim(),
            address: address?.trim() || existing.address,
            gstin: gstin?.trim() || existing.gstin,
            isActive: true,
          },
        });
        return NextResponse.json(reactivated, { status: 200 });
      }
      return NextResponse.json({ error: "A vendor with this phone number already exists" }, { status: 409 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        gstin: gstin?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

