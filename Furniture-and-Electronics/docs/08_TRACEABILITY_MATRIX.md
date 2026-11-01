# Traceability Matrix
## Mobile Shop — Inventory, Billing & Sales Analytics System

| Requirement ID | Description | Module | API Endpoint | Database Entities | Test Cases (Target) |
|---|---|---|---|---|---|
| **FR1.1-1.3** | Authentication & Roles | Auth | `/api/v1/auth/login`, `/api/v1/auth/logout` | `users` | Login success/failure, RBAC enforcement, session persistence |
| **FR2.1-2.2** | Category Management | Products | `/api/v1/categories` | `categories` | Create category, hierarchical retrieval, staff read-only |
| **FR3.1-3.7** | Inventory/Stock Management | Products | `/api/v1/products`, `/api/v1/products/[id]/stock-in`, `/api/v1/products/[id]/units`, `/api/v1/products/search` | `products`, `product_units`, `stock_in_records` | Add stock (quantity & IMEI), duplicate IMEI check, low-stock threshold, search functionality |
| **FR4.1-4.7** | Billing | Bills | `/api/v1/bills`, `/api/v1/bills/[id]`, `/api/v1/bills/[id]/void` | `bills`, `bill_items`, `customers`, `products`, `product_units` | Atomic bill creation, overselling prevention, voiding (stock restore), cost price hidden from staff |
| **FR5.1-5.4** | Monthly Sales Analysis | Analytics | `/api/v1/analytics/monthly` | `bills`, `bill_items`, `products`, `categories` | Accurate aggregation of revenue/units, correct category breakdown, valid month-over-month comparison |
| **FR6.1-6.2** | Dashboard (Home) | Dashboard | Combines APIs | N/A | UI rendering based on role (Owner vs Staff views) |
| **NFR-SEC** | Security (RBAC & Hashing) | Auth | All `/api/v1/*` | `users` | Hash verification, API route blocking for unauthorized roles |
| **NFR-PERF** | Performance (<1s responses) | All | All `/api/v1/*` | All | Load testing bill creation and analytics endpoints |
| **NFR-DATA** | Data Integrity (Stock Atomicity) | Bills | `/api/v1/bills` | `products`, `product_units` | Concurrent checkout of last unit, rollback on failure |
