import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const isFiltered = department && department !== "ALL";
    const deptFilter = isFiltered ? department.toUpperCase() : undefined;

    // 1. Basic Counts & Stock
    // Fetch only needed fields instead of entire product row
    const productsLite = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(deptFilter && { department: deptFilter }),
      },
      select: { id: true, name: true, quantityInStock: true, costPrice: true, lowStockThreshold: true }
    });

    const totalProducts = productsLite.length;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of productsLite) {
      totalStockUnits += p.quantityInStock;
      totalStockValue += Number(p.costPrice) * p.quantityInStock;
      if (p.quantityInStock === 0) {
        outOfStockCount++;
      } else if (p.quantityInStock <= p.lowStockThreshold) {
        lowStockCount++;
      }
    }

    const totalCategories = await prisma.category.count({
      where: {
        isActive: true,
        ...(deptFilter && { department: deptFilter }),
      }
    });

    // 2. Sales calculations (Today & Month)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayBills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: { gte: todayStart },
        ...(deptFilter && { department: deptFilter }),
      },
      include: {
        billItems: {
          include: {
            product: true,
            productUnit: true
          }
        }
      }
    });

    let todaySales = 0;
    let todayCost = 0;
    const todaySoldItems: any[] = [];
    
    for (const b of todayBills) {
      todaySales += Number(b.totalAmount);
      
      // Calculate true gross total of the bill from line items to accurately distribute discount
      const trueBillGross = b.billItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const billDiscount = Number(b.discount || 0);

      for (const item of b.billItems) {
        const itemCostPrice = item.productUnit
          ? Number(item.productUnit.costPrice) * item.quantity
          : Number(item.product.costPrice) * item.quantity;
        todayCost += itemCostPrice;
        
        const lineTotal = Number(item.lineTotal);
        const proportion = trueBillGross > 0 ? (lineTotal / trueBillGross) : 0;
        const itemDiscount = billDiscount * proportion;
        const netProfit = (lineTotal - itemDiscount) - itemCostPrice;
        
        todaySoldItems.push({
          id: item.id,
          productName: item.product.name,
          productType: item.product.productType,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: lineTotal,
          imeiNumber: item.productUnit?.imeiNumber,
          billNumber: b.billNumber,
          netProfit: netProfit
        });
      }
    }

    const todayProfit = todaySales - todayCost;

    const monthlySalesAgg = await prisma.bill.aggregate({
      where: {
        status: "completed",
        createdAt: { gte: monthStart },
        ...(deptFilter && { department: deptFilter }),
      },
      _sum: { totalAmount: true }
    });
    const monthlySales = Number(monthlySalesAgg._sum.totalAmount || 0);

    // 3. Category-wise stock distribution
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        ...(deptFilter && { department: deptFilter }),
      },
      select: {
        name: true,
        products: {
          where: {
            isActive: true,
            ...(deptFilter && { department: deptFilter }),
          },
          select: { quantityInStock: true }
        }
      }
    });

    const categoryStock = categories.map(cat => ({
      name: cat.name,
      stock: cat.products.reduce((sum, p) => sum + p.quantityInStock, 0)
    })).filter(c => c.stock > 0);

    // 4. Sales trends
    // Fetch all completed bills from the last 6 months once (selecting only date & amount)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const allRecentBills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: { gte: sixMonthsAgo },
        ...(deptFilter && { department: deptFilter }),
      },
      select: { createdAt: true, totalAmount: true }
    });

    // 5. Pending Delivery Count for bookings
    const pendingDeliveriesCount = await prisma.booking.count({
      where: {
        status: { in: ["CONFIRMED", "PARTIALLY_DELIVERED"] },
      },
    });

    // Daily trend (last 7 days)
    const dailyTrend: { name: string; sales: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      
      const daySales = allRecentBills
        .filter(b => b.createdAt.getTime() >= start && b.createdAt.getTime() < end)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
      dailyTrend.push({ name: dateStr, sales: daySales });
    }

    // Weekly trend (last 4 weeks)
    const weeklyTrend: { name: string; sales: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - (i * 7 + 6));
      dStart.setHours(0, 0, 0, 0);
      const start = dStart.getTime();
      
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - (i * 7));
      dEnd.setHours(23, 59, 59, 999);
      const end = dEnd.getTime();

      const weekSales = allRecentBills
        .filter(b => b.createdAt.getTime() >= start && b.createdAt.getTime() <= end)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
      weeklyTrend.push({ name: `Week -${i}`, sales: weekSales });
    }

    // Monthly trend (last 6 calendar months)
    const monthlyTrend: { name: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      
      const mSales = allRecentBills
        .filter(b => b.createdAt.getTime() >= start && b.createdAt.getTime() < end)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
      monthlyTrend.push({ name: monthLabel, sales: mSales });
    }

    // 5. Product Movement (Fast/Slow moving products)
    // Filtered to last 30 days, using database grouping!
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movementAgg = await prisma.billItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        bill: {
          status: "completed",
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    });

    const fastMoving = movementAgg
      .map(agg => {
        const p = productsLite.find(prod => prod.id === agg.productId);
        return {
          id: agg.productId,
          name: p ? p.name : "Unknown",
          quantity: agg._sum.quantity || 0
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .filter(p => p.quantity > 0);

    const slowMoving = productsLite
      .filter(p => p.quantityInStock > 0)
      .map(p => {
        const agg = movementAgg.find(a => a.productId === p.id);
        return {
          id: p.id,
          name: p.name,
          quantity: agg ? (agg._sum.quantity || 0) : 0
        };
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
    const isStaff = session.user.role === "staff";

    const sanitizedSoldItems = isStaff
      ? todaySoldItems.map((item) => {
          const { netProfit, ...rest } = item;
          return { ...rest, netProfit: null };
        })
      : todaySoldItems;

    return NextResponse.json({
      totalProducts,
      totalStockUnits,
      totalStockValue: isStaff ? null : totalStockValue,
      totalCategories,
      todayProfit: isStaff ? null : todayProfit,
      todaySales,
      todaySoldItems: sanitizedSoldItems,
      monthlySales,
      lowStockCount,
      outOfStockCount,
      categoryStock,
      trends: {
        daily: dailyTrend,
        weekly: weeklyTrend,
        monthly: monthlyTrend
      },
      movement: {
        fastMoving,
        slowMoving
      },
      pendingDeliveriesCount,
      department: deptFilter || "ALL"
    });

  } catch (error) {
    console.error("Error generating dashboard statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
