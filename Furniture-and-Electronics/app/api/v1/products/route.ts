import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// In-memory cache for excluded category IDs (10-minute TTL)
const categoryCache = new Map<string, { ids: number[]; timestamp: number }>();
const CATEGORY_CACHE_TTL = 10 * 60 * 1000;

async function getExcludedCategoryIds(categoryName: string): Promise<number[]> {
  const key = categoryName.trim().toLowerCase();
  const cached = categoryCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < CATEGORY_CACHE_TTL) {
    return cached.ids;
  }
  const excludeCat = await prisma.category.findFirst({
    where: { name: { equals: categoryName.trim(), mode: "insensitive" as const } },
    include: { subCategories: { select: { id: true } } },
  });
  if (!excludeCat) return [];
  const ids = [excludeCat.id, ...excludeCat.subCategories.map((sc) => sc.id)];
  categoryCache.set(key, { ids, timestamp: now });
  return ids;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const excludeCategoryName = searchParams.get("excludeCategoryName");
    const productType = searchParams.get("productType");
    const excludeProductType = searchParams.get("excludeProductType");
    const department = searchParams.get("department");

    const where: any = { isActive: true };

    if (department && department !== "ALL") {
      where.department = { equals: department.toUpperCase(), mode: "insensitive" };
    }

    if (productType) {
      where.productType = productType;
    } else if (excludeProductType) {
      where.productType = { not: excludeProductType };
    }

    if (categoryId) {
      const catId = parseInt(categoryId);
      const subCats = await prisma.category.findMany({
        where: { parentCategoryId: catId },
        select: { id: true },
      });
      const catIds = [catId, ...subCats.map((sc) => sc.id)];
      where.categoryId = {
        in: catIds,
      };
    }

    if (excludeCategoryName) {
      const excludeCatIds = await getExcludedCategoryIds(excludeCategoryName);
      if (excludeCatIds.length > 0) {
        where.categoryId = {
          ...(where.categoryId || {}),
          notIn: excludeCatIds,
        };
      }
    }

    if (search && search.trim()) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      if (words.length === 1) {
        const term = words[0];
        const orConditions: any[] = [
          { name: { contains: term, mode: "insensitive" as const } },
          { brand: { contains: term, mode: "insensitive" as const } },
          { barcode: { contains: term, mode: "insensitive" as const } },
          { category: { name: { contains: term, mode: "insensitive" as const } } },
        ];
        if (/\d/.test(term)) {
          orConditions.push({
            units: { some: { imeiNumber: { contains: term, mode: "insensitive" as const } } },
          });
        }
        where.OR = orConditions;
      } else {
        // Multi-word search (e.g. "dell mouse", "mouse wire")
        where.AND = words.map((word) => {
          const wordConditions: any[] = [
            { name: { contains: word, mode: "insensitive" as const } },
            { brand: { contains: word, mode: "insensitive" as const } },
            { barcode: { contains: word, mode: "insensitive" as const } },
            { category: { name: { contains: word, mode: "insensitive" as const } } },
          ];
          if (/\d/.test(word)) {
            wordConditions.push({
              units: { some: { imeiNumber: { contains: word, mode: "insensitive" as const } } },
            });
          }
          return { OR: wordConditions };
        });
      }
    }

    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");
    
    // Clamp pagination safely (1-100) to prevent memory exhaustion
    const page = Math.max(parseInt(pageStr || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitStr || "50", 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    // Fetch limit + 1 to determine hasMore in ONE single query, avoiding the slow COUNT(*) table scan
    const take = limit + 1;

    let rawProducts: any[] = [];
    try {
      rawProducts = await prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: {
            include: {
              parentCategory: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (findErr: any) {
      // If dev server holds a stale Prisma client without `department` field on Product
      if (findErr.message && findErr.message.includes("department")) {
        console.warn("⚠️ Stale Prisma client in memory; using category resolution fallback for department filter...");
        const deptUpper = department ? department.toUpperCase() : undefined;
        delete where.department;

        if (deptUpper && deptUpper !== "ALL") {
          const matchingCats = await prisma.category.findMany({
            where: {
              OR: [
                ...(deptUpper === "FURNITURE" ? [
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
                ]),
              ] as any,
            },
            select: { id: true },
          }).catch(() => []);

          if (matchingCats.length > 0) {
            where.categoryId = { in: matchingCats.map((c) => c.id) };
          }
        }

        rawProducts = await prisma.product.findMany({
          where,
          skip,
          take,
          include: {
            category: {
              include: {
                parentCategory: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } else {
        throw findErr;
      }
    }

    const hasMore = rawProducts.length > limit;
    const products = hasMore ? rawProducts.slice(0, limit) : rawProducts;

    // Mask cost price for staff
    let finalProducts = products;
    if (session.user.role === "staff") {
      finalProducts = products.map((product) => {
        const { costPrice, ...rest } = product;
        return rest as any;
      });
    }

    if (pageStr || limitStr) {
      return NextResponse.json({
        items: finalProducts,
        hasMore,
        total: products.length
      });
    }

    // Backward compatibility for calls without pagination params
    return NextResponse.json(finalProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      categoryId,
      name,
      brand,
      productType,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      initialQuantity,
      imeis,
      imageUrl,
      barcode,
      department,
      warrantyMonths,
    } = body;

    if (!categoryId || !name || !productType || !costPrice || !sellingPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dept = department ? department.toUpperCase() : "FURNITURE";

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const newProduct = await tx.product.create({
        data: {
          categoryId: parseInt(categoryId),
          department: dept,
          name,
          brand,
          productType,
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          lowStockThreshold: parseInt(lowStockThreshold) || 5,
          warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : 12,
          imageUrl,
          barcode: barcode || null,
          quantityInStock: 0,
        },
      });

      let quantityAdded = 0;

      if (productType === "serialized" || productType === "electronics") {
        if (imeis && Array.isArray(imeis) && imeis.length > 0) {
          quantityAdded = imeis.length;

          // Create product units
          const unitData = imeis.map((imei: string) => ({
            productId: newProduct.id,
            imeiNumber: imei.trim(),
            status: "in_stock",
            costPrice: parseFloat(costPrice),
          }));

          await tx.productUnit.createMany({
            data: unitData,
          });
        }
      } else {
        const qty = parseInt(initialQuantity);
        if (qty && qty > 0) {
          quantityAdded = qty;
        }
      }

      if (quantityAdded > 0) {
        // Create stock-in record
        await tx.stockInRecord.create({
          data: {
            productId: newProduct.id,
            quantityAdded,
            costPrice: parseFloat(costPrice),
            addedByUserId: parseInt(session.user.id),
          },
        });

        // Update the quantity in stock
        return await tx.product.update({
          where: { id: newProduct.id },
          data: {
            quantityInStock: quantityAdded,
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "One or more IMEIs already exist in the system." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
