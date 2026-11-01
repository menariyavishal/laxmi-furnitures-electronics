<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-00E599?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

<h1 align="center">🏪 Laxmi Electronics & Furnitures</h1>
<h3 align="center">POS · Advance Wedding Packages · Inventory · Cloud Design Upload · WhatsApp Dispatch</h3>

<p align="center">
  A production-grade, full-stack <strong>Point of Sale and Package Management</strong> system built for <strong>Laxmi Electronics & Furnitures, Kanore</strong>.<br/>
  Manages inventory, generates GST-compliant invoices, coordinates advance wedding bookings, stores custom design specs in Supabase, and dispatches automated PDF receipts via WhatsApp.
</p>

---

## ✨ Feature Highlights

| Module | Capabilities |
|:---|:---|
| **POS Billing Terminal** | Real-time invoice preview · Smart product search · Barcode scanning · GST tax computation · Partial payments · UPI QR display |
| **Wedding Package Bookings** | Advance order slips (`ADB-2026-XXXX`) · Multi-department reservations · Automatic immediate Furniture Tax Invoice (`#FURN-YYYY-XXXX`) · Scheduled electronics delivery |
| **Design Attachments** | Client-side canvas compression (down to 150–250KB) · Supabase Storage integration · Clean non-intrusive frosted glass lightbox modal |
| **Automated WhatsApp Dispatch** | Standalone Baileys microservice (Northflank) · Sequential FIFO queue preventing upload collisions · Local development daemon · Dual PDF delivery |
| **Purchases & Vendor Ledger** | Wholesale purchase receipts · Vendor directory · Installment disbursements · Automated WhatsApp payment advice |
| **Due Payments & Collections** | Outstanding balance tracker · Overdue alerts · One-click settlement · Automated WhatsApp reminder notices |
| **Analytics & Reports** | Department-wise sales trends · Interactive Recharts · Excel / CSV exports · Inventory stock health indicators |

---

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Database setup
npx prisma generate
npx prisma db push

# 3. Start local WhatsApp daemon (Terminal 1)
npm run whatsapp:local

# 4. Start Next.js development server (Terminal 2)
npm run dev
```

---

<p align="center">
  Built with ❤️ for <strong>Laxmi Electronics & Furnitures, Kanore</strong><br/>
  Main Market, Kanore, Udaipur (Raj.) • Helpline: +91 63755 91682
</p>
