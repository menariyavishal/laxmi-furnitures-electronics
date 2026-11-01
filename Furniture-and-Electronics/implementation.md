# Laxmi Electronics & Furnitures — Implementation Plan

## 1. Executive Overview & Domain Understanding

### 1.1 Business Profile
**Laxmi Electronics & Furnitures** operates a dual-sector showroom specializing in retail, bulk, and **wedding gift packages** (e.g., Bedroom Furniture Sets + Home Appliance Packages).

### 1.2 Core Operational Dynamic (Instant vs. Deferred Billing)
* **Furniture Division**: Beds, sofas, dining tables, wardrobes, dressing tables.
  * *Billing Policy*: Bills are generated **immediately** upon order/booking.
* **Electronics Division**: TVs, refrigerators, air conditioners, washing machines, coolers, etc.
  * *Billing Policy*: Invoices are generated **on the delivery date**, NOT upon advance booking.
  * *Reason*: Electronics warranties (and manufacturer warranty registration) start from the official tax invoice date. Invoicing upon booking months prior to a wedding would deprive the customer of active warranty during the waiting period.

---

## 2. Sector Architecture: Separation & Modularity

### 2.1 The Two Divisions
* `FURNITURE`
* `ELECTRONICS`
* `ALL` (Combined view for owner analytics, total cashflow, and customer billing history)

### 2.2 Global State & Navigation Switcher
* **UI Component**: Persistent Sector Switcher in the top Dashboard Header / Navbar:
  ```
  [ 🪑 Furniture ]   [ ⚡ Electronics ]   [ 🌐 All Store ]
  ```
* **State Management**:
  * Stored in React Context (`SectorContext`) and mirrored in `localStorage` / URL query parameter (`?sector=furniture`).
  * Switching tabs immediately updates all downstream views without full page reloads.

---

## 3. Database Schema Changes & New Tables

### 3.1 Modifications to Existing Models

#### 1. `Category`
Add a sector tag so categories are strictly partitioned:
```prisma
model Category {
  id               Int        @id @default(autoincrement())
  name             String
  department       String     @default("FURNITURE") @map("department") // "FURNITURE" | "ELECTRONICS"
  parentCategoryId Int?       @map("parent_category_id")
  isActive         Boolean    @default(true) @map("is_active")
  ...
  @@index([department, isActive])
}
```

#### 2. `Product`
Add department and warranty fields:
```prisma
model Product {
  id                Int             @id @default(autoincrement())
  categoryId        Int             @map("category_id")
  department        String          @default("FURNITURE") @map("department") // "FURNITURE" | "ELECTRONICS"
  name              String
  barcode           String?         @unique
  brand             String?
  productType       String          @map("product_type") // e.g. "SINGLE" | "SERIALIZED" | "PACKAGE"
  costPrice         Decimal         @map("cost_price")
  sellingPrice      Decimal         @map("selling_price")
  quantityInStock   Int             @default(0) @map("quantity_in_stock")
  lowStockThreshold Int             @default(5) @map("low_stock_threshold")
  warrantyMonths    Int?            @default(12) @map("warranty_months") // Crucial for Electronics
  imageUrl          String?         @map("image_url")
  isActive          Boolean         @default(true) @map("is_active")
  ...
  @@index([department, isActive])
}
```

#### 3. `ProductUnit` (Serial / IMEI Numbers)
Generic serial number tracking for appliances & electronics:
```prisma
model ProductUnit {
  id           Int        @id @default(autoincrement())
  productId    Int        @map("product_id")
  serialNumber String     @unique @map("serial_number") // Replaces/aliases imeiNumber
  status       String     // "IN_STOCK" | "RESERVED" | "SOLD"
  costPrice    Decimal    @map("cost_price")
  addedAt      DateTime   @default(now()) @map("added_at")
  soldAt       DateTime?  @map("sold_at")
  ...
}
```

#### 4. `Bill`
Tag bills by department and support Advance Bookings vs Tax Invoices:
```prisma
model Bill {
  id              Int            @id @default(autoincrement())
  billNumber      String         @unique @map("bill_number")
  billType        String         @default("REGULAR") @map("bill_type") // "REGULAR" | "DELIVERY_INVOICE"
  department      String         @default("FURNITURE") @map("department") // "FURNITURE" | "ELECTRONICS" | "COMBINED"
  bookingId       Int?           @map("booking_id")
  customerId      Int?           @map("customer_id")
  deliveryDate    DateTime?      @map("delivery_date")
  warrantyStarts  DateTime?      @map("warranty_starts") // Exact date warranty becomes active
  ...
}
```

---

### 3.2 New Tables Required

#### 1. `Booking` (Advance Wedding & Package Bookings)
Enables booking advance packages with token deposits:
```prisma
model Booking {
  id                   Int           @id @default(autoincrement())
  bookingNumber        String        @unique @map("booking_number") // e.g., WB-2026-001
  customerId           Int           @map("customer_id")
  eventDate            DateTime?     @map("event_date") // Wedding / Event date
  expectedDeliveryDate DateTime      @map("expected_delivery_date")
  totalEstimatedAmount Decimal       @map("total_estimated_amount")
  advancePaid          Decimal       @default(0) @map("advance_paid")
  remainingBalance     Decimal       @default(0) @map("remaining_balance")
  status               String        @default("CONFIRMED") // "CONFIRMED" | "PARTIALLY_DELIVERED" | "COMPLETED" | "CANCELLED"
  notes                String?
  createdAt            DateTime      @default(now()) @map("created_at")
  updatedAt            DateTime      @updatedAt @map("updated_at")
  
  customer             Customer      @relation(fields: [customerId], references: [id])
  bookingItems         BookingItem[]
  deliveries           DeliverySchedule[]

  @@map("bookings")
}
```

#### 2. `BookingItem`
Individual products reserved in a booking:
```prisma
model BookingItem {
  id           Int       @id @default(autoincrement())
  bookingId    Int       @map("booking_id")
  productId    Int       @map("product_id")
  department   String    @map("department") // "FURNITURE" | "ELECTRONICS"
  quantity     Int
  unitPrice    Decimal   @map("unit_price")
  lineTotal    Decimal   @map("line_total")
  isBilled     Boolean   @default(false) @map("is_billed")
  billId       Int?      @map("bill_id") // Links to final Bill once generated
  
  booking      Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  product      Product   @relation(fields: [productId], references: [id])

  @@map("booking_items")
}
```

#### 3. `DeliverySchedule`
Tracks upcoming electronics delivery dispatch for warranty activation and final bill creation:
```prisma
model DeliverySchedule {
  id             Int       @id @default(autoincrement())
  bookingId      Int       @map("booking_id")
  scheduledDate  DateTime  @map("scheduled_date")
  actualDelivery DateTime? @map("actual_delivery")
  status         String    @default("SCHEDULED") // "SCHEDULED" | "OUT_FOR_DELIVERY" | "DELIVERED"
  driverNotes    String?   @map("driver_notes")
  
  booking        Booking   @relation(fields: [bookingId], references: [id])

  @@map("delivery_schedules")
}
```

---

## 4. Page-by-Page Behavioral Plan

### 4.1 Dashboard Overview (`/dashboard`)
* **When `Furniture` is active**:
  * Metrics: Furniture Gross Sales, Active Furniture Units, Low Stock Beds/Sofas, Pending Deliveries.
  * Charts: Monthly Furniture Trends, Top-selling furniture categories.
* **When `Electronics` is active**:
  * Metrics: Electronics Gross Sales, Appliance Stock Units, Pending Invoices (Waiting for Delivery), Upcoming Deliveries this week.
  * Alert Box: **"Deliveries Today"** with 1-click action to generate Electronics Warranty Invoice.
* **When `All Store` is active**:
  * Unified Financial Snapshot: Combined revenue, combined dues, total cash in hand.

### 4.2 Inventory Management (`/inventory`)
* **Auto-Filtered Grid**:
  * Selecting `Furniture` displays only Furniture Categories (Living Room, Bedroom, Dining, Office) and products.
  * Selecting `Electronics` displays only Electronics Categories (Televisions, Refrigerators, Air Conditioners, Washing Machines).
* **Category Selector**:
  * Dropdowns filter subcategories based on the active sector.
* **Stock-In & New Product Creation**:
  * Adding a product defaults to the active sector, automatically enforcing appropriate fields (e.g. Warranty Months & Serial Number tracking for Electronics vs. Dimensions/Wood for Furniture).

### 4.3 Billing & Advance Booking (`/billing`)
1. **Regular Instant Sale (Furniture)**:
   * Select items &rarr; Instant Invoice & Tax Bill generated immediately &rarr; Stock deducted &rarr; PDF / WhatsApp receipt dispatched.
2. **Advance Wedding Package Order**:
   * Mode toggle: **"Advance Booking / Wedding Order"**.
   * Customer picks both Furniture and Electronics.
   * System creates a `Booking` record with `advancePaid`.
   * Furniture items can be invoiced immediately if client requests.
   * Electronics items remain flagged as **"Pending Delivery Invoicing"**.
3. **Delivery Day Execution (Electronics)**:
   * On delivery day, click **"Generate Delivery Invoice"**.
   * Enter appliance Serial Number(s).
   * Generates official Tax Invoice dated **today** for manufacturer warranty.
   * Settles final balance due.

### 4.4 Due Payments (`/due-payments`)
* Separate columns/tabs:
  * Furniture Instant Bill Unpaid Balances.
  * Wedding Advance Booking Pending Balances (due on delivery).
* WhatsApp reminders can customize message text:
  * For Booking: *"Your wedding gift package delivery is scheduled for [Date]. Pending balance is ₹[Amount]."*

### 4.5 Finance & Analytics (`/finance`, `/analytics`)
* **Department Filter**:
  * Filter P&L, GST reports (CGST/SGST), and profit margins by **Furniture vs. Electronics vs. Combined**.
  * View distinct revenue contribution of wedding packages vs daily walk-in purchases.

---

## 5. How Combined / Aggregated Views Work

To provide complete store insight without losing modularity:
1. **Unified Global Search**: Search bar in the top navigation can search across both furniture and electronics (with visual badges indicating 🪑 or ⚡).
2. **"All Store" Switcher Option**:
   * The navbar toggle has 3 options:
     * `[ 🪑 Furniture ]`
     * `[ ⚡ Electronics ]`
     * `[ 🌐 Combined ]`
3. **API Design**:
   * All API endpoints (`/api/v1/products`, `/api/v1/dashboard/stats`, `/api/v1/bills`) support a query parameter:
     * `?department=FURNITURE`
     * `?department=ELECTRONICS`
     * Omitted or `?department=ALL` &rarr; Aggregated result for both.

---

## 6. Implementation Status & Modular File Registry

All milestones have been fully implemented following strict single-responsibility modular architecture:

### 6.1 State & Global Switcher
* [`types/department.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/types/department.ts) — Department types, badges, and themes (`FURNITURE`, `ELECTRONICS`, `ALL`).
* [`components/dashboard/department/DepartmentContext.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/department/DepartmentContext.tsx) — Persistent department state across tabs.
* [`components/dashboard/department/DepartmentSwitcher.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/department/DepartmentSwitcher.tsx) — Top navigation sector toggle.

### 6.2 Advance Booking & Delivery System
* **Data & Types**:
  * [`types/booking.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/types/booking.ts) — Booking and delivery TypeScript interfaces.
  * [`lib/api/booking.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/lib/api/booking.ts) — Client API helper functions for bookings.
  * [`app/api/v1/bookings/route.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/api/v1/bookings/route.ts) — List & create advance booking API.
  * [`app/api/v1/bookings/[id]/invoice/route.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/api/v1/bookings/[id]/invoice/route.ts) — Delivery-day tax invoice & warranty generator.
* **Bookings List Page (`/bookings`)**:
  * [`components/dashboard/bookings/BookingsHeader.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/BookingsHeader.tsx) — Title, description, and "New Advance Booking" CTA button.
  * [`components/dashboard/bookings/BookingsStatsSummary.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/BookingsStatsSummary.tsx) — Top KPI metrics (Total Bookings, Advance Collected, Due Balances, Deliveries Awaiting).
  * [`components/dashboard/bookings/BookingsFilterBar.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/BookingsFilterBar.tsx) — Search box and status filter pills.
  * [`components/dashboard/bookings/BookingListEmptyState.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/BookingListEmptyState.tsx) — Empty state display with actions.
  * [`components/dashboard/bookings/BookingCard.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/BookingCard.tsx) — Individual order card with items breakdown and status progress.
  * [`components/dashboard/bookings/DeliveryInvoiceModal.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/DeliveryInvoiceModal.tsx) — Appliance serial number entry and delivery-date invoice generator.
  * [`app/(dashboard)/bookings/page.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/(dashboard)/bookings/page.tsx) — Orchestrator page.
* **New Advance Booking Page (`/bookings/new`)**:
  * [`components/dashboard/bookings/new/CustomerDetailsStep.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/new/CustomerDetailsStep.tsx) — Customer contact and wedding/delivery dates form.
  * [`components/dashboard/bookings/new/ProductPicker.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/new/ProductPicker.tsx) — Department-tabbed product search and selection.
  * [`components/dashboard/bookings/new/PackageItemsTable.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/new/PackageItemsTable.tsx) — Package items list with quantity steppers and warranty badges.
  * [`components/dashboard/bookings/new/AdvancePaymentCard.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/components/dashboard/bookings/new/AdvancePaymentCard.tsx) — Financial summary, advance token calculation, and order submission.
  * [`app/(dashboard)/bookings/new/page.tsx`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/(dashboard)/bookings/new/page.tsx) — Orchestrator page.

### 6.3 Department Inventory & Billing
* [`app/api/v1/categories/route.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/api/v1/categories/route.ts) — Categorization with `?department=` filter.
* [`app/api/v1/products/route.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/api/v1/products/route.ts) — Product inventory with department and warranty fields.
* [`app/api/v1/bills/route.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/app/api/v1/bills/route.ts) — Standard bills tagged by department.
* [`scripts/seed-sectors.ts`](file:///v:/Projects/Laxmi-electronic-and-furnitures/Furniture-and-Electronics/scripts/seed-sectors.ts) — Showroom starter inventory for Furniture and Electronics.

