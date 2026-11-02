# Future Enhancements & Engineering Roadmap
## Laxmi Electronics & Furnitures — Next-Generation Architectural Roadmap

**Version:** 2.0 (Planning Document)  
**Location:** Main Market, Kanore, Udaipur (Raj.) — Helpline: +91 63755 91682  

---

## 1. Global Hardware Barcode Scanner Listener (Zero-Click POS)

### Objective
Provide a zero-click stock management and billing workflow on showroom desktops. When a staff member scans a product's barcode with a handheld USB or Bluetooth laser scanner, the system automatically detects the scan from anywhere on the page, identifies the product, and adds it to the active cart or redirects to the product management screen without requiring manual focus on an input box.

### Speed-Typing Detection Algorithm
Physical barcode scanners simulate a keyboard, firing characters at rapid intervals (5–15ms per character) followed by an `Enter` key. Human typing occurs at 100–300ms intervals.

```typescript
// Proposed Implementation Hook
useEffect(() => {
  let barcodeBuffer = '';
  let lastKeyTime = Date.now();

  const handleGlobalScan = (e: KeyboardEvent) => {
    // Suppress if user is manually typing in an active form input
    const activeTag = document.activeElement?.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - lastKeyTime;
    
    // Reset buffer if delay indicates human typing (> 35ms)
    if (elapsedTime > 35) {
      barcodeBuffer = '';
    }

    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 8) {
        e.preventDefault();
        handleBarcodeDetected(barcodeBuffer);
      }
      barcodeBuffer = '';
      return;
    }

    if (e.key.length === 1) {
      barcodeBuffer += e.key;
    }

    lastKeyTime = currentTime;
  };

  window.addEventListener('keydown', handleGlobalScan);
  return () => window.removeEventListener('keydown', handleGlobalScan);
}, []);
```

---

## 2. Delivery Driver Companion Progressive Web App (PWA)

### Objective
Equip delivery vehicle drivers with an offline-capable mobile companion app for wedding package deliveries in rural Udaipur villages:
* **Digital Signature on Glass:** Customer signs directly on the driver's smartphone upon delivery of wedding furniture and appliances.
* **Geotagged Photo Verification:** Driver snaps a photo of the installed furniture or unboxed appliance as proof of delivery, syncing directly to the booking record.
* **Cash Collection Reconciliation:** Driver logs cash collected at the customer's door, automatically generating and dispatching a WhatsApp receipt.

---

## 3. Customer Loyalty & Wedding Referral Rewards

### Objective
Incentivize local families to refer upcoming weddings to Laxmi Electronics & Furnitures:
* **Customer Reward Points:** Customers accumulate store credit on large wedding purchases redeemable for smaller kitchen appliances or home decor.
* **Referral Tracking:** Link newly booked wedding packages to the referring family, automatically sending referral vouchers via WhatsApp upon package completion.

---

## 4. Multi-Warehouse & Godown Stock Transfer

### Objective
As the showroom expands storage across multiple godowns in Kanore:
* **Location-Based Inventory:** Track stock by physical location (Main Showroom Display vs. Central Godown).
* **Inter-Godown Transfers:** Digital gate pass and transfer vouchers generated when shifting heavy solid wood furniture suites between the warehouse and the showroom.

---

## 5. Interactive WhatsApp Conversational Bot Menu

### Objective
Leverage the existing `@whiskeysockets/baileys` microservice connection to handle customer inquiries automatically:
* **Booking Status Inquiry:** Customers reply with `STATUS ADB-2026-0011` to instantly receive real-time package delivery dates and remaining balances.
* **Catalog Browsing:** Customers message `CATALOG` to receive high-definition brochures of the latest sofa designs, dining sets, and seasonal refrigerator discounts.
