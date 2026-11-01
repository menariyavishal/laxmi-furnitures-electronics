# Data Flow Document
## Mobile Shop — Inventory, Billing & Sales Analytics System

**Version:** 1.0 (Draft for Review)

---

## 1. Actors

- **Owner** — full access, including stock management and analytics.
- **Staff** — billing only, read-only stock visibility, no cost-price visibility.
- **System** — enforces validation and transactional integrity in the backend.

## 2. Flow 1 — Adding New Stock (Category-wise)

```mermaid
sequenceDiagram
    actor Owner
    participant UI as Dashboard (Add Stock)
    participant API as Backend API
    participant DB as PostgreSQL

    Owner->>UI: Select category (e.g. "Mobiles")
    UI->>API: GET /products?category_id=X
    API->>DB: Query products in category
    DB-->>API: Product list
    API-->>UI: Show products in that category
    Owner->>UI: Select product, choose "Add Stock"
    alt Serialized product (phone)
        Owner->>UI: Enter IMEI numbers (one or batch)
        UI->>API: POST /products/{id}/stock-in {imeis: [...]}
        API->>DB: Check no IMEI already exists
        API->>DB: Insert rows into product_units (status=in_stock)
        API->>DB: Insert stock_in_records row
        API->>DB: Increment products.quantity_in_stock
    else Quantity-based product (accessory)
        Owner->>UI: Enter quantity received + cost price
        UI->>API: POST /products/{id}/stock-in {quantity: N, cost_price}
        API->>DB: Insert stock_in_records row
        API->>DB: Increment products.quantity_in_stock by N
    end
    DB-->>API: Success
    API-->>UI: Updated stock count
    UI-->>Owner: Confirmation + new stock level shown
```

**Key rule:** the dashboard always asks for category → product → quantity/IMEI, in that order, so the owner never has to search through an unfiltered product list.

## 3. Flow 2 — Generating a Bill (Sale)

```mermaid
sequenceDiagram
    actor Staff
    participant UI as Billing Screen
    participant API as Backend API
    participant DB as PostgreSQL

    Staff->>UI: Search product (name or IMEI)
    UI->>API: GET /products/search?q=...
    API->>DB: Query matching products / units (excludes cost price for staff token)
    DB-->>API: Results
    API-->>UI: Show matches with selling price + stock status
    Staff->>UI: Add item to cart (quantity or specific IMEI unit)
    Staff->>UI: Repeat for more items, then "Finalize Bill"
    UI->>API: POST /bills {items: [...], payment_mode, customer}

    rect rgb(245,245,245)
    Note over API,DB: Single DB transaction
    API->>DB: For each item, verify stock still sufficient
    alt Any item insufficient stock
        API->>DB: ROLLBACK
        API-->>UI: Error — item out of stock, remove/adjust
    else All items available
        API->>DB: Create bills row + bill_items rows
        API->>DB: Decrement products.quantity_in_stock per item
        API->>DB: Mark product_units.status = 'sold' for serialized items
        API->>DB: COMMIT
        DB-->>API: Bill created
        API-->>UI: Bill number + printable bill
        UI-->>Staff: Show/print bill
    end
    end
```

**Key rule:** stock check and stock deduction happen in the *same* transaction as bill creation. This guarantees the system can never show a bill as "completed" while leaving stock counts wrong — either everything succeeds together, or nothing is saved.

## 4. Flow 3 — Monthly Sales Analysis

```mermaid
sequenceDiagram
    actor Owner
    participant UI as Analytics Dashboard
    participant API as Backend API
    participant DB as PostgreSQL

    Owner->>UI: Open "Monthly Sales" (defaults to current month)
    UI->>API: GET /analytics/monthly?month=2026-06
    API->>DB: Aggregate bills + bill_items for date range
    DB-->>API: Total revenue, units sold, category breakdown, top products
    API-->>UI: Render summary cards + breakdown table
    Owner->>UI: (optional) Change month selector
    UI->>API: GET /analytics/monthly?month=2026-05
    API->>DB: Re-aggregate for new range
    DB-->>API: Results
    API-->>UI: Updated view
```

This is read-only and always reflects live data — there's no separate "generate report" button, since the underlying query runs directly against `bills`/`bill_items` whenever the owner opens the screen.

## 5. Edge Cases & How They're Handled

| Scenario | Handling |
|---|---|
| Staff tries to sell an item with 0 stock | Blocked at both UI (item shown as "Out of stock") and API (transaction check) — never relies on UI alone |
| Two staff members try to sell the last unit of a phone at the same time | Database transaction + row-level check ensures only one bill succeeds; the second gets an "out of stock" error and must adjust the cart |
| Owner needs to cancel a bill made by mistake | `POST /bills/{id}/void` reverses stock deduction (increments quantity back / sets unit status back to `in_stock`) and marks the bill `voided`, but keeps the original row for audit history rather than deleting it |
| Duplicate IMEI entered during stock-in | Rejected at the database level (unique constraint) with a clear error message naming the conflicting IMEI |
| Low stock threshold reached | Flagged on the inventory list and owner's dashboard; does not block sales, just alerts |

## 6. Data Flow Summary Diagram (System-Level)

```mermaid
flowchart TD
    A[Stock arrives at shop] --> B[Owner adds stock via dashboard]
    B --> C[(Database: products / product_units updated)]
    C --> D[Inventory list reflects new stock]
    D --> E[Customer wants to buy]
    E --> F[Staff/Owner creates bill]
    F --> G{Stock available?}
    G -- No --> H[Block item, ask to adjust]
    G -- Yes --> I[Bill saved + stock decremented in one transaction]
    I --> J[(Database: bills / bill_items / product_units updated)]
    J --> K[Owner views Monthly Sales Analysis]
    K --> L[Revenue, units sold, category breakdown shown]
```
