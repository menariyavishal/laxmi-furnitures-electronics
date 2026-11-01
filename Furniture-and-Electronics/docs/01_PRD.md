# Product Requirements Document (PRD)
## Mobile Shop — Inventory, Billing & Sales Analytics System

**Version:** 1.0 (Draft for Review)
**Date:** June 17, 2026
**Status:** Pending client/owner sign-off before implementation begins

---

## 1. Project Overview

The client owns a retail mobile shop selling mobile phones and accessories (covers, chargers, earphones, cables, power banks, screen guards, etc.). The shop currently has no digital system to track stock levels, generate bills, or analyze sales performance.

This project will deliver a web-based application that lets the owner and a small staff manage stock, bill customers at the counter, and review monthly sales performance — all through a clean, minimal interface that requires no technical training to use.

## 2. Goals & Objectives

| Goal | Why it matters |
|---|---|
| Real-time, accurate stock count | Prevents overselling and helps the owner know what to reorder |
| Fast, simple billing at the counter | Staff need to generate a bill in seconds, not minutes |
| Automatic stock deduction on sale | Removes manual recounting and human error |
| Monthly sales visibility | Owner needs to know revenue, units sold, and best-selling categories without manual spreadsheet work |
| Minimal, easy-to-use UI | Staff may not be tech-savvy; the system must be learnable in one sitting |

## 3. Users & Roles

| Role | Who | Access |
|---|---|---|
| **Owner (Admin)** | Shop owner | Full access: manage inventory, add stock, generate bills, view sales analytics, manage staff accounts |
| **Staff** | 1–2 counter staff | Billing only: create bills, view current stock (read-only) to check availability. No access to analytics, stock editing, or cost-price data |

A key access rule: staff should **not** see purchase/cost price or profit margins — only the owner does. This protects sensitive business data while still letting staff bill customers.

## 4. Scope

### 4.1 In Scope (Version 1)
- User login with role-based access (Owner / Staff)
- Category and sub-category management (e.g. Mobiles → Samsung, Xiaomi; Accessories → Chargers, Covers)
- Add new stock, category-wise, via a simple dashboard
  - Serialized items (phones): add by entering IMEI/serial number per unit
  - Quantity items (accessories): add by entering quantity received
- Live inventory view: current stock per product, low-stock flagging
- Bill generation (point-of-sale style):
  - Search/select product (phone by IMEI/model, accessory by name)
  - Auto-fetch selling price, allow quantity entry for accessories
  - Apply discount (optional, owner-controlled permission)
  - Generate a printable/shareable bill with a unique bill number
  - Automatic stock deduction the moment a bill is finalized
- Monthly sales analysis dashboard:
  - Total units sold (this month vs. previous month)
  - Total revenue (this month vs. previous month)
  - Category-wise / product-wise sales breakdown (e.g. "12 Samsung phones, 40 chargers sold this month")
  - Best-selling products
- Basic customer record on a bill (name + phone number, optional) — useful for warranty lookups later
- Stock history / audit trail (who added stock, when, how much)

### 4.2 Out of Scope (Version 1 — candidates for later phases)
- Multi-branch / multi-shop support
- Supplier management & purchase orders
- Returns & refunds workflow
- Repair/service job tracking
- GST-compliant tax invoice formatting (can be added once the client confirms tax requirements)
- Barcode scanning hardware integration
- SMS/WhatsApp bill sharing automation
- Online store / e-commerce
- Offline-first / no-internet mode

These are flagged so they can be prioritized in a Phase 2 discussion once the core system is live and validated.

## 5. Functional Requirements

### 5.1 Authentication & Roles
- FR1.1: System supports login via username/password.
- FR1.2: Owner can create staff accounts and disable/remove them.
- FR1.3: Every action that modifies data (stock add, bill creation, edits) is tied to the logged-in user for audit purposes.

### 5.2 Category Management
- FR2.1: Owner can create, rename, and deactivate categories and sub-categories.
- FR2.2: Every product must belong to exactly one category.

### 5.3 Inventory / Stock Management
- FR3.1: Owner can add a new product (phone model or accessory) under a category, with name, brand, cost price, selling price, and type (serialized or quantity-based).
- FR3.2: For serialized products, owner adds stock by entering one or more IMEI/serial numbers; each becomes an individually trackable unit with status `in_stock`.
- FR3.3: For quantity-based products, owner adds stock by entering a quantity; the product's running stock count increases by that amount.
- FR3.4: The dashboard for adding stock is organized category-wise, so the owner picks a category first, then the product, then enters quantity/IMEIs.
- FR3.5: System prevents duplicate IMEI entries.
- FR3.6: System flags products below a configurable low-stock threshold.
- FR3.7: Inventory list is searchable/filterable by category, name, and stock status.

### 5.4 Billing
- FR4.1: Staff/Owner can start a new bill, add one or more line items (product + quantity, or specific IMEI unit for phones).
- FR4.2: System blocks adding a quantity greater than what's currently in stock.
- FR4.3: On bill finalization, the system atomically (a) decreases stock for each line item and (b) marks any sold IMEI unit as `sold`, in a single transaction — so a half-completed bill never leaves stock in an inconsistent state.
- FR4.4: System generates a sequential, unique bill number and timestamp.
- FR4.5: Bill is viewable/printable; basic customer name & phone can be attached.
- FR4.6: Staff cannot see cost price or profit margin on any screen, including the billing screen.
- FR4.7: Owner can void/cancel a bill within the same day, which restores the stock (with a logged reason).

### 5.5 Monthly Sales Analysis
- FR5.1: Owner can view, for any selected month: total revenue, total units sold, and a category/product breakdown.
- FR5.2: Owner can compare the selected month against the previous month (e.g. % change in revenue and units).
- FR5.3: Owner can see top-selling products for the month.
- FR5.4: Data refreshes automatically as new bills are created — no manual "generate report" step required.

### 5.6 Dashboard (Home Screen)
- FR6.1: Owner's home screen shows: today's sales total, this month's revenue so far, low-stock alerts, and quick links to "Add Stock" and "New Bill".
- FR6.2: Staff's home screen shows only: "New Bill" and a read-only stock lookup.

## 6. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Usability | Minimal UI, large clear buttons, no jargon, max 2–3 clicks to complete common tasks (add stock, create bill) |
| Performance | Bill creation and stock updates should feel instant (<1s) even with a few thousand products |
| Reliability | Stock counts must never go negative or desync from actual sales — enforced via DB transactions |
| Security | Passwords hashed, role-based access enforced on the backend (not just hidden in UI) |
| Accessibility | Usable on a desktop/laptop at the counter; should also work reasonably on a tablet |
| Data integrity | Every stock change and sale is logged with who/when, for accountability |

## 7. UI/UX Guidelines

- Clean, minimal layout — no clutter, no unnecessary steps.
- Plain language labels ("Add Stock", "New Bill", "This Month's Sales") instead of technical terms.
- Mobile-shop-relevant visual hierarchy: category → product → action, always in that order.
- Color used sparingly and meaningfully (e.g. red badge for low stock, green for in-stock).
- Confirmation prompts only for irreversible actions (e.g. voiding a bill), not for routine ones.

## 8. Key User Stories

1. *As the owner*, I want to add 10 new Samsung phones by scanning/typing their IMEI numbers, so my stock count is accurate.
2. *As staff*, I want to search "charger" and create a bill for 2 units in under 30 seconds.
3. *As the owner*, I want to see at a glance how much revenue came in this month compared to last month.
4. *As the owner*, I want to know which 5 products sold the most this month, so I know what to restock.
5. *As staff*, I want the system to stop me from selling a phone that's already been sold or isn't in stock.

## 9. Assumptions

- Single shop, single location (no multi-branch in v1).
- Internet connectivity is available at the shop (web app, not offline-first).
- Currency: INR (₹); tax handling kept simple in v1, can be revisited.
- 1–2 staff accounts is the expected scale, not a large team.

## 10. Success Metrics

- Stock count accuracy: 0 discrepancies between system stock and physical stock after a defined trial period.
- Bill creation time: under 30 seconds per transaction for a trained staff member.
- Owner can answer "how much did I sell this month and of what" without touching a spreadsheet.

## 11. Open Questions for Client (to refine before build)

1. Does the client need GST-compliant invoices (with tax breakup), or are simple receipts acceptable for now?
2. Should staff be allowed to apply discounts, or is that owner-only?
3. Any specific bill format/branding (shop name, logo, address) to include on printed bills?
4. Should there be a way to flag a sold phone for warranty/return tracking later (even if returns aren't built in v1)?
