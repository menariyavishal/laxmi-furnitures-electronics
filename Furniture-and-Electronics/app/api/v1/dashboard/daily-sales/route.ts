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
    const dateParam = searchParams.get("date"); // can be DD-MM-YYYY or YYYY-MM-DD

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // 1-12
    let day = now.getDate();

    if (dateParam && dateParam.trim().length > 0) {
      const parts = dateParam.trim().split(/[-/]/).map(p => parseInt(p, 10));
      if (parts.length === 3 && !parts.some(isNaN)) {
        if (parts[0] > 1000) {
          // Format: YYYY-MM-DD
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else {
          // Format: DD-MM-YYYY
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }
      }
    }

    // Define precise local day range 00:00:00.000 to 23:59:59.999
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const formattedDateDDMMYYYY = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
    const formattedDateYYYYMMDD = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const bills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        billItems: {
          include: {
            product: true,
            productUnit: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let totalSales = 0;
    let totalCost = 0;
    let totalItems = 0;
    const soldItems: any[] = [];

    for (const b of bills) {
      totalSales += Number(b.totalAmount);

      // Calculate true gross total of the bill from line items to accurately distribute discount
      const trueBillGross = b.billItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const billDiscount = Number(b.discount || 0);

      for (const item of b.billItems) {
        totalItems += item.quantity;
        const itemCostPrice = item.productUnit
          ? Number(item.productUnit.costPrice) * item.quantity
          : Number(item.product.costPrice) * item.quantity;
        totalCost += itemCostPrice;

        const lineTotal = Number(item.lineTotal);
        const proportion = trueBillGross > 0 ? (lineTotal / trueBillGross) : 0;
        const itemDiscount = billDiscount * proportion;
        const netProfit = (lineTotal - itemDiscount) - itemCostPrice;

        soldItems.push({
          id: item.id,
          billId: b.id,
          billNumber: b.billNumber,
          productName: item.product.name,
          productType: item.product.productType,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: lineTotal,
          imeiNumber: item.productUnit?.imeiNumber || null,
          netProfit: netProfit,
          createdAt: b.createdAt,
        });
      }
    }

    const totalProfit = totalSales - totalCost;
    const isStaff = session.user.role === "staff";

    return NextResponse.json({
      date: formattedDateDDMMYYYY,
      isoDate: formattedDateYYYYMMDD,
      totalSales,
      totalProfit: isStaff ? null : totalProfit,
      totalItems,
      soldItems: isStaff
        ? soldItems.map((item) => ({ ...item, netProfit: null }))
        : soldItems,
    });
  } catch (error: any) {
    console.error("Error fetching daily sales:", error);
    return NextResponse.json({ error: "Failed to fetch daily sales" }, { status: 500 });
  }
}
