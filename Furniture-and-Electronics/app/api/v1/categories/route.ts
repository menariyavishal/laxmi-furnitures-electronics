import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    const where: any = { isActive: true };
    if (department && department !== "ALL") {
      where.department = { equals: department.toUpperCase(), mode: "insensitive" };
    }

    let categories: any[] = [];
    try {
      categories = await prisma.category.findMany({
        where,
        include: {
          subCategories: true,
        },
        orderBy: { name: "asc" },
      });
    } catch (catErr: any) {
      if (catErr.message && catErr.message.includes("department")) {
        console.warn("⚠️ Stale Prisma client in memory; using name-based category filter fallback...");
        const deptUpper = department ? department.toUpperCase() : undefined;
        delete where.department;

        if (deptUpper && deptUpper !== "ALL") {
          where.OR = (deptUpper === "FURNITURE" ? [
            { name: { contains: "Bed", mode: "insensitive" } },
            { name: { contains: "Sofa", mode: "insensitive" } },
            { name: { contains: "Dining", mode: "insensitive" } },
            { name: { contains: "Wardrobe", mode: "insensitive" } },
            { name: { contains: "Almirah", mode: "insensitive" } },
            { name: { contains: "Dressing", mode: "insensitive" } },
            { name: { contains: "Furniture", mode: "insensitive" } },
          ] : [
            { name: { contains: "TV", mode: "insensitive" } },
            { name: { contains: "Television", mode: "insensitive" } },
            { name: { contains: "Refrigerator", mode: "insensitive" } },
            { name: { contains: "Fridge", mode: "insensitive" } },
            { name: { contains: "AC", mode: "insensitive" } },
            { name: { contains: "Conditioner", mode: "insensitive" } },
            { name: { contains: "Washing", mode: "insensitive" } },
            { name: { contains: "Microwave", mode: "insensitive" } },
            { name: { contains: "Electronics", mode: "insensitive" } },
          ]) as any;
        }

        categories = await prisma.category.findMany({
          where,
          include: {
            subCategories: true,
          },
          orderBy: { name: "asc" },
        });
      } else {
        throw catErr;
      }
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, parentCategoryId, department } = body;
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const dept = department ? department.toUpperCase() : "FURNITURE";

    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        department: dept,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Category already exists in this division" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        department: dept,
        parentCategoryId: parentCategoryId || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
