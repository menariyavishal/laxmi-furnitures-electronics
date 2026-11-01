# Hardware Integration: Global Barcode Scanner Listener

## Objective
To provide a seamless, zero-click stock management workflow for physical store environments. When a user connects a physical USB/Bluetooth barcode scanner gun, they should be able to scan a product's UPC barcode from **anywhere** on the Inventory page without having to manually click the "Scan to Add Stock" button or focus on a specific search input field. The system should automatically intercept the scan, query the database, and instantly redirect the user to that product's specific stock management page.

## The Problem
By default, operating systems treat external barcode scanners exactly like standard keyboards. When a scanner reads a barcode, it rapidly "types" the numbers (e.g., `194252000001`) and simulates an `Enter` keystroke. Because the browser cannot natively distinguish between a human typing on a keyboard and a scanner gun firing, scanning a product when an input field is not explicitly focused results in ignored or lost input.

## How to Implement It
To achieve a zero-click flow, we must implement a **Speed-Typing Detection Algorithm** that runs globally on the page.

### 1. The Global Keydown Listener
We will attach a global `keydown` event listener to the `window` or `document` object specifically on the Inventory page using a React `useEffect` hook.

### 2. The Speed Algorithm
Humans type at approximately 100 to 300 milliseconds per character. Barcode scanners "type" at approximately 5 to 15 milliseconds per character. We can use this mathematical difference to differentiate the source of the input.

**Implementation Logic:**
1. **Initialize State:** Create variables to store a `barcodeBuffer` (string) and a `lastKeystrokeTime` (timestamp).
2. **Capture Keystrokes:** On every `keydown` event:
   - Check the time elapsed since the `lastKeystrokeTime`.
   - If the time elapsed is very small (e.g., `< 30ms`), we assume it is part of a scanner burst and append the character to the `barcodeBuffer`.
   - If the time elapsed is large (e.g., `> 50ms`), we assume a human is typing, so we clear the `barcodeBuffer` and start over.
3. **Detect the Terminator:** Scanners append an `Enter` (`\r` or `\n`) key at the end of every scan. When the `Enter` key is detected:
   - Check if the `barcodeBuffer` has a valid length (e.g., between 8 and 14 characters, standard for UPC/EAN).
   - If valid, the scan is complete. We immediately call `e.preventDefault()` to stop the browser from triggering any native form submissions.
4. **Trigger Business Logic:** Pass the finalized `barcodeBuffer` string to the existing `handleStockScanSuccess(code)` function.
   - The function will call `/api/v1/products/scan?code=SCANNED_CODE`.
   - The backend looks up the product.
   - The frontend routes the user directly to `/inventory/[id]/stock`.

### 3. Edge Cases to Handle
- **Focused Inputs:** If the user is currently typing inside an active `<input>` or `<textarea>` (e.g., they are searching for a product manually or typing in an IMEI), the global listener should temporarily disable itself to prevent interfering with normal typing. We can check `document.activeElement.tagName` to handle this.
- **Modifier Keys:** The listener should ignore modifier keys (`Shift`, `Control`, `Alt`) to prevent polluting the barcode buffer.

### Example Code Snippet
```javascript
useEffect(() => {
  let barcodeBuffer = '';
  let lastKeyTime = Date.now();

  const handleGlobalScan = (e) => {
    // Ignore if user is currently typing in an input field
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - lastKeyTime;
    
    // If it's been more than 30ms, reset the buffer (human typing detected)
    if (elapsedTime > 30) {
      barcodeBuffer = '';
    }

    // Handle the Enter key (Terminator)
    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 8) {
        e.preventDefault();
        // Trigger the exact same logic the webcam scanner uses!
        handleStockScanSuccess(barcodeBuffer);
      }
      barcodeBuffer = '';
      return;
    }

    // Append standard alphanumeric characters
    if (e.key.length === 1) {
      barcodeBuffer += e.key;
    }

    lastKeyTime = currentTime;
  };

  window.addEventListener('keydown', handleGlobalScan);
  return () => window.removeEventListener('keydown', handleGlobalScan);
}, []);
```
