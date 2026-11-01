import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment');
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Helper to generate a random 15-digit IMEI
function generateIMEI(): string {
  let imei = '86'; // Common TAC prefix
  while (imei.length < 15) {
    imei += Math.floor(Math.random() * 10).toString();
  }
  return imei;
}

// Helper to generate unique 12-digit barcode
function generateBarcode(prefix: number, index: number): string {
  return `${prefix}${String(index).padStart(8, '0')}`;
}

async function main() {
  console.log('🚀 Starting Realistic Inventory Seeding (120+ Products Across All Categories)...');

  // 1. Ensure Parent Categories
  const parentsData = [
    { name: 'Mobile' },
    { name: 'Accessories' },
    { name: 'Electronics' },
  ];

  const parentMap: Record<string, number> = {};
  for (const p of parentsData) {
    let cat = await prisma.category.findFirst({
      where: { name: p.name, parentCategoryId: null },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: p.name, isActive: true },
      });
    }
    parentMap[p.name.toLowerCase()] = cat.id;
  }
  console.log('✅ Parent Categories Verified:', parentMap);

  // 2. Ensure Subcategories
  const subCategoriesData = [
    // Mobile Brands
    { parent: 'mobile', name: 'Apple' },
    { parent: 'mobile', name: 'Samsung' },
    { parent: 'mobile', name: 'Oppo' },
    { parent: 'mobile', name: 'Vivo' },
    { parent: 'mobile', name: 'OnePlus' },
    { parent: 'mobile', name: 'Realme' },
    { parent: 'mobile', name: 'Mi' },
    { parent: 'mobile', name: 'Poco' },
    { parent: 'mobile', name: 'Motorola' },
    // Accessories
    { parent: 'accessories', name: 'Charger' },
    { parent: 'accessories', name: 'Cables' },
    { parent: 'accessories', name: 'Mobile Cover' },
    { parent: 'accessories', name: 'Screen Guard' },
    { parent: 'accessories', name: 'Headphones' },
    { parent: 'accessories', name: 'Speaker' },
    { parent: 'accessories', name: 'Smart Watches' },
    { parent: 'accessories', name: 'Power Bank' },
    // Electronics
    { parent: 'electronics', name: 'Computers & IT Hardware' },
    { parent: 'electronics', name: 'Storage & Drives' },
    { parent: 'electronics', name: 'Home Appliances' },
    { parent: 'electronics', name: 'Entertainment' },
  ];

  const subMap: Record<string, number> = {};
  for (const s of subCategoriesData) {
    const parentId = parentMap[s.parent];
    let cat = await prisma.category.findFirst({
      where: { name: s.name, parentCategoryId: parentId },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: s.name, parentCategoryId: parentId, isActive: true },
      });
    }
    subMap[s.name.toLowerCase()] = cat.id;
  }
  console.log(`✅ Subcategories verified (${Object.keys(subMap).length} categories ready).`);

  // 3. Product Catalog Definitions (120+ Products)
  const productDefinitions = [
    // ==================== APPLE (Mobile) ====================
    { name: 'iPhone 15 (128GB, Black)', brand: 'Apple', sub: 'apple', type: 'serialized', cost: 63000, sell: 69900, stock: 4 },
    { name: 'iPhone 15 (128GB, Blue)', brand: 'Apple', sub: 'apple', type: 'serialized', cost: 63000, sell: 69900, stock: 3 },
    { name: 'iPhone 15 Pro (256GB, Natural Titanium)', brand: 'Apple', sub: 'apple', type: 'serialized', cost: 118000, sell: 129900, stock: 2 },
    { name: 'iPhone 14 (128GB, Midnight)', brand: 'Apple', sub: 'apple', type: 'serialized', cost: 52000, sell: 58900, stock: 5 },
    { name: 'iPhone 13 (128GB, Starlight)', brand: 'Apple', sub: 'apple', type: 'serialized', cost: 44000, sell: 49900, stock: 4 },

    // ==================== SAMSUNG (Mobile) ====================
    { name: 'Galaxy S24 Ultra (256GB, Titanium Gray)', brand: 'Samsung', sub: 'samsung', type: 'serialized', cost: 112000, sell: 124999, stock: 2 },
    { name: 'Galaxy S23 FE (128GB, Graphite)', brand: 'Samsung', sub: 'samsung', type: 'serialized', cost: 38000, sell: 43999, stock: 4 },
    { name: 'Galaxy A55 5G (128GB, Awesome Iceblue)', brand: 'Samsung', sub: 'samsung', type: 'serialized', cost: 31000, sell: 35999, stock: 5 },
    { name: 'Galaxy A35 5G (128GB, Awesome Navy)', brand: 'Samsung', sub: 'samsung', type: 'serialized', cost: 24500, sell: 27999, stock: 6 },
    { name: 'Galaxy M15 5G (128GB, Celestial Blue)', brand: 'Samsung', sub: 'samsung', type: 'serialized', cost: 11500, sell: 13499, stock: 8 },

    // ==================== ONEPLUS (Mobile) ====================
    { name: 'OnePlus 12 (256GB, Silky Black)', brand: 'OnePlus', sub: 'oneplus', type: 'serialized', cost: 56000, sell: 62999, stock: 3 },
    { name: 'OnePlus 12R (128GB, Cool Blue)', brand: 'OnePlus', sub: 'oneplus', type: 'serialized', cost: 34000, sell: 38999, stock: 5 },
    { name: 'OnePlus Nord CE 4 (128GB, Dark Chrome)', brand: 'OnePlus', sub: 'oneplus', type: 'serialized', cost: 21500, sell: 24999, stock: 6 },
    { name: 'OnePlus Nord CE 4 Lite (128GB, Mega Blue)', brand: 'OnePlus', sub: 'oneplus', type: 'serialized', cost: 17000, sell: 19999, stock: 7 },

    // ==================== VIVO (Mobile) ====================
    { name: 'Vivo V30 Pro 5G (256GB, Andaman Blue)', brand: 'Vivo', sub: 'vivo', type: 'serialized', cost: 36000, sell: 41999, stock: 4 },
    { name: 'Vivo V30e 5G (128GB, Velvet Red)', brand: 'Vivo', sub: 'vivo', type: 'serialized', cost: 24000, sell: 27999, stock: 5 },
    { name: 'Vivo T3 5G (128GB, Cosmic Blue)', brand: 'Vivo', sub: 'vivo', type: 'serialized', cost: 17200, sell: 19999, stock: 8 },
    { name: 'Vivo Y28 5G (128GB, Crystal Purple)', brand: 'Vivo', sub: 'vivo', type: 'serialized', cost: 13500, sell: 15499, stock: 6 },

    // ==================== OPPO (Mobile) ====================
    { name: 'Oppo Reno 11 Pro 5G (256GB, Pearl White)', brand: 'Oppo', sub: 'oppo', type: 'serialized', cost: 34000, sell: 39999, stock: 3 },
    { name: 'Oppo F25 Pro 5G (128GB, Ocean Blue)', brand: 'Oppo', sub: 'oppo', type: 'serialized', cost: 21000, sell: 23999, stock: 5 },
    { name: 'Oppo A79 5G (128GB, Mystery Black)', brand: 'Oppo', sub: 'oppo', type: 'serialized', cost: 16200, sell: 18499, stock: 6 },
    { name: 'Oppo A59 5G (128GB, Silk Gold)', brand: 'Oppo', sub: 'oppo', type: 'serialized', cost: 12500, sell: 14499, stock: 7 },

    // ==================== REALME (Mobile) ====================
    { name: 'Realme 12 Pro+ 5G (256GB, Submarine Blue)', brand: 'Realme', sub: 'realme', type: 'serialized', cost: 26000, sell: 29999, stock: 4 },
    { name: 'Realme 12+ 5G (128GB, Pioneer Green)', brand: 'Realme', sub: 'realme', type: 'serialized', cost: 18000, sell: 20999, stock: 6 },
    { name: 'Realme Narzo 70 Pro 5G (128GB, Glass Green)', brand: 'Realme', sub: 'realme', type: 'serialized', cost: 17000, sell: 19999, stock: 5 },
    { name: 'Realme C65 5G (128GB, Feather Green)', brand: 'Realme', sub: 'realme', type: 'serialized', cost: 10500, sell: 12499, stock: 8 },

    // ==================== MI / REDMI (Mobile) ====================
    { name: 'Redmi Note 13 Pro+ 5G (256GB, Fusion Black)', brand: 'Mi', sub: 'mi', type: 'serialized', cost: 27000, sell: 30999, stock: 4 },
    { name: 'Redmi Note 13 5G (128GB, Prism Gold)', brand: 'Mi', sub: 'mi', type: 'serialized', cost: 15500, sell: 17999, stock: 7 },
    { name: 'Redmi 13C 5G (128GB, Startrail Green)', brand: 'Mi', sub: 'mi', type: 'serialized', cost: 10000, sell: 11999, stock: 9 },

    // ==================== POCO (Mobile) ====================
    { name: 'Poco X6 Pro 5G (256GB, Racing Yellow)', brand: 'Poco', sub: 'poco', type: 'serialized', cost: 23000, sell: 25999, stock: 5 },
    { name: 'Poco M6 Pro 5G (128GB, Forest Green)', brand: 'Poco', sub: 'poco', type: 'serialized', cost: 10200, sell: 11999, stock: 7 },

    // ==================== MOTOROLA (Mobile) ====================
    { name: 'Moto Edge 50 Fusion (128GB, Marshmallow Blue)', brand: 'Motorola', sub: 'motorola', type: 'serialized', cost: 20000, sell: 22999, stock: 5 },
    { name: 'Moto G64 5G (128GB, Mint Green)', brand: 'Motorola', sub: 'motorola', type: 'serialized', cost: 13200, sell: 14999, stock: 6 },

    // ==================== CHARGERS & ADAPTERS (Accessories) ====================
    { name: 'Apple 20W USB-C Power Adapter Original', brand: 'Apple', sub: 'charger', type: 'quantity', cost: 1350, sell: 1900, stock: 25 },
    { name: 'Samsung 25W Type-C Super Fast Charger', brand: 'Samsung', sub: 'charger', type: 'quantity', cost: 850, sell: 1299, stock: 30 },
    { name: 'OnePlus 65W SuperVOOC Fast Warp Adapter', brand: 'OnePlus', sub: 'charger', type: 'quantity', cost: 1200, sell: 1899, stock: 15 },
    { name: 'Boat Dual Port 33W Fast Wall Charger', brand: 'boAt', sub: 'charger', type: 'quantity', cost: 450, sell: 799, stock: 20 },
    { name: 'Portronics Adapto 65W GaN Multi-Port Charger', brand: 'Portronics', sub: 'charger', type: 'quantity', cost: 1100, sell: 1799, stock: 12 },
    { name: 'Ambrane 20W Boosted QC+PD Charger', brand: 'Ambrane', sub: 'charger', type: 'quantity', cost: 320, sell: 549, stock: 35 },

    // ==================== CABLES (Accessories) ====================
    { name: 'Boat Rugged v3 Braided Type-C Cable 1.5m', brand: 'boAt', sub: 'cables', type: 'quantity', cost: 120, sell: 299, stock: 50 },
    { name: 'Apple Lightning to Type-C Braided Cable 1m', brand: 'Apple', sub: 'cables', type: 'quantity', cost: 950, sell: 1599, stock: 20 },
    { name: 'Mi 2-in-1 Micro USB to Type-C Cable', brand: 'Mi', sub: 'cables', type: 'quantity', cost: 140, sell: 299, stock: 40 },
    { name: 'Portronics Konnect Pro 60W PD Cable', brand: 'Portronics', sub: 'cables', type: 'quantity', cost: 110, sell: 249, stock: 45 },
    { name: 'Realme 65W Vooc Super Dart Yellow Cable', brand: 'Realme', sub: 'cables', type: 'quantity', cost: 180, sell: 399, stock: 25 },

    // ==================== MOBILE COVERS (Accessories) ====================
    { name: 'iPhone 15 Matte MagSafe Silicone Case (Black)', brand: 'Spigen', sub: 'mobile cover', type: 'quantity', cost: 250, sell: 599, stock: 30 },
    { name: 'iPhone 14 Transparent Shockproof Armor Case', brand: 'Generic', sub: 'mobile cover', type: 'quantity', cost: 90, sell: 249, stock: 50 },
    { name: 'Samsung S24 Ultra Leather Protective Cover', brand: 'Ringke', sub: 'mobile cover', type: 'quantity', cost: 320, sell: 799, stock: 20 },
    { name: 'OnePlus 12 Carbon Fiber Slim Case', brand: 'Nillkin', sub: 'mobile cover', type: 'quantity', cost: 220, sell: 499, stock: 25 },
    { name: 'Vivo V30 Gradient Glitter Soft TPU Cover', brand: 'Generic', sub: 'mobile cover', type: 'quantity', cost: 75, sell: 199, stock: 40 },
    { name: 'Redmi Note 13 Pro 360-Degree Ring Stand Case', brand: 'Generic', sub: 'mobile cover', type: 'quantity', cost: 110, sell: 299, stock: 35 },

    // ==================== SCREEN GUARDS & TEMPERED GLASS (Accessories) ====================
    { name: '9D Full Edge-to-Edge Tempered Glass Universal', brand: 'Gorilla', sub: 'screen guard', type: 'quantity', cost: 40, sell: 149, stock: 120 },
    { name: 'SuperX Matte Anti-Glare Gaming Screen Guard', brand: 'SuperX', sub: 'screen guard', type: 'quantity', cost: 65, sell: 199, stock: 80 },
    { name: 'Privacy Screen Protector for iPhone Series', brand: 'Armor', sub: 'screen guard', type: 'quantity', cost: 95, sell: 299, stock: 60 },
    { name: 'UV Nano Liquid Curved Glass (Samsung/OnePlus)', brand: 'NanoUV', sub: 'screen guard', type: 'quantity', cost: 130, sell: 399, stock: 45 },
    { name: 'Camera Lens Metal Protector Guard (Triple Ring)', brand: 'Spigen', sub: 'screen guard', type: 'quantity', cost: 55, sell: 179, stock: 50 },

    // ==================== HEADPHONES & EARBUDS (Accessories) ====================
    { name: 'boAt Airdopes 141 ANC TWS Earbuds (Black)', brand: 'boAt', sub: 'headphones', type: 'quantity', cost: 850, sell: 1499, stock: 20 },
    { name: 'OnePlus Nord Buds 2 TWS with Active Noise Cancellation', brand: 'OnePlus', sub: 'headphones', type: 'quantity', cost: 1900, sell: 2699, stock: 14 },
    { name: 'Realme Buds Air 5 Pro ANC Earbuds', brand: 'Realme', sub: 'headphones', type: 'quantity', cost: 3400, sell: 4499, stock: 8 },
    { name: 'Sony WH-CH520 Wireless On-Ear Bluetooth Headphones', brand: 'Sony', sub: 'headphones', type: 'quantity', cost: 3300, sell: 4490, stock: 6 },
    { name: 'Apple EarPods (Type-C Connector) Original', brand: 'Apple', sub: 'headphones', type: 'quantity', cost: 1450, sell: 1999, stock: 18 },
    { name: 'boAt Bassheads 100 Wired Earphones with Mic', brand: 'boAt', sub: 'headphones', type: 'quantity', cost: 160, sell: 399, stock: 45 },
    { name: 'Noise Buds VS102 Wireless in-Ear Earbuds', brand: 'Noise', sub: 'headphones', type: 'quantity', cost: 650, sell: 1099, stock: 22 },

    // ==================== SPEAKERS (Accessories) ====================
    { name: 'boAt Stone 350 10W Bluetooth Speaker (Blue)', brand: 'boAt', sub: 'speaker', type: 'quantity', cost: 950, sell: 1499, stock: 12 },
    { name: 'JBL GO 3 Portable Waterproof Bluetooth Speaker', brand: 'JBL', sub: 'speaker', type: 'quantity', cost: 2300, sell: 3299, stock: 8 },
    { name: 'JBL Flip 6 Powerful Bass IP67 Speaker', brand: 'JBL', sub: 'speaker', type: 'quantity', cost: 7800, sell: 9999, stock: 4 },
    { name: 'Portronics SoundDrum P 20W Hi-Bass Speaker', brand: 'Portronics', sub: 'speaker', type: 'quantity', cost: 1250, sell: 1999, stock: 10 },
    { name: 'Zebronics Music Bomb 20W RGB Wireless Speaker', brand: 'Zebronics', sub: 'speaker', type: 'quantity', cost: 850, sell: 1399, stock: 15 },

    // ==================== SMART WATCHES (Accessories) ====================
    { name: 'Noise ColorFit Pulse 3 AMOLED Smartwatch', brand: 'Noise', sub: 'smart watches', type: 'quantity', cost: 1250, sell: 1999, stock: 16 },
    { name: 'boAt Wave Call 2 Bluetooth Calling Smartwatch', brand: 'boAt', sub: 'smart watches', type: 'quantity', cost: 950, sell: 1499, stock: 18 },
    { name: 'Fire-Boltt Phoenix Pro Metal Body Smartwatch', brand: 'Fire-Boltt', sub: 'smart watches', type: 'quantity', cost: 1100, sell: 1799, stock: 14 },
    { name: 'Fastrack Limitless FS1 Calling Watch', brand: 'Fastrack', sub: 'smart watches', type: 'quantity', cost: 1350, sell: 2195, stock: 10 },
    { name: 'Samsung Galaxy Watch 4 (44mm, Bluetooth)', brand: 'Samsung', sub: 'smart watches', type: 'quantity', cost: 8500, sell: 10999, stock: 5 },

    // ==================== POWER BANKS (Accessories) ====================
    { name: 'Mi 10000mAh 22.5W Fast Charge Power Bank 3i', brand: 'Mi', sub: 'power bank', type: 'quantity', cost: 950, sell: 1399, stock: 20 },
    { name: 'Ambrane 20000mAh 20W Power Delivery Power Bank', brand: 'Ambrane', sub: 'power bank', type: 'quantity', cost: 1350, sell: 1999, stock: 15 },
    { name: 'boAt Energyshroom 10000mAh Compact Power Bank', brand: 'boAt', sub: 'power bank', type: 'quantity', cost: 750, sell: 1199, stock: 18 },
    { name: 'Portronics Power Brick 2 10000mAh Dual Output', brand: 'Portronics', sub: 'power bank', type: 'quantity', cost: 650, sell: 999, stock: 22 },

    // ==================== COMPUTERS & IT HARDWARE (Electronics) ====================
    { name: 'Logitech MK215 Wireless Keyboard and Mouse Combo', brand: 'Logitech', sub: 'computers & it hardware', type: 'electronics', cost: 1150, sell: 1595, stock: 15 },
    { name: 'Logitech B170 Wireless Optical Mouse', brand: 'Logitech', sub: 'computers & it hardware', type: 'electronics', cost: 420, sell: 695, stock: 35 },
    { name: 'Dell Wired Optical Mouse MS116', brand: 'Dell', sub: 'computers & it hardware', type: 'electronics', cost: 230, sell: 399, stock: 40 },
    { name: 'Frontech Standard USB Multimedia Keyboard', brand: 'Frontech', sub: 'computers & it hardware', type: 'electronics', cost: 240, sell: 450, stock: 25 },
    { name: 'Fingers 1080p Full HD Web Camera with Mic', brand: 'Fingers', sub: 'computers & it hardware', type: 'electronics', cost: 1100, sell: 1799, stock: 8 },
    { name: 'TP-Link TL-WN725N 150Mbps Wireless N USB Nano Adapter', brand: 'TP-Link', sub: 'computers & it hardware', type: 'electronics', cost: 360, sell: 549, stock: 30 },
    { name: 'Mercusys AC1200 Dual Band Wi-Fi High Speed Router', brand: 'Mercusys', sub: 'computers & it hardware', type: 'electronics', cost: 1250, sell: 1899, stock: 10 },
    { name: 'Zebronics H61 Motherboard for Intel 2nd/3rd Gen', brand: 'Zebronics', sub: 'computers & it hardware', type: 'electronics', cost: 2400, sell: 3200, stock: 6 },
    { name: 'Corsair CV450 450W 80 Plus Bronze Power Supply', brand: 'Corsair', sub: 'computers & it hardware', type: 'electronics', cost: 2500, sell: 3299, stock: 5 },
    { name: 'Crucial 8GB DDR4 3200MHz Desktop RAM', brand: 'Crucial', sub: 'computers & it hardware', type: 'electronics', cost: 1350, sell: 1899, stock: 20 },
    { name: 'Crucial 16GB DDR4 3200MHz Laptop RAM', brand: 'Crucial', sub: 'computers & it hardware', type: 'electronics', cost: 2600, sell: 3499, stock: 12 },

    // ==================== STORAGE & DRIVES (Electronics) ====================
    { name: 'SanDisk Cruzer Blade 32GB USB 2.0 Flash Drive', brand: 'SanDisk', sub: 'storage & drives', type: 'quantity', cost: 240, sell: 399, stock: 60 },
    { name: 'SanDisk Ultra Dual 64GB USB 3.0 OTG Pen Drive', brand: 'SanDisk', sub: 'storage & drives', type: 'quantity', cost: 480, sell: 749, stock: 45 },
    { name: 'SanDisk Ultra Dual Drive Luxe 128GB Type-C Metal', brand: 'SanDisk', sub: 'storage & drives', type: 'quantity', cost: 950, sell: 1399, stock: 25 },
    { name: 'Crucial BX500 240GB 2.5-Inch SATA Internal SSD', brand: 'Crucial', sub: 'storage & drives', type: 'electronics', cost: 1450, sell: 2099, stock: 18 },
    { name: 'Crucial BX500 500GB 2.5-Inch SATA Internal SSD', brand: 'Crucial', sub: 'storage & drives', type: 'electronics', cost: 2550, sell: 3499, stock: 15 },
    { name: 'Western Digital Blue 500GB NVMe M.2 Internal SSD', brand: 'WD', sub: 'storage & drives', type: 'electronics', cost: 3100, sell: 4199, stock: 10 },
    { name: 'Seagate Expansion 1TB External USB 3.0 Portable HDD', brand: 'Seagate', sub: 'storage & drives', type: 'electronics', cost: 4100, sell: 5299, stock: 6 },
    { name: 'SanDisk 64GB Extreme Pro MicroSDXC Memory Card for Camera', brand: 'SanDisk', sub: 'storage & drives', type: 'quantity', cost: 580, sell: 899, stock: 30 },

    // ==================== HOME APPLIANCES & UTILITIES (Electronics) ====================
    { name: 'Philips HD4928 2100W Induction Cooktop', brand: 'Philips', sub: 'home appliances', type: 'electronics', cost: 2450, sell: 3299, stock: 4 },
    { name: 'Prestige 1.5 Litre Electric Kettle PKOSS', brand: 'Prestige', sub: 'home appliances', type: 'electronics', cost: 590, sell: 899, stock: 12 },
    { name: 'Havells Dry Iron 1000W with Non-Stick Coated Soleplate', brand: 'Havells', sub: 'home appliances', type: 'electronics', cost: 650, sell: 999, stock: 10 },
    { name: 'Syska 10W LED Emergency Rechargeable Inverter Bulb', brand: 'Syska', sub: 'home appliances', type: 'quantity', cost: 240, sell: 449, stock: 25 },
    { name: 'Goldmedal 4-Way Surge Protector Extension Board with 2m Wire', brand: 'Goldmedal', sub: 'home appliances', type: 'quantity', cost: 320, sell: 599, stock: 30 },

    // ==================== ENTERTAINMENT (Electronics) ====================
    { name: 'Amazon Fire TV Stick with Alexa Voice Remote (HD)', brand: 'Amazon', sub: 'entertainment', type: 'electronics', cost: 2900, sell: 3999, stock: 8 },
    { name: 'Xiaomi TV Stick 4K Streaming Media Player', brand: 'Mi', sub: 'entertainment', type: 'electronics', cost: 3400, sell: 4499, stock: 6 },
    { name: 'Zebronics 2.1 Channel Multimedia Soundbar with Subwoofer', brand: 'Zebronics', sub: 'entertainment', type: 'electronics', cost: 2600, sell: 3799, stock: 5 },
  ];

  console.log(`📦 Preparing to insert/upsert ${productDefinitions.length} products...`);

  let addedProductsCount = 0;
  let addedUnitsCount = 0;

  for (let i = 0; i < productDefinitions.length; i++) {
    const p = productDefinitions[i];
    const categoryId = subMap[p.sub];

    if (!categoryId) {
      console.warn(`⚠️ Warning: Subcategory "${p.sub}" not found for product "${p.name}". Skipping.`);
      continue;
    }

    const barcode = generateBarcode(89000, i + 1);

    // Check if product with this name already exists
    let existing = await prisma.product.findFirst({
      where: { name: p.name },
      include: { units: true },
    });

    let productId: number;

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          brand: p.brand,
          categoryId,
          productType: p.type,
          costPrice: p.cost,
          sellingPrice: p.sell,
          quantityInStock: p.stock,
          lowStockThreshold: Math.max(Math.floor(p.stock * 0.3), 2),
          barcode,
          isActive: true,
        },
      });
      productId = created.id;
      addedProductsCount++;
    } else {
      productId = existing.id;
      // Update details and stock
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          categoryId,
          costPrice: p.cost,
          sellingPrice: p.sell,
          quantityInStock: p.stock,
          isActive: true,
        },
      });
    }

    // If product is serialized, populate individual ProductUnit records with unique IMEIs
    if (p.type === 'serialized') {
      const existingUnits = existing ? existing.units.filter((u) => u.status === 'in_stock') : [];
      const unitsNeeded = p.stock - existingUnits.length;

      for (let u = 0; u < unitsNeeded; u++) {
        const uniqueIMEI = generateIMEI();
        try {
          await prisma.productUnit.create({
            data: {
              productId,
              imeiNumber: uniqueIMEI,
              status: 'in_stock',
              costPrice: p.cost,
              addedAt: new Date(),
            },
          });
          addedUnitsCount++;
        } catch (err: any) {
          // If IMEI collision, try once more
          await prisma.productUnit.create({
            data: {
              productId,
              imeiNumber: generateIMEI(),
              status: 'in_stock',
              costPrice: p.cost,
              addedAt: new Date(),
            },
          });
          addedUnitsCount++;
        }
      }
    }
  }

  // Final Counts Summary
  const totalInDb = await prisma.product.count({ where: { isActive: true } });
  const totalUnits = await prisma.productUnit.count({ where: { status: 'in_stock' } });
  const allCategories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  console.log('\n======================================================');
  console.log('🎉 INVENTORY SEEDING COMPLETE!');
  console.log(`📊 Total Active Products in DB: ${totalInDb}`);
  console.log(`📱 Total In-Stock Serialized Units (IMEIs): ${totalUnits}`);
  console.log('📂 Stock Distribution Across Categories:');
  for (const cat of allCategories) {
    if (cat.parentCategoryId) {
      console.log(`   - [Subcategory] ${cat.name}: ${cat._count.products} products`);
    } else {
      console.log(` 📁 [Parent Category] ${cat.name}:`);
    }
  }
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
