# Requirements Analysis Report
## Laxmi Electronics & Furnitures — System Specification & Validation Report

**Version:** 2.0 (Production Release)  
**Location:** Main Market, Kanore, Udaipur (Raj.) — Helpline: +91 63755 91682  
**Proprietor:** Lalit Menariya  

---

## 1. System Roles & Access Boundaries

* **Owner (Admin):** Full administrative privileges. Owns product catalog pricing, cost prices, wholesale vendor purchases, margin analytics, user administration, bill voiding, and WhatsApp microservice configuration.
* **Staff (Counter Billing):** Showroom counter operations only. Can create walk-in bills, assemble advance wedding packages, schedule deliveries, and view read-only inventory availability. **Strictly restricted** from viewing acquisition costs, wholesale purchase history, profit margins, or executive financial reports.

---

## 2. Functional Requirements Baseline

* **FR1 Authentication & Access Control:** Secure credentials authentication with JWT sessions. Role-based route guards at both UI and API levels. Audit logging on all financial and inventory state mutations.
* **FR2 Dual-Department Catalog Management:** Hierarchical categorization supporting `FURNITURE` and `ELECTRONICS` departments. Quantity-based tracking for furniture/fans/coolers; serialized tracking (IMEI/serial number) for branded home appliances.
* **FR3 Point-of-Sale (POS) Billing:** Real-time billing interface supporting live item addition, barcode scanning via camera/laser, GST tax calculation (SGST + CGST), multiple payment tenders, atomic stock deduction, and sequential department invoice numbering (`#FURN-...`, `#ELEC-...`).
* **FR4 Advance Wedding Package Bookings:** Package booking engine (`ADB-YYYY-NNNN`) capturing event dates, target delivery windows, advance payment deposits, and custom woodworking specifications.
* **FR5 Bespoke Design Cloud Sync:** Client-side HTML5 canvas compression pre-processing smartphone photos to 150–250KB JPEG before uploading to Supabase Storage (`temp-images/bookings/{bookingNumber}/`).
* **FR6 Split Invoicing & Delivery Lifecycle:** Immediate generation of `#FURN-YYYY-NNNN` tax invoices for furniture upon booking; staging electronics as "Pending Delivery" until scheduled delivery dates; one-click fulfillment invoicing activating warranties.
* **FR7 Automated WhatsApp Delivery Engine:** Decoupled `@whiskeysockets/baileys` microservice with a sequential FIFO queue (2-second rate-limiting cooldown) delivering branded PDF booking slips, tax invoices, and payment receipts directly to customers.
* **FR8 Accounts Receivable & Due Tracking:** Real-time customer credit ledger, 15+ days overdue accounts receivable aging alert widget, and instant WhatsApp payment receipts upon cash/UPI settlement.
* **FR9 Wholesale Vendor Supply Chain:** Supplier directory, purchase orders (`PUR-YYYY-NNNN`), inbound warehouse restock tracking, and WhatsApp payment advice dispatch.
* **FR10 Financial Analytics:** Departmental revenue and margin breakdowns, monthly growth comparisons, and top-performing furniture styles.

---

## 3. Core Business Rules

1. **Department Separation:** Every product, bill, and purchase order belongs explicitly to `FURNITURE` or `ELECTRONICS` (or `COMBINED` on special packages).
2. **Atomic Inventory State:** Billing and stock deduction must execute in a single atomic database transaction to prevent overselling or race conditions.
3. **Staff Privacy Barrier:** Counter staff must never see product cost prices or profit margins on any screen or API response.
4. **Advance Package Invoicing Policy:** Furniture items are invoiced immediately upon booking to commit manufacturing materials; electronics are invoiced on actual delivery to ensure warranty dates match customer handover.
5. **WhatsApp Rate Limiting:** Outgoing media messages must observe a mandatory 2-second cooldown to protect the Baileys WebSocket connection from socket drops.

---

## 4. Architecture & Technical Requirements

* **Monorepo Structure:** Next.js 16 App Router web application (`Furniture-and-Electronics/`) paired with a standalone containerized WhatsApp microservice (`whatsapp-bot/`).
* **Database:** Neon Serverless PostgreSQL with Prisma ORM 6.
* **Storage:** Supabase Object Storage (`temp-images` bucket).
* **PDF Rendering:** Client-side vector rendering via `html2canvas-pro` and `jspdf`.
* **Hosting:** Vercel (Web Application), Northflank (WhatsApp microservice container), Neon (Database).
