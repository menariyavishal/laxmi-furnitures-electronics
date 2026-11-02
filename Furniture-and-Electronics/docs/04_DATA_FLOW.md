# System Data Flows & Lifecycle Workflows
## Laxmi Electronics & Furnitures — End-to-End Operational Pipelines

**Version:** 2.0 (Production Release)  
**Location:** Main Market, Kanore, Udaipur (Raj.) — Helpline: +91 63755 91682  

---

## 1. Flow 1: Advance Wedding Package Booking & Dual WhatsApp Dispatch

This is the primary workflow for wedding packages and advance furniture/electronics orders.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Showroom Staff
    participant UI as Browser / React UI
    participant Canvas as Client Canvas Compressor
    participant Supabase as Supabase Storage
    participant API as Next.js API (/api/v1/bookings)
    participant DB as Neon PostgreSQL
    participant Bot as WhatsApp Microservice
    actor Cust as Customer Phone

    Staff->>UI: Fills Customer, Event Date, Target Delivery
    Staff->>UI: Adds Furniture & Electronics package items
    Staff->>UI: Uploads Custom Woodworking / Fabric Photos
    UI->>Canvas: Compress raw photos (5-12MB)
    Canvas-->>UI: Optimized JPEGs (150-250KB)
    UI->>Supabase: Upload to temp-images/bookings/{bookingNumber}/
    Supabase-->>UI: Public Image CDN URLs
    Staff->>UI: Confirms advance deposit (e.g. ₹30,000)
    UI->>API: POST /api/v1/bookings (Payload + Design URLs)
    
    rect rgb(240, 248, 255)
        note right of API: Atomic Prisma Transaction
        API->>DB: Upsert Customer record
        API->>DB: Create Booking (ADB-YYYY-XXXX)
        API->>DB: Create BookingItems (FURNITURE + ELECTRONICS)
        API->>DB: Auto-generate Immediate Furniture Invoice (#FURN-YYYY-XXXX)
        API->>DB: Create DeliverySchedule (Target Delivery)
        DB-->>API: Full Populated Booking & Furniture Bill
    end
    API-->>UI: Returns Complete Booking Object

    rect rgb(245, 255, 245)
        note over UI,Cust: Automated Dual-Document WhatsApp Delivery
        UI->>UI: Generate Booking Slip PDF (html2canvas-pro + jsPDF)
        UI->>API: POST /api/v1/bookings/{id}/whatsapp/resend
        API->>Bot: POST /send (Slip PDF + Clean Text)
        Bot->>Bot: Push to Sequential FIFO Queue
        Bot->>Cust: 📄 Transmit Booking Slip PDF
        
        UI->>UI: Generate Immediate Furniture Invoice PDF
        UI->>API: POST /api/v1/bills/{furnId}/whatsapp/send
        API->>Bot: POST /send (Furniture Invoice PDF)
        Bot->>Bot: Hold 2,000ms socket cooldown
        Bot->>Cust: 🧾 Transmit Furniture Tax Invoice PDF
    end
    UI-->>Staff: Display Confirmed Booking Modal with Lightbox
```

---

## 2. Flow 2: Walk-In Point of Sale (POS) Counter Billing

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Showroom Customer
    actor Staff as Billing Staff
    participant POS as POS Interface (/billing)
    participant Scanner as Camera / Barcode Scanner
    participant API as API (/api/v1/bills)
    participant DB as PostgreSQL
    participant Bot as WhatsApp Bot

    Customer->>Staff: Selects ready furniture piece or appliance
    Staff->>Scanner: Scans barcode or searches model name
    Scanner-->>POS: Auto-fills name, rate, department, warranty
    Staff->>POS: Enters Customer Mobile & Name
    POS->>POS: Live calculates Subtotal, Discount, SGST, CGST, Total
    Staff->>POS: Selects Payment Mode (Cash, UPI QR, Card, Due)
    Staff->>POS: Clicks "Finalize & Send Bill"
    POS->>API: POST /api/v1/bills
    
    rect rgb(240, 248, 255)
        note right of API: Atomic Stock Deduction
        API->>DB: Decrement Product.quantityInStock
        API->>DB: If Serialized: Set ProductUnit.status = 'SOLD'
        API->>DB: Create Bill (#FURN-... or #ELEC-...)
        API->>DB: Create BillItems
        DB-->>API: Saved Bill Record
    end
    API-->>POS: Bill Confirmation + Unique ID

    POS->>POS: Render Branded GST Tax Invoice PDF in-memory
    POS->>API: POST /api/v1/bills/{id}/whatsapp/send (Base64 PDF)
    API->>Bot: POST /send (Sanitized Buffer + Concise Message)
    Bot->>Customer: 🧾 Delivered Tax Invoice PDF to WhatsApp
    POS-->>Staff: Ready for next customer / Print thermal slip
```

---

## 3. Flow 3: Scheduled Delivery Fulfillment & Appliance Invoicing

For advance bookings where electronics remain in `Pending Delivery` status until the event/wedding day:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Delivery Dispatcher
    participant DelUI as Deliveries Page (/deliveries)
    participant API as Invoicing API (/api/v1/deliveries)
    participant DB as Neon PostgreSQL
    participant Bot as WhatsApp Bot
    actor Cust as Customer Phone

    DelUI->>DelUI: Review "Target Delivery: In 2 Days" Dashboard
    Staff->>DelUI: Selects Booking (ADB-YYYY-XXXX)
    Staff->>DelUI: Clicks "Generate Delivery Invoice (Appliance Package)"
    DelUI->>Staff: Prompts for Physical Appliance Serial / IMEI Numbers
    Staff->>DelUI: Scans / Types Serial Numbers
    DelUI->>API: POST /api/v1/bookings/{id}/invoice
    
    rect rgb(240, 248, 255)
        note right of API: Electronics Tax Invoice Generation
        API->>DB: Update BookingItem.isBilled = true
        API->>DB: Create Electronics Tax Invoice (#ELEC-YYYY-XXXX)
        API->>DB: Set DeliveryDate & WarrantyStarts = today()
        API->>DB: Mark ProductUnits as 'SOLD'
        API->>DB: Update DeliverySchedule.status = 'DELIVERED'
        DB-->>API: Created Delivery Invoice
    end
    API-->>DelUI: Delivery Invoice Details

    DelUI->>DelUI: Generate Electronics Tax Invoice & Warranty Slip PDF
    DelUI->>Bot: POST /send (Appliance Invoice + Warranty Certificate)
    Bot->>Cust: 📦 Dispatches Appliance Invoice & Warranty to Customer WhatsApp
    DelUI-->>Staff: Booking status updated to COMPLETED
```

---

## 4. Flow 4: Overdue Accounts Receivable & Due Payment Settlement

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    actor Staff as Counter Cashier
    participant History as Billing / Customer Ledger
    participant API as Payments API (/api/v1/bills/{id}/payment)
    participant DB as Neon PostgreSQL
    participant Bot as WhatsApp Bot

    Staff->>History: Searches Customer Phone or views "Due 15+ Days" Alert
    History-->>Staff: Displays Outstanding Balance (e.g. ₹50,000)
    Customer->>Staff: Pays balance via Cash / UPI QR
    Staff->>History: Enters Amount Received & Payment Mode
    History->>API: POST /api/v1/bills/{id}/settle-payment
    
    rect rgb(240, 248, 255)
        API->>DB: Update Bill (paidAmount += payment, dueAmount -= payment)
        API->>DB: If dueAmount == 0: set isSettled = true, paymentStatus = 'PAID'
        API->>DB: If linked Booking: update remainingBalance
        DB-->>API: Updated Financial Record
    end
    API-->>History: Payment Acknowledged

    History->>History: Render Payment Receipt Slip PDF
    History->>Bot: POST /send (Payment Receipt PDF)
    Bot->>Customer: 🟢 WhatsApp Receipt: "Payment Received with Thanks"
```

---

## 5. Flow 5: WhatsApp Microservice Message Queue Architecture

Handling rapid back-to-back document dispatches without socket media collisions:

```mermaid
flowchart TD
    Req1["Incoming Doc 1: Booking Slip PDF"] --> Router["Express Router (/send)"]
    Req2["Incoming Doc 2: Furniture Invoice PDF"] --> Router
    
    Router --> AuthCheck{"Valid x-api-key?"}
    AuthCheck -- No --> Reject["Return 401 Unauthorized"]
    AuthCheck -- Yes --> Sanitize["Sanitize Base64 (Strip data URL prefixes)"]
    
    Sanitize --> Queue["In-Memory Sequential FIFO Queue"]
    
    Queue --> Task1["Process Task 1"]
    Task1 --> JIDCheck["Normalize Phone to JID (91XXXXXXXXXX@s.whatsapp.net)"]
    JIDCheck --> BaileysSend1["Baileys sendMessage({ document, mimetype: 'application/pdf' })"]
    BaileysSend1 --> DBLog1["Audit Log to Neon PostgreSQL"]
    
    DBLog1 --> Cooldown["Enforce Active Socket Cooldown (2,000ms delay)"]
    
    Cooldown --> Task2["Process Task 2"]
    Task2 --> BaileysSend2["Baileys sendMessage({ document, mimetype: 'application/pdf' })"]
    BaileysSend2 --> DBLog2["Audit Log to Neon PostgreSQL"]
    DBLog2 --> Done["Queue Idle / Ready for Next Dispatch"]
```
