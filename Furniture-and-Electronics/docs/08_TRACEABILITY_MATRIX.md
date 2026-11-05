# Traceability Matrix
## Laxmi Electronics & Furnitures — Requirements to Code Mapping

**Version:** 2.0 (Production Release)  
**Location:** Main Market, Bhinder, Udaipur (Raj.) — Helpline: +91 820 939 9683  

---

| Req ID | Requirement Description | Primary Module | API Endpoints | Database Entities | Test & Verification Scope |
|---|---|---|---|---|---|
| **FR1** | Authentication & RBAC | Auth | `/api/v1/auth/[...nextauth]` | `users`, `password_reset_tokens` | Credentials check, JWT session claims, API route protection, cost-price masking for staff. |
| **FR2** | Dual Catalog & Stock Tracking | Inventory | `/api/v1/categories`, `/api/v1/products`, `/api/v1/inventory` | `categories`, `products`, `product_units`, `stock_in_records` | Department filtering, quantity increment/decrement, duplicate IMEI validation, low-stock threshold triggers. |
| **FR3** | POS Counter Billing | Billing | `/api/v1/bills`, `/api/v1/bills/[id]`, `/api/v1/bills/[id]/void` | `bills`, `bill_items`, `customers`, `products`, `product_units` | Atomic checkout, inventory deduction, GST calculation (SGST+CGST), multi-mode payment, bill voiding. |
| **FR4** | Advance Wedding Bookings | Bookings | `/api/v1/bookings`, `/api/v1/bookings/[id]` | `bookings`, `booking_items`, `customers`, `delivery_schedules` | Reference code formatting (`ADB-YYYY-XXXX`), advance payment tracking, remaining balance calculation, custom notes. |
| **FR5** | Cloud Design References & Compression | Bookings | `/api/v1/bookings/upload-design` | Supabase `temp-images` bucket | Client canvas compression (10MB -> ~200KB), Supabase CDN URL generation, lightbox preview, PDF slip embedding. |
| **FR6** | Split Invoicing & Delivery Lifecycle | Deliveries | `/api/v1/bookings/[id]/invoice`, `/api/v1/bookings/[id]/complete`, `/api/v1/deliveries` | `bookings`, `booking_items`, `bills`, `delivery_schedules` | Auto-generation of `#FURN-...` bill on booking, pending electronics status, delivery invoice `#ELEC-...` on fulfillment, warranty start dates. |
| **FR7** | Automated WhatsApp Engine | WhatsApp | `/api/v1/bills/[id]/whatsapp/send`, `/api/v1/bookings/[id]/whatsapp/resend`, `POST /send` | `whatsapp_settings`, `whatsapp_deliveries`, `whatsapp_audit_logs` | Baileys socket initiation, sequential FIFO queue, 2s cooldown between documents, base64 data URL sanitization. |
| **FR8** | Accounts Due & Payment Settlement | Billing Ledger | `/api/v1/bills/[id]/payment` | `bills`, `customers`, `bookings` | Customer due balance ledger, 15+ days overdue widget, payment installment receipt PDF dispatch over WhatsApp. |
| **FR9** | Vendor Supply Chain & Purchases | Purchases | `/api/v1/purchases`, `/api/v1/vendors` | `vendors`, `purchases`, `purchase_items`, `purchase_payments` | Supplier registry, stock receipt logging (`PUR-YYYY-XXXX`), unit cost tracking, payment advice PDF dispatch over WhatsApp. |
| **FR10** | Executive Financial Analytics | Analytics | `/api/v1/analytics` | `bills`, `bill_items`, `purchases` | Revenue, gross profit calculation, department breakdown (Furniture vs Electronics), sales trends. |
