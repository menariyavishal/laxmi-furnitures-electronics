# Phase Distribution & Engineering Roadmap
## Laxmi Electronics & Furnitures — Implementation History & Milestone Breakdown

**Version:** 2.0 (Production Release)  
**Location:** Main Market, Bhinder, Udaipur (Raj.) — Helpline: +91 820 939 9683  

---

## 1. Executive Summary & Phase Matrix

| Phase | Milestone | Scope / Core Deliverables | Status |
|---|---|---|---|
| **Phase 1** | **Foundations & Dual POS** | Next.js 16, Prisma 6, Neon PostgreSQL, Dual-Department (`FURNITURE` vs `ELECTRONICS`) POS counter billing, GST calculation, NextAuth RBAC. | ✅ Completed |
| **Phase 2** | **Wedding Package Bookings** | Advance booking workflow (`ADB-2026-XXXX`), split delivery schedules, auto-generation of immediate Furniture Tax Invoices, financial ledger (Advance, Due, Total). | ✅ Completed |
| **Phase 3** | **Cloud Storage & Compression** | Supabase Storage integration (`temp-images`), client-side HTML5 Canvas compression (150–250KB), blurred glass lightbox modal, embedded PDF photo matrix. | ✅ Completed |
| **Phase 4** | **WhatsApp Notification Engine** | Decoupled Baileys microservice, local native HTTP daemon, sequential FIFO message queue (2s cooldown), dual-document automated dispatch, base64 sanitization. | ✅ Completed |
| **Phase 5** | **Scheduled Deliveries & Warranty** | Delivery schedule tracking, urgent delivery alerts, one-click appliance tax invoicing with serial/IMEI capture, fulfillment completion verification stamps. | ✅ Completed |
| **Phase 6** | **Vendor Supply Chain & Purchases** | Wholesale vendor management, purchase orders (`PUR-2026-XXXX`), stock-in ledger, installment payment vouchers with WhatsApp payment advice. | ✅ Completed |
| **Phase 7** | **Analytics, Accounts Due & Polish** | Department-level revenue analytics, overdue accounts receivable aging (15+ days), visual slip-print twin alignment, production Dockerization on Northflank. | ✅ Completed |

---

## 2. Phase-by-Phase Technical Breakdown

### Phase 1: Foundations, Dual-Department Architecture & Core POS
- **Database Architecture:** Configured Neon Serverless PostgreSQL with Prisma ORM 6. Modeled dual-department schema with enum-like strings (`FURNITURE` | `ELECTRONICS`).
- **Authentication & RBAC:** NextAuth credentials provider enforcing strict role separation (`OWNER` vs `STAFF`). Counter staff are strictly prevented from viewing cost prices, supplier details, or store margins.
- **Counter Billing Interface:** Real-time billing terminal (`/billing`) with dynamic item addition, instant stock validation, GST calculation (SGST + CGST), and support for multiple tenders (Cash, UPI QR, Card, Store Credit / Due).
- **Invoice Numbering:** Automatic sequential numbering with departmental prefixes:
  - Furniture Invoices: `#FURN-YYYY-NNNN`
  - Electronics Invoices: `#ELEC-YYYY-NNNN`

---

### Phase 2: Advance Wedding Package Booking Engine
- **Business Need:** Address the critical commercial requirement of Indian retail furniture showrooms where customers book complete wedding suites months in advance.
- **Booking Architecture:** Introduced `Booking` and `BookingItem` models with unique reference codes (`ADB-YYYY-NNNN`).
- **Immediate Furniture Invoicing:** Split delivery architecture: upon booking confirmation, an official tax invoice (`#FURN-YYYY-NNNN`) is generated immediately for the furniture items, securing the advance deposit. Reserved electronics remain pending until the scheduled wedding delivery day.
- **Visual Booking Slip:** Created a comprehensive, print-ready document and modal displaying customer details, item specifications, woodworking notes, payment summary (Advance Paid, Balance Due), and signature verification areas.

---

### Phase 3: Cloud Storage Integration & Client-Side Image Compression
- **Problem Statement:** Showroom sales staff take high-resolution photos of custom woodwork or customer-provided catalog references with modern smartphones (6–12MB each). Uploading these uncompressed files stalled the counter POS and choked network connections.
- **HTML5 Canvas Compression Engine (`lib/image-compression.ts`):**
  - Intercepts selected files on the client before network upload.
  - Draws images onto an off-screen canvas, constraining maximum dimensions to 1440px while preserving aspect ratios.
  - Encodes to JPEG at 0.78 quality, reducing file sizes from 10MB down to **150–250KB** (97% reduction) in under 300ms.
- **Supabase Cloud Storage Integration:**
  - Configured public bucket `temp-images`.
  - Structured storage path: `bookings/{bookingNumber}/{timestamp}_{filename}.jpg`.
- **Soft Lightbox Preview Modal:** Replaced dark black letterboxed modals with a modern frosted glass backdrop (`bg-black/25 backdrop-blur-md`), presenting standard-sized card previews with clear close controls.
- **PDF Embed Support:** Extracted photo parsing logic to `lib/booking-photos.ts` (free of DOM dependencies) so both client and server can safely embed design references into documents.

---

### Phase 4: Automated WhatsApp Notification Microservice
- **Decoupled Architecture:** Replaced flaky third-party APIs with a self-hosted `@whiskeysockets/baileys` microservice running independently in `whatsapp-bot/`.
- **Local Development Daemon (`scripts/local-whatsapp-daemon.js`):** Built a standalone daemon using Node.js native `http` module that exclusively loads `.env.local` to enable local testing without internet webhooks or Express dependencies.
- **Sequential FIFO Queue (`whatsapp-bot/queue.js`):** Resolved the Baileys WebSocket media collision issue where sending two back-to-back PDFs (Booking Slip + Furniture Invoice) caused the second upload to drop. The queue enforces an active dispatch lock and a **2,000ms cooldown window** between media transmissions.
- **Base64 Payload Sanitization:** Robust regex parser stripping `data:application/pdf;base64,` prefixes before creating binary buffers.
- **Concise Message Templates (`lib/whatsapp/templates.ts`):** Rewrote message templates to eliminate bloated package breakdowns and provide clean, professional summaries with the official store helpline (`+91 820 939 9683`).

---

### Phase 5: Scheduled Fulfillment & Appliance Invoicing
- **Delivery Calendar (`/deliveries`):** Dynamic chronological list tracking scheduled deliveries sorted by target date ("In 5 days", "Tomorrow", "Overdue").
- **Fulfillment Invoicing:** When the wedding or delivery day arrives, staff click "Generate Delivery Invoice", enter serial/IMEI numbers for each appliance, and the system atomically:
  - Generates the official Electronics Tax Invoice (`#ELEC-YYYY-NNNN`).
  - Activates manufacturer warranty periods.
  - Updates delivery status to `DELIVERED`.
  - Dispatches the appliance invoice and warranty card via WhatsApp.

---

### Phase 6: Wholesale Vendor Purchases & Supply Chain
- **Vendor Ledger (`/purchases`):** Full supplier database with GSTIN, contact numbers, and purchase history.
- **Purchase Stock-In (`PUR-YYYY-NNNN`):** Record inbound bulk inventory, automatically incrementing warehouse stock counts and updating unit cost prices.
- **Payment Advice:** Track installment payments made to suppliers and instantly dispatch branded Payment Advice PDF receipts over WhatsApp.

---

### Phase 7: Analytics, Accounts Due Aging & Final Polish
- **Financial Analytics Dashboard (`/analytics`):** Real-time visibility into revenue, gross margins, and category performance split by department.
- **Overdue Accounts Receivable:** Dedicated alert banner highlighting credit customers with unpaid balances exceeding 15 days.
- **Visual Twin Slip Alignment:** Aligned `BookingSlipPrintTemplate.tsx` with the on-screen `BookingSlipModal.tsx` so that physical prints and WhatsApp PDFs are exact visual twins of what the user sees on screen.
- **Rebranding & Cleanup:** Completely purged legacy mobile shop references, updated all documentation, unified store identity to **Laxmi Electronics & Furnitures**, and containerized the microservice for **Northflank** deployment.
