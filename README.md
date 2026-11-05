<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-00E599?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Baileys-WhatsApp-25D366?style=for-the-badge&logo=whatsapp" alt="WhatsApp" />
</p>

<h1 align="center">🛋️⚡ Laxmi Electronics & Furnitures</h1>
<h3 align="center">Retail POS · Advance Wedding Packages · Inventory · Automated WhatsApp Dispatch</h3>

<p align="center">
  An enterprise-grade, multi-department enterprise resource and retail management platform built for <strong>Laxmi Electronics & Furnitures, Bhinder (Udaipur, Rajasthan)</strong>.<br/>
  Orchestrates dual-department billing, advance wedding package bookings, vendor purchases, cloud design references, and automated PDF document delivery over WhatsApp.
</p>

---

## 🌟 Key Highlights & Innovations

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CORE CAPABILITIES OVERVIEW                                │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ 🛋️ Multi-Dept POS Billing  │ 💍 Wedding Package Bookings │ 📷 Design Reference Cloud   │
│ Direct checkout, GST tax   │ Advance ledger, partial     │ Client-side image compress, │
│ computation, cash/UPI/EMI, │ delivery schedules, auto-   │ Supabase bucket integration,│
│ real-time live preview.    │ invoice generation.         │ crisp PDF document embeds.  │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ 💬 WhatsApp Microservice   │ 📦 Vendor Purchases & Ledger│ 📊 Real-Time Analytics      │
│ Baileys daemon, sequential │ Wholesale inventory supply, │ Live sales trends, overdue  │
│ FIFO queue, auto PDF send. │ vendor ledger & WhatsApp.   │ alerts, inventory health.   │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 📚 System & Engineering Documentation

Comprehensive technical specifications, entity models, and architectural guides are maintained inside [`Furniture-and-Electronics/docs/`](Furniture-and-Electronics/docs):

| Document | Description | Direct Link |
|---|---|---|
| **01. Product Requirements Document (PRD)** | Business goals, dual-department showroom operations, advance wedding package lifecycle, and core feature definitions. | [📖 View 01_PRD.md](Furniture-and-Electronics/docs/01_PRD.md) |
| **02. Technology Stack & Architecture** | Full-stack technology choices, client canvas compression engine, Baileys WebSocket protocol, and Northflank hosting topology. | [🔧 View 02_TECH_STACK.md](Furniture-and-Electronics/docs/02_TECH_STACK.md) |
| **03. Database Architecture & ERD** | Complete PostgreSQL database schema, Prisma model definitions, relationships, foreign keys, and indexing strategy. | [🗄️ View 03_DATABASE_ARCHITECTURE.md](Furniture-and-Electronics/docs/03_DATABASE_ARCHITECTURE.md) |
| **04. System Data Flows** | Sequence diagrams for booking assembly, split delivery invoicing, POS checkout, due payment collection, and WhatsApp message queues. | [🔄 View 04_DATA_FLOW.md](Furniture-and-Electronics/docs/04_DATA_FLOW.md) |
| **05. Project Structure & Modularity** | Comprehensive guide to folder organization, App Router paths, component hierarchy, and decoupled microservice files. | [📁 View 05_PROJECT_STRUCTURE.md](Furniture-and-Electronics/docs/05_PROJECT_STRUCTURE.md) |
| **06. Phase Distribution & Roadmap** | Technical log and breakdown of all 7 implementation phases (POS, Bookings, Cloud Storage, WhatsApp Engine, Purchases, Polish). | [🚀 View 06_PHASE_DISTRIBUTION.md](Furniture-and-Electronics/docs/06_PHASE_DISTRIBUTION.md) |
| **07. Requirements Analysis Report** | Functional requirements baseline (FR1-FR10), security rules, role boundaries, and business rules. | [📊 View 07_REQUIREMENTS_ANALYSIS_REPORT.md](Furniture-and-Electronics/docs/07_REQUIREMENTS_ANALYSIS_REPORT.md) |
| **08. Traceability Matrix** | Traceability mapping linking every functional requirement to its UI modules, API routes, database models, and test scope. | [🎯 View 08_TRACEABILITY_MATRIX.md](Furniture-and-Electronics/docs/08_TRACEABILITY_MATRIX.md) |
| **09. Future Enhancements** | Technical proposals for global barcode scanner listeners, driver mobile companion PWA, godown transfers, and catalog bot. | [🔮 View future enhancements 1.md](Furniture-and-Electronics/docs/future%20enhancements%201.md) |

---

## 🏗️ System Architecture

```
                                  ┌──────────────────────────────┐
                                  │      Client Web Browser      │
                                  │ (Next.js 16 + React 19 UI)   │
                                  └──────────────┬───────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                │                                 │
                     HTTP / API Routes              Upload Compressed Photos
                                │                                 │
                                ▼                                 ▼
                 ┌──────────────────────────────┐  ┌──────────────────────────────┐
                 │     Vercel Serverless App    │  │    Supabase Storage Bucket   │
                 │  - Multi-Dept POS Terminal   │  │   - Bucket: temp-images      │
                 │  - Package Bookings Manager  │  │   - Folder: bookings/{ref}/  │
                 │  - NextAuth RBAC Security    │  │   - Public CDN Distribution  │
                 └──────────────┬───────────────┘  └──────────────────────────────┘
                                │
                  Prisma ORM 6  │  Connection Pooling
                                ▼
                 ┌──────────────────────────────┐
                 │    Neon Serverless Postgres  │
                 │  - Customers, Bills, Bookings│
                 │  - Inventory, Stock History  │
                 │  - WhatsApp Audit Records    │
                 └──────────────┬───────────────┘
                                │
                   REST API with x-api-key & Base64 Documents
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ WhatsApp Bot Microservice    │
                 │ (Northflank Container / Baileys)
                 │  - Sequential FIFO Queue     │
                 │  - Multi-File Auth State     │
                 │  - Dual Document Dispatcher  │
                 └──────────────┬───────────────┘
                                │
                     End-to-End Encrypted Baileys Socket
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │    Customer WhatsApp Phone   │
                 │  - Official Booking Slip PDF │
                 │  - Furniture Tax Invoice PDF │
                 └──────────────────────────────┘
```

---

## 💎 Module Deep-Dive

### 1. 💍 Advance Wedding & Event Package Bookings (`/bookings`)
Built specifically for Indian showroom workflows where families reserve complete furniture suites and home electronics months in advance:
* **Booking References**: Automatic generation of human-friendly reference codes (`ADB-2026-XXXX`).
* **Multi-Department Split**: Separate financial tracking for Furniture vs. Electronics with independent delivery schedules.
* **Immediate Furniture Tax Invoice**: Automatically creates and links `#FURN-YYYY-XXXX` tax invoice upon booking confirmation.
* **On-Delivery Electronics Invoicing**: Reserved electronics remain pending until physical dispatch, at which point serial numbers/IMEIs and warranty terms are assigned.
* **Visual Booking Slip**: Branded, print-ready document displaying item descriptions, custom woodworking specifications, financials, design photo references, and signature areas.

### 2. 📷 Cloud Design References & Client Compression
* **Client-Side Canvas Compression**: High-resolution smartphone camera photos (5–12MB) are automatically compressed in-browser down to **150–250KB** before upload, preserving aspect ratio and sharpness while eliminating network bottlenecks.
* **Structured Supabase Storage**: Uploads straight to `temp-images` under predictable, booking-specific directories: `bookings/{bookingNumber}/{filename}.jpg`.
* **Lightbox Preview**: Clean, standard-sized modal preview with frosted glass blur backdrop (`backdrop-blur-md bg-black/25`) that lets the underlying slip remain softly visible without pitch-black letterboxing.

### 3. 💬 Robust WhatsApp Delivery Engine (`whatsapp-bot`)
* **Sequential Outgoing FIFO Queue**: Eliminates media collision errors on Baileys sockets. Back-to-back documents (Booking Slip PDF + Furniture Tax Invoice PDF) are queued with a 2-second cooldown to guarantee WhatsApp media servers process each document completely.
* **Base64 Sanitization**: Cleans and validates PDF buffer payloads, stripping data URL headers (`data:application/pdf;base64,`).
* **Standalone Microservice**: Fully decoupled Express microservice architected for container deployment on **Northflank** or standalone daemon execution.
* **Local Development Daemon**: Includes `scripts/local-whatsapp-daemon.js` using Node.js native `http` module, strictly reading `.env.local` to safely test WhatsApp flows locally without touching production.

### 4. 🧾 Dual-Department POS Terminal (`/billing`)
* **Live Reactive Preview**: Visual invoice updates dynamically in real-time as products, quantities, custom notes, and taxes are selected.
* **Smart Search & Barcode Scan**: Instant search across product names, categories, and barcodes, integrated with camera scanning via `html5-qrcode`.
* **Flexible Payments**: Support for Cash, UPI QR code, Credit/Debit cards, and Bank Transfers.
* **Automatic Customer Memory**: Recalls customer address and purchase history upon typing a 10-digit mobile number.

### 5. 🚚 Deliveries & Scheduled Fulfillment (`/deliveries`)
* **Interactive Timeline**: Real-time status cards showing days remaining until scheduled delivery.
* **One-Click Invoice Generator**: Converts reserved pending electronics into delivered tax invoices with warranty certificates.
* **Fulfillment Seals**: Delivered packages are stamped with completion verification seals on the booking slip.

### 6. 💼 Vendor Purchases & Supplies (`/purchases`)
* **Vendor Directory**: Manage wholesale distributors and manufacturers with contact details and GSTINs.
* **Purchase Orders**: Log stock-in receipts with batch numbers, unit costs, and tax breakdown.
* **Payment Advice**: Track disbursed installments and dispatch WhatsApp payment advice receipts directly to suppliers.

---

## 📂 Project Structure

```
Laxmi-electronic-and-furnitures/
├── Furniture-and-Electronics/          # Main Next.js 16 Web Application
│   ├── app/                            # App Router (Pages, API Routes & Layouts)
│   │   ├── (auth)/                     # Login & Forgot Password workflows
│   │   ├── (dashboard)/                # Dashboard, Billing, Bookings, Inventory, Purchases
│   │   └── api/v1/                     # REST API endpoints (Prisma-backed)
│   ├── components/                     # Reusable UI Components
│   │   ├── dashboard/                  # Module tables, slips, invoice templates, charts
│   │   └── ui/                         # Design system buttons, modals, input elements
│   ├── docs/                           # 9 In-Depth Engineering & Architecture Docs
│   ├── lib/                            # Shared Utilities & Business Logic
│   │   ├── booking-photos.ts           # Pure design photo extraction (Safe for Server & Client)
│   │   ├── image-compression.ts        # Client-side canvas image compressor
│   │   ├── pdf/booking-slip.ts         # Client-side booking slip PDF renderer
│   │   ├── supabase/storage.ts         # Supabase Cloud Storage driver
│   │   └── whatsapp/                   # WhatsApp client, templates, and dispatchers
│   ├── prisma/                         # Database schema & migrations (Neon PostgreSQL)
│   └── scripts/                        # Local dev utilities & standalone WhatsApp daemon
│
├── whatsapp-bot/                       # Standalone WhatsApp Bot Microservice (Northflank)
│   ├── config.js                       # Environment & secrets manager
│   ├── db.js                           # PostgreSQL connection pool & audit logging
│   ├── queue.js                        # Sequential FIFO message queue
│   ├── whatsapp.js                     # Baileys client lifecycle & MultiFileAuthState
│   ├── sender.js                       # JID normalization, base64 buffer parser, message dispatcher
│   ├── routes.js                       # Express API endpoints (/health, /status, /connect, /send)
│   └── server.js                       # Express application bootstrap
│
└── README.md                           # Master Project Documentation Portal
```

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or later (Node.js 20+ recommended)
* **npm** or **pnpm**
* **PostgreSQL Database** (Neon Serverless PostgreSQL recommended)
* **Supabase Project** (with a public bucket named `temp-images`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/laxmi-electronics-and-furnitures.git
cd laxmi-electronics-and-furnitures

# Install Main Application dependencies
cd Furniture-and-Electronics
npm install

# Install WhatsApp Microservice dependencies
cd ../whatsapp-bot
npm install
```

### 2. Configure Environment Variables
Inside `Furniture-and-Electronics/`, create `.env.local`:
```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"

# NextAuth Authentication
NEXTAUTH_SECRET="your-secure-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Supabase Cloud Storage (Design Attachments)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
SUPABASE_SECRET_KEY="your-supabase-secret-key"

# WhatsApp Microservice Connection (Local Daemon)
WHATSAPP_BOT_URL="http://localhost:3001"
WHATSAPP_API_KEY="local-dev-key"
```

Inside `whatsapp-bot/`, configure `.env`:
```env
PORT=3001
API_KEY="local-dev-key"
DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
```

### 3. Run Database Migrations
```bash
cd Furniture-and-Electronics
npx prisma generate
npx prisma db push
```

### 4. Start Development Servers
**Terminal 1 — WhatsApp Bot Daemon:**
```bash
cd Furniture-and-Electronics
npm run whatsapp:local
```

**Terminal 2 — Next.js Application:**
```bash
cd Furniture-and-Electronics
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment Guide

### Main Web Application (Vercel)
1. Push `Furniture-and-Electronics` to your GitHub repository.
2. Import project into **Vercel** with Root Directory set to `Furniture-and-Electronics`.
3. Add environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `WHATSAPP_BOT_URL`, `WHATSAPP_API_KEY`).
4. Set `WHATSAPP_BOT_URL` to your live **Northflank** microservice URL (`https://your-service.northflank.app`).

### WhatsApp Microservice (Northflank)
1. Deploy `whatsapp-bot` as a continuous Docker / Node service on **Northflank**.
2. Mount a persistent volume at `/app/whatsapp-sessions` so session auth credentials survive service redeploys.
3. Configure environment variables (`PORT=3001`, `API_KEY`, `DATABASE_URL`, `WHATSAPP_SESSION_DIR=/app/whatsapp-sessions`).
4. Health check endpoint: `GET /health`.

---

<p align="center">
  Built with ❤️ for <strong>Laxmi Electronics & Furnitures, Bhinder</strong><br/>
  Main Market, Bhinder, Udaipur (Raj.) • Helpline: +91 820 939 9683
</p>
