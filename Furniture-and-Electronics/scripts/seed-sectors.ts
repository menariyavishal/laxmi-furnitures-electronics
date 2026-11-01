import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

const { neonConfig } = require("@neondatabase/serverless");
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment.");
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedSectors() {
  console.log("🌱 Seeding Laxmi Electronics & Furnitures Categories and Products...");

  // 1. FURNITURE CATEGORIES
  const furnitureCategories = [
    { name: "Double Beds & Bedroom", department: "FURNITURE" },
    { name: "Living Room Sofas", department: "FURNITURE" },
    { name: "Dining Sets", department: "FURNITURE" },
    { name: "Wardrobes & Almirahs", department: "FURNITURE" },
    { name: "Dressing Tables", department: "FURNITURE" },
  ];

  const catMap: Record<string, number> = {};

  for (const cat of furnitureCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { department: cat.department, isActive: true },
      });
      catMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name: cat.name, department: cat.department, isActive: true },
      });
      catMap[cat.name] = created.id;
    }
  }

  // 2. ELECTRONICS CATEGORIES
  const electronicsCategories = [
    { name: "Smart Televisions", department: "ELECTRONICS" },
    { name: "Refrigerators", department: "ELECTRONICS" },
    { name: "Air Conditioners", department: "ELECTRONICS" },
    { name: "Washing Machines", department: "ELECTRONICS" },
    { name: "Microwave & Kitchen", department: "ELECTRONICS" },
  ];

  for (const cat of electronicsCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { department: cat.department, isActive: true },
      });
      catMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name: cat.name, department: cat.department, isActive: true },
      });
      catMap[cat.name] = created.id;
    }
  }

  console.log("✅ Categories updated/created with departments.");

  // 3. SAMPLE PRODUCTS
  const productsToSeed = [
    // Furniture Items
    {
      name: "King Size Sheesham Wood Bed with Box Storage",
      brand: "Laxmi Craft",
      categoryName: "Double Beds & Bedroom",
      department: "FURNITURE",
      sellingPrice: 38000,
      costPrice: 28000,
      stock: 5,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "Solid Sheesham wood king size double bed with dual hydraulic storage boxes.",
    },
    {
      name: "Queen Size Headboard Bed with Side Drawers",
      brand: "Laxmi Craft",
      categoryName: "Double Beds & Bedroom",
      department: "FURNITURE",
      sellingPrice: 32000,
      costPrice: 23000,
      stock: 6,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "Teak finish queen size bed with cushioned backrest and storage.",
    },
    {
      name: "7-Seater Luxury L-Shape Fabric Sofa Set (Royal Blue)",
      brand: "Comfort Plus",
      categoryName: "Living Room Sofas",
      department: "FURNITURE",
      sellingPrice: 45000,
      costPrice: 32000,
      stock: 4,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "High density foam 7-seater sectional sofa with washable velvet upholstery.",
    },
    {
      name: "5-Seater Teak Wood Carved Sofa with Glass Center Table",
      brand: "Royal Heritage",
      categoryName: "Living Room Sofas",
      department: "FURNITURE",
      sellingPrice: 52000,
      costPrice: 39000,
      stock: 3,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "Traditional Rajasthani hand-carved solid teak wood sofa set.",
    },
    {
      name: "6-Seater Solid Sheesham Dining Table with Chairs",
      brand: "Laxmi Craft",
      categoryName: "Dining Sets",
      department: "FURNITURE",
      sellingPrice: 28500,
      costPrice: 20000,
      stock: 6,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "Durable 6-chair dining table set with warm walnut polish finish.",
    },
    {
      name: "3-Door Heavy Steel Wedding Almirah with Locker",
      brand: "Triveni",
      categoryName: "Wardrobes & Almirahs",
      department: "FURNITURE",
      sellingPrice: 18500,
      costPrice: 14000,
      stock: 10,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "Classic wedding gift almirah with double locking mechanism and full mirror door.",
    },
    {
      name: "Full Length Dressing Table with Mirror & Drawer",
      brand: "Laxmi Craft",
      categoryName: "Dressing Tables",
      department: "FURNITURE",
      sellingPrice: 11500,
      costPrice: 8000,
      stock: 8,
      productType: "non-serialized",
      warrantyMonths: null,
      description: "Modern dressing unit with concealed cosmetics shelving and LED backlight mirror.",
    },

    // Electronics Items
    {
      name: 'Samsung 55" Crystal 4K UHD Smart TV (55DUE7700)',
      brand: "Samsung",
      categoryName: "Smart Televisions",
      department: "ELECTRONICS",
      sellingPrice: 44990,
      costPrice: 38500,
      stock: 8,
      productType: "electronics",
      warrantyMonths: 24,
      description: "55-inch Ultra HD Smart LED TV with HDR10+, PurColor and voice remote.",
    },
    {
      name: 'LG 43" 4K Ultra HD Smart LED TV (43UR7500)',
      brand: "LG",
      categoryName: "Smart Televisions",
      department: "ELECTRONICS",
      sellingPrice: 31990,
      costPrice: 26500,
      stock: 10,
      productType: "electronics",
      warrantyMonths: 24,
      description: "43-inch AI ThinQ 4K Smart WebOS television with Magic Remote.",
    },
    {
      name: "LG 260L Double Door Frost-Free Refrigerator (GL-S292)",
      brand: "LG",
      categoryName: "Refrigerators",
      department: "ELECTRONICS",
      sellingPrice: 26500,
      costPrice: 22000,
      stock: 7,
      productType: "electronics",
      warrantyMonths: 12,
      description: "Smart Inverter compressor double door fridge with Multi Air Flow.",
    },
    {
      name: "Whirlpool 192L Single Door Refrigerator (205 WDE)",
      brand: "Whirlpool",
      categoryName: "Refrigerators",
      department: "ELECTRONICS",
      sellingPrice: 16200,
      costPrice: 13500,
      stock: 12,
      productType: "electronics",
      warrantyMonths: 12,
      description: "Direct-cool single door refrigerator with insulated capillary technology.",
    },
    {
      name: "Voltas 1.5 Ton 3-Star Inverter Split AC (183V Vectra)",
      brand: "Voltas",
      categoryName: "Air Conditioners",
      department: "ELECTRONICS",
      sellingPrice: 35500,
      costPrice: 29500,
      stock: 6,
      productType: "electronics",
      warrantyMonths: 24,
      description: "Copper condenser high ambient cooling split AC with antibacterial filter.",
    },
    {
      name: "IFB 7 Kg 5-Star Front Load Washing Machine (Senator)",
      brand: "IFB",
      categoryName: "Washing Machines",
      department: "ELECTRONICS",
      sellingPrice: 32000,
      costPrice: 26000,
      stock: 6,
      productType: "electronics",
      warrantyMonths: 48,
      description: "AI powered Steam wash front load machine with 4 years comprehensive warranty.",
    },
    {
      name: "IFB 23L Convection Microwave Oven (23BC4)",
      brand: "IFB",
      categoryName: "Microwave & Kitchen",
      department: "ELECTRONICS",
      sellingPrice: 13500,
      costPrice: 10500,
      stock: 12,
      productType: "electronics",
      warrantyMonths: 12,
      description: "Stainless steel cavity convection microwave with 71 auto cook menus.",
    },
  ];

  for (const p of productsToSeed) {
    const categoryId = catMap[p.categoryName];
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: { name: p.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          department: p.department,
          brand: p.brand,
          sellingPrice: p.sellingPrice,
          costPrice: p.costPrice,
          quantityInStock: p.stock,
          productType: p.productType,
          warrantyMonths: p.warrantyMonths,
          isActive: true,
        },
      });
      console.log(`Updated product: ${p.name}`);
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          brand: p.brand,
          categoryId,
          department: p.department,
          sellingPrice: p.sellingPrice,
          costPrice: p.costPrice,
          quantityInStock: p.stock,
          productType: p.productType,
          warrantyMonths: p.warrantyMonths,
          isActive: true,
        },
      });
      console.log(`Created product: ${p.name}`);
    }
  }

  console.log("🎉 Successfully seeded showroom products for Furniture and Electronics!");
}

seedSectors()
  .catch((e) => {
    console.error("Error seeding sectors:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
