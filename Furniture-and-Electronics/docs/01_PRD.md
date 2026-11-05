# Product Requirements Document (PRD)
## Laxmi Electronics & Furnitures — Retail POS, Advance Wedding Bookings & Automated WhatsApp Management System

**Version:** 2.0 (Production Release)  
**Location:** Main Market, Bhinder, Udaipur (Raj.) — Helpline: +91 820 939 9683  
**Proprietor:** Suraj Menariya  
**Status:** Implemented & Deployed  

---

## 1. Project Overview

**Laxmi Electronics & Furnitures** is a premier showroom located in Bhinder, Udaipur (Rajasthan), operating across two primary commercial departments:
1. **Furniture & Home Furnishings:** Handcrafted solid wood furniture (Sheesham, Teak), dining table sets, carved sofa suites, wardrobes, double beds, dressing tables, office setups, and custom upholstery.
2. **Electronics & Consumer Appliances:** Smart 4K TVs, refrigerators, washing machines, desert coolers, soundbars, kitchen appliances, and ceiling fans.

In regional Indian retail markets, a significant portion of annual business comes from **Advance Wedding & Housewarming Packages** (`ADB-YYYY-NNNN`). Families book complete furniture suites and major home appliances weeks or months in advance of the wedding date, pay an initial booking advance, provide custom reference photos for bespoke woodwork/colors, and require partial delivery schedules (furniture delivered early for pre-wedding ceremonies, appliances delivered on the wedding/lagan day).

This application provides a unified, web-based enterprise management system delivering:
- Dual-department Point-of-Sale (POS) counter billing.
- Comprehensive Advance Package Bookings with custom woodworking design uploads, scheduled multi-stage deliveries, and automated tax invoicing.
- Cloud storage integration with client-side image compression for bespoke design references.
- Automated WhatsApp document delivery microservice sending branded PDF invoices, order slips, and receipts with zero manual friction.
- Wholesale vendor supply chain and purchase payment tracking.
- Real-time revenue analytics, overdue accounts receivable aging, and inventory health tracking.

---

## 2. Goals & Objectives

| Goal | Description & Business Impact |
|---|---|
| **Unified Dual-Department Operations** | Manage furniture manufacturing and electronics retail in one platform with department-specific tax invoices (`#FURN-...`, `#ELEC-...`) and unified booking packages. |
| **Flawless Wedding Package Lifecycle** | Track advance customer deposits, custom woodworking notes/photos, target delivery dates, and staged deliveries without spreadsheet confusion. |
| **Instant WhatsApp Customer Engagement** | Eliminate printed paper delays by delivering high-resolution PDF booking slips and GST tax invoices straight to customer WhatsApp numbers within seconds. |
| **Bespoke Design Management** | Capture customer design photos from smartphone cameras, compress in-browser (150–250KB), store in Supabase Cloud Storage, and render crisp thumbnails on physical order slips. |
| **Inventory & Serial Tracking** | Real-time stock counts for furniture pieces and serialized IMEI/serial tracking for high-value appliances with warranty records. |
| **Accounts Receivable Discipline** | Clear tracking of credit/due balances, automated overdue alerts (15+ days), and instant WhatsApp payment receipts upon cash/UPI settlement. |

---

## 3. Users & Role-Based Access Control (RBAC)

| Role | Target Users | Permissions & Access Scope |
|---|---|---|
| **Owner (Admin)** | Suraj Menariya (Proprietor) | Full administrative access: master inventory control, wholesale purchase logging, vendor ledger, cost prices, profit margins, staff management, financial analytics, WhatsApp bot configuration, and bill voiding. |
| **Staff (Counter Sales)** | Sales associates & counter billing staff | Operational billing access: create walk-in bills, register advance bookings, schedule deliveries, view read-only inventory levels. **Strictly blocked** from viewing cost prices, vendor purchase prices, margin percentages, and store analytics. |

---

## 4. System Scope & Core Modules

### 4.1 Advance Wedding & Event Bookings (`/bookings`)
- **Booking Identification:** Auto-sequenced unique reference IDs in format `ADB-YYYY-NNNN` (e.g., `ADB-2026-0011`).
- **Customer Profiling:** Full customer capture (Name, Phone number, Village/City address, delivery location notes).
- **Package Assembler:** Add line items across Furniture and Electronics with custom carpentry annotations (wood finish, fabric color, dimension adjustments).
- **Design Photo Cloud Sync:** Multi-image photo uploader supporting camera capture. Client-side canvas compression reduces 10MB images to ~200KB JPEG before uploading to Supabase Storage (`temp-images/bookings/{bookingNumber}/`).
- **Interactive Lightbox:** Soft blurred backdrop (`backdrop-blur-md bg-black/25`) preview with standard card sizing, thumbnail badges, and multi-photo carousel.
- **Split Invoicing Logic:**
  - Furniture items are immediately invoiced upon booking confirmation (`#FURN-YYYY-NNNN`), locking in craftsmanship commitments and initial advance allocation.
  - Electronics appliances remain in "Pending Delivery" state until physical dispatch, ensuring warranties commence on the actual handover date.
- **Visual Advance Order Slip:** Branded printable PDF and modal displaying customer details, package breakdown, financial summary (Total, Advance Paid, Balance Due), design reference photo matrix, and legal customer/store signature blocks.
- **Automated Dual WhatsApp Dispatch:** Sends both the Advance Booking Slip PDF and immediate Furniture Tax Invoice PDF directly to the customer's WhatsApp upon confirmation.

### 4.2 Point-of-Sale (POS) Counter Billing (`/billing`)
- **Dual-Department Invoicing:**
  - Furniture Invoices: Prefixed `#FURN-YYYY-NNNN`.
  - Electronics Invoices: Prefixed `#ELEC-YYYY-NNNN`.
- **Live Reactive Preview:** Real-time invoice preview updating as line items, quantities, discounts, and customer details change.
- **Omni-Channel Search & Scanner:** Instant lookup by product name, model number, barcode, or live camera QR/barcode scanner (`html5-qrcode`).
- **Flexible Settlement:** Multi-mode payment support (Cash, UPI QR, Card, Net Banking, Store Credit / Due).
- **Direct WhatsApp Dispatch:** One-click automated delivery of branded GST Tax Invoice PDF to the customer.

### 4.3 Deliveries & Scheduled Fulfillment (`/deliveries`)
- **Delivery Calendar:** Chronological list of upcoming delivery commitments sorted by urgency (e.g., "In 5 days", "Tomorrow", "Overdue").
- **Delivery Invoice Generator:** One-click conversion of pending reserved appliances into delivered tax invoices, prompting staff for serial/IMEI numbers and activating manufacturer warranties.
- **Completion Stamp:** Booking slips dynamically stamp fulfillment verification badges once all items are delivered and account balances are settled.

### 4.4 Automated WhatsApp Notification Microservice (`whatsapp-bot`)
- **Engine:** Built with `@whiskeysockets/baileys` using WebSocket connection and `MultiFileAuthState`.
- **Sequential FIFO Queue:** Custom promise queue with a 2-second rate-limiting cooldown between dispatches to prevent media socket collisions during back-to-back document delivery.
- **Base64 Sanitization:** Strips data URI wrappers (`data:application/pdf;base64,`) and validates buffer integrity before Baileys transport.
- **Dual Runtime Support:**
  - *Local Development:* Native Node.js `http` daemon (`scripts/local-whatsapp-daemon.js`) reading `.env.local` without third-party dependencies.
  - *Production Microservice:* Containerized Express service deployed on **Northflank** with persistent volume mounts for auth credentials.

### 4.5 Inventory & Warehouse Management (`/inventory`)
- **Department Partitioning:** Products categorized under `FURNITURE` or `ELECTRONICS`.
- **Stock Tracking:**
  - *Quantity-based:* Running inventory count for furniture units, coolers, and small appliances.
  - *Serialized:* Unique IMEI/serial number tracking for high-value appliances with warranty start dates.
- **Stock-In Records:** Complete audit log capturing supplier, purchase price, quantity added, timestamp, and authorizing staff member.
- **Low Stock Alerts:** Real-time visual warning tags when inventory dips below configurable safety thresholds.

### 4.6 Vendor Purchases & Supply Chain (`/purchases`)
- **Supplier Directory:** Manage furniture wood suppliers, hardware vendors, and electronics distributors.
- **Purchase Orders:** Log stock receipt receipts (`PUR-YYYY-NNNN`) with vendor invoice reference, tax breakdown, and payment status (Paid, Partial, Unpaid).
- **Payment Advice:** Track installment payments and generate PDF Payment Advice slips dispatched to vendors via WhatsApp.

### 4.7 Analytics & Financial Management (`/analytics`, `/dashboard`)
- **Revenue & Profit KPIs:** Daily, monthly, and annual sales volume split by department (Furniture vs. Electronics).
- **Accounts Receivable Aging:** Highlight outstanding customer due balances with 15+ days overdue warning tags.
- **Top Performers:** Identify best-selling furniture styles and high-demand appliances.

---

## 5. Non-Functional Requirements (NFRs)

| Metric | Target Specification |
|---|---|
| **Performance** | API response times < 250ms for billing; invoice PDF generation < 1.5s in client browser. |
| **Reliability** | Atomic database transactions via Prisma ensure zero inventory desynchronization during checkout. |
| **Image Optimization** | Client-side HTML5 canvas compression compresses images to 150–250KB before network upload, maintaining high fidelity on PDF print templates. |
| **WhatsApp Resilience** | Outgoing message queue guarantees sequential document arrival and automatic retry on temporary network dropouts. |
| **Security & Privacy** | Bcrypt password hashing, NextAuth JWT session validation, strict RBAC suppressing cost prices and profit margins from counter staff. |
| **Mobile Responsiveness** | Fully responsive layout optimized for desktop counter monitors and handheld tablets used on the showroom floor. |
