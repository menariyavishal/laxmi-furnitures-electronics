# Project Structure & Directory Architecture
## Laxmi Electronics & Furnitures — Codebase Organization & Modularity Guide

**Version:** 2.0 (Production Release)  
**Location:** Main Market, Kanore, Udaipur (Raj.) — Helpline: +91 63755 91682  

---

## 1. Top-Level Repository Architecture

The project consists of the core web management application (`Furniture-and-Electronics/`) and a decoupled, containerized WhatsApp microservice (`whatsapp-bot/`).

```
Laxmi-electronic-and-furnitures/
├── README.md                           # Master Architecture & Documentation Portal
├── .gitignore                          # Root ignore file
│
├── Furniture-and-Electronics/          # Main Next.js 16 Web Application
│   ├── app/                            # Next.js App Router (Pages, Layouts & API)
│   ├── components/                     # Modular React Components
│   ├── docs/                           # Comprehensive Engineering Documentation
│   ├── lib/                            # Business Logic, Utilities & Integration Drivers
│   ├── prisma/                         # Database Schema & Migrations
│   ├── public/                         # Static Brand Assets & Signatures
│   ├── scripts/                        # Operational Scripts & Local WhatsApp Daemon
│   ├── .env.local                      # Local Development Secrets
│   ├── package.json                    # Application Manifest
│   ├── tsconfig.json                   # TypeScript Compiler Configuration
│   └── next.config.ts                  # Next.js Runtime Configuration
│
└── whatsapp-bot/                       # Standalone WhatsApp Bot Microservice (Northflank)
    ├── config.js                       # Environment Configuration & Logger
    ├── db.js                           # PostgreSQL Pool & Audit Logging
    ├── queue.js                        # Sequential FIFO Queue with 2s Cooldown
    ├── whatsapp.js                     # Baileys Lifecycle & MultiFileAuthState
    ├── sender.js                       # JID Parsing, Base64 Sanitizer & Dispatch
    ├── routes.js                       # Express API Endpoints & Auth Middleware
    ├── server.js                       # Microservice Entry Point
    ├── Dockerfile                      # Production Containerization Spec
    └── package.json                    # Microservice Manifest
```

---

## 2. Main Web Application (`Furniture-and-Electronics/`)

### 2.1 Route Topology (`app/`)
Organized by route groups using Next.js App Router conventions:

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx                    # Counter & Admin Authentication Page
│
├── (dashboard)/
│   ├── layout.tsx                      # Dashboard shell (Sidebar, Header, Alerts)
│   ├── page.tsx                        # Master Executive Dashboard & KPI Summary
│   │
│   ├── billing/
│   │   ├── page.tsx                    # Point-of-Sale Dual-Department Terminal
│   │   ├── [id]/page.tsx               # Tax Invoice View & Print Interface
│   │   └── history/page.tsx            # Historical Bills & Accounts Receivable Ledger
│   │
│   ├── bookings/
│   │   ├── page.tsx                    # Wedding & Advance Package Order Explorer
│   │   └── new/page.tsx                # Advance Package Assembler & Photo Uploader
│   │
│   ├── deliveries/
│   │   └── page.tsx                    # Delivery Schedule Calendar & Fulfillment
│   │
│   ├── inventory/
│   │   ├── page.tsx                    # Catalog Browser (Furniture vs Electronics)
│   │   ├── add/page.tsx                # New Product Catalog Insertion
│   │   └── [id]/stock/page.tsx         # Restock / Stock-In Record Entry
│   │
│   ├── purchases/
│   │   ├── page.tsx                    # Vendor Purchase Orders & Inbound Stock
│   │   ├── new/page.tsx                # Supplier Stock-In Purchase Logger
│   │   └── vendors/page.tsx            # Wholesale Vendor Directory
│   │
│   └── analytics/
│       └── page.tsx                    # Revenue, Margins & Department Analytics
│
└── api/v1/                             # RESTful API Endpoints (JSON / Prisma)
    ├── auth/
    │   └── [...nextauth]/route.ts      # NextAuth JWT Session Handler
    ├── bills/
    │   ├── route.ts                    # GET / POST bills
    │   └── [id]/
    │       ├── route.ts                # Bill detail / cancellation
    │       ├── payment/route.ts        # Due balance settlement
    │       └── whatsapp/send/route.ts  # Invoice WhatsApp delivery
    ├── bookings/
    │   ├── route.ts                    # GET / POST advance bookings
    │   ├── upload-design/route.ts      # Supabase photo upload proxy
    │   └── [id]/
    │       ├── invoice/                # Generate delivery invoice for appliances
    │       ├── complete/               # Settle & complete booking
    │       └── whatsapp/resend/        # Resend Booking Slip via WhatsApp
    ├── categories/route.ts             # Category CRUD
    ├── customers/route.ts              # Customer search & profiling
    ├── deliveries/route.ts             # Delivery calendar querying
    ├── inventory/route.ts              # Inventory levels & serial tracking
    ├── products/route.ts               # Product catalog queries
    ├── purchases/route.ts              # Wholesale purchase records
    ├── vendors/route.ts                # Vendor directory API
    └── whatsapp/settings/route.ts      # Bot status, QR pairing & health check
```

---

### 2.2 Component Hierarchy (`components/`)
Modular UI components isolated by domain:

```
components/
├── dashboard/
│   ├── header.tsx                      # Top navigation bar with store identity
│   ├── sidebar.tsx                     # Department navigation menu
│   │
│   ├── billing/
│   │   ├── BillItemsTable.tsx          # Dynamic line-item billing table
│   │   ├── InvoicePrintTemplate.tsx    # Branded GST Tax Invoice print format
│   │   ├── LiveInvoicePreview.tsx      # Real-time counter receipt preview
│   │   └── PaymentModal.tsx            # Multi-mode tender dialog (Cash, UPI, Due)
│   │
│   ├── bookings/
│   │   ├── BookingCard.tsx             # Interactive booking summary card
│   │   ├── BookingSlipModal.tsx        # Screen modal with blurred glass lightbox
│   │   ├── BookingSlipPrintTemplate.tsx # Visual twin print-ready slip template
│   │   └── new/
│   │       ├── CustomerDetailsForm.tsx # Customer & delivery date capture
│   │       ├── PackageItemsTable.tsx   # Item selector with auto image compressor
│   │       └── PackageSummaryCard.tsx  # Financial ledger (Advance, Due, Totals)
│   │
│   ├── inventory/
│   │   ├── InventoryTable.tsx          # Multi-department stock table with filters
│   │   └── BarcodeScannerModal.tsx     # Webcam scanner integration
│   │
│   └── purchases/
│       ├── PurchaseItemsTable.tsx      # Inbound items with unit cost prices
│       └── PaymentAdviceModal.tsx      # Vendor payment slip preview & WhatsApp
│
└── ui/                                 # Primitive design system components
    ├── button.tsx                      # Button primitives
    ├── card.tsx                        # Container cards
    ├── dialog.tsx                      # Accessible dialog modals
    ├── input.tsx                       # Text inputs with validation styling
    └── table.tsx                       # Data tables
```

---

### 2.3 Shared Business Logic & Integrations (`lib/`)

```
lib/
├── auth.ts                             # NextAuth configuration and credentials provider
├── prisma.ts                           # Global Prisma client singleton
│
├── booking-photos.ts                   # PURE UTILITY (Safe for Server & Client)
│                                       # Extracts Supabase photo URLs from customisations JSON
│
├── image-compression.ts                # CLIENT-SIDE ONLY (HTML5 Canvas)
│                                       # Compresses 10MB camera images to 150-250KB JPEG
│
├── pdf/
│   └── booking-slip.ts                 # "use client" PDF generation wrapper
│                                       # Renders BookingSlipPrintTemplate to jsPDF blob
│
├── supabase/
│   └── storage.ts                      # Supabase Storage client (Bucket: temp-images)
│
└── whatsapp/                           # Unified WhatsApp subsystem
    ├── client.ts                       # HTTP client communicating with bot service
    ├── templates.ts                    # Concise WhatsApp message text formatters
    ├── dispatch.ts                     # High-level dispatch helpers for bills/bookings
    ├── types.ts                        # Request/response interfaces
    └── index.ts                        # Public barrel export
```

---

## 3. WhatsApp Bot Microservice (`whatsapp-bot/`)

Designed as a standalone microservice to ensure the WhatsApp WebSocket stays online independently from serverless web app deployments:

```
whatsapp-bot/
├── config.js                           # Loads PORT, API_KEY, DATABASE_URL, SESSION_DIR
├── db.js                               # pg pool for updating whatsapp_settings & audit logs
├── queue.js                            # Sequential FIFO queue enforcing 2,000ms cooldown
├── whatsapp.js                         # Baileys socket initiation, reconnection & QR capture
├── sender.js                           # JID normalization, base64 sanitizer, document send
├── routes.js                           # Express router: /health, /status, /connect, /send
├── server.js                           # Express entry point (25MB payload limit for PDFs)
└── Dockerfile                          # Production container image specification
```
