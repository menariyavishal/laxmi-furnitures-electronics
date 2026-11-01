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
    const search = searchParams.get("search") || "";
    // If 'overdue' is true, we only fetch bills older than 15 days
    const overdueOnly = searchParams.get("overdue") === "true";
    const department = searchParams.get("department");

    const whereClause: any = {
      dueAmount: { gt: 0 },
      isSettled: false,
      paymentStatus: { in: ["PARTIAL", "UNPAID"] },
    };

    const andConditions: any[] = [];

    if (search && search.trim() !== "") {
      andConditions.push({
        OR: [
          { billNumber: { contains: search.trim(), mode: "insensitive" } },
          { customer: { phone: { contains: search.trim() } } },
          { customer: { name: { contains: search.trim(), mode: "insensitive" } } },
        ],
      });
    }

    if (department && department !== "ALL") {
      const deptUpper = department.toUpperCase();
      if (deptUpper === "FURNITURE" || deptUpper === "FURN") {
        andConditions.push({
          OR: [
            { department: { contains: "FURN", mode: "insensitive" } },
            { billNumber: { contains: "FURN", mode: "insensitive" } },
          ],
        });
      } else if (deptUpper === "ELECTRONICS" || deptUpper === "ELEC") {
        andConditions.push({
          OR: [
            { department: { contains: "ELEC", mode: "insensitive" } },
            { billNumber: { contains: "ELEC", mode: "insensitive" } },
          ],
        });
      }
    }

    if (overdueOnly) {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      whereClause.createdAt = {
        lt: fifteenDaysAgo,
      };

      andConditions.push({
        OR: [
          { whatsappSentAt: null },
          { whatsappSentAt: { lt: sevenDaysAgo } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    // Clamp pagination safely (1-100, default max 100) to prevent unbounded memory usage
    const page = pageStr ? Math.max(parseInt(pageStr, 10) || 1, 1) : 1;
    const limit = limitStr ? Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100) : 100;
    const skip = (page - 1) * limit;

    const dueBills = await prisma.bill.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(dueBills);
  } catch (error) {
    console.error("Error fetching due payments:", error);
    return NextResponse.json({ error: "Failed to fetch due payments" }, { status: 500 });
  }
}
