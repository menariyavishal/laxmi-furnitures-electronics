# Requirements Analysis Report
## Mobile Shop — Inventory, Billing & Sales Analytics System

### 1. User Roles
* **Owner (Admin):** Full access to the system. Can manage inventory, add stock, generate bills, view sales analytics, and manage staff accounts. Has visibility into cost prices and profit margins.
* **Staff:** Counter staff with billing-only access. Can create bills and view current stock availability (read-only). Cannot access analytics, stock editing, cost-price data, or profit margins.

### 2. Functional Requirements
* **FR1 Authentication & Roles:** Username/password login, role-based access, audit trails for data modification.
* **FR2 Category Management:** Create, rename, deactivate categories/sub-categories (Owner only). Each product belongs to one category.
* **FR3 Inventory Management:** Add new products (serialized or quantity-based). Add stock via IMEI (serialized) or quantity. Dashboard organized category-wise. Prevent duplicate IMEIs. Low-stock flagging.
* **FR4 Billing:** Start new bill, add line items (quantity or IMEI). Block adding > stock. Atomic stock deduction on finalization. Sequential bill numbers. View/print bill with customer details. Void/cancel bill (same day, Owner only). Staff cannot see cost prices.
* **FR5 Monthly Sales Analysis:** View total revenue, units sold, category/product breakdown for selected month. Month-over-month comparison. Top-selling products. Automatic data refresh.
* **FR6 Dashboard:** Owner dashboard with today's sales, month's revenue, low-stock alerts, quick links. Staff dashboard with "New Bill" and read-only stock lookup.

### 3. Non-Functional Requirements
* **Usability:** Minimal UI, max 2-3 clicks for common tasks, no jargon.
* **Accessibility:** Usable on desktop/laptop and reasonably on a tablet.
* **Data Integrity:** Every stock change/sale is logged. Stock counts must never go negative.

### 4. Business Rules
* Serialized products are tracked individually by IMEI (must be unique globally).
* Quantity-based products are tracked by a running count.
* Staff must never see cost prices or profit margins.
* Stock deduction and bill creation must be atomic (single transaction).
* Voiding a bill restores stock and must happen on the same day.

### 5. User Journeys
* **Adding Stock (Owner):** Select category -> Select product -> Enter IMEIs (serialized) OR quantity + cost price (quantity-based) -> Submit -> Stock incremented.
* **Billing (Staff/Owner):** Search product -> Add to cart (select IMEI if serialized) -> Add customer info (optional) -> Finalize -> Print/share bill -> Stock atomically decremented.
* **Analytics (Owner):** Open Dashboard -> Select Month -> View Revenue, Units, Breakdown, Comparison.

### 6. API Requirements
RESTful JSON endpoints under `/api/v1/`:
* `POST /auth/login`, `POST /auth/logout`
* `GET/POST /categories`, `PATCH /categories/[id]`
* `GET/POST /products`, `GET /products/search`, `PATCH /products/[id]`, `POST /products/[id]/stock-in`, `GET /products/[id]/units`
* `GET/POST /bills`, `GET /bills/[id]`, `POST /bills/[id]/void`
* `GET /analytics/monthly`
* `GET/POST /users`

### 7. Database Requirements
* Relational database (PostgreSQL) ensuring ACID transactions.
* Tables: `users`, `categories`, `products`, `product_units`, `stock_in_records`, `customers`, `bills`, `bill_items`.
* Constraints: `quantity_in_stock >= 0`, globally unique `imei_number`.

### 8. Security Requirements
* Passwords hashed (bcrypt/argon2).
* Role-based access control (RBAC) enforced at the backend (API route level).
* API layer must filter out cost prices for staff tokens.
* Prevention of SQL injection via Prisma ORM.

### 9. Infrastructure & Deployment Requirements
* **Architecture:** Unified Next.js monorepo.
* **Backend:** Next.js API Routes (`/api/v1/`).
* **Database:** PostgreSQL (Supabase or local).
* **Hosting:** Vercel.
* **CI/CD:** GitHub Actions.

### 10. Third-Party Integrations
* No external third-party integrations required for MVP (no SMS/WhatsApp integration yet, only browser print dialog via `react-to-print`).

### 11. Performance Requirements
* Bill creation and stock updates must be < 1s.
* Monthly sales analysis queries should complete in < 1s.

### 12. Missing Requirements, Ambiguities, & Risks
* **Ambiguity:** Format for printable bill (e.g., logo, exact shop details).
* **Ambiguity:** Definition of "same day" for voiding bills (24 hours or calendar day?).
* **Ambiguity:** Can staff apply discounts? (PRD says optional, owner-controlled permission, but no specific feature defined in Tech Stack to handle discount permission per user, just role).
* **Risk:** Concurrent sales of the last serialized unit. (Mitigated by database row-level locking).
* **Constraint:** Must use Next.js, Prisma, PostgreSQL, Tailwind. No alternatives allowed.
