import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const days = parseInt(daysParam || "30");
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Fetch all active completed bills within the timeframe
    const bills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
        billItems: {
          select: {
            quantity: true,
            product: { select: { costPrice: true } },
            productUnit: { select: { costPrice: true } },
          },
        },
      },
    });

    let totalSales = 0;
    let totalCost = 0;

    for (const bill of bills) {
      // bill.totalAmount in DB is the final Gross Total (Selling Price after discount)
      totalSales += Number(bill.totalAmount);

      for (const item of bill.billItems) {
        if (item.productUnit) {
          totalCost += Number(item.productUnit.costPrice) * item.quantity;
        } else {
          totalCost += Number(item.product.costPrice) * item.quantity;
        }
      }
    }

    const netSales = totalSales;
    const totalProfit = netSales - totalCost;

    // Fetch low stock items count
    const lowStockCount = await prisma.product.count({
      where: {
        isActive: true,
        quantityInStock: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
    });

    return NextResponse.json({
      totalSales: netSales.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalBills: bills.length,
      lowStockCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
