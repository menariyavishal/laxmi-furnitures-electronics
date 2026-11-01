/**
 * WhatsApp Message Templates
 *
 * Professional, markdown-formatted message generators for Laxmi Electronics & Furnitures.
 */

import {
  BillTemplateData,
  BookingNewTemplateData,
  DeliveryInvoiceTemplateData,
  BookingSettledTemplateData,
  BookingSlipCopyTemplateData,
  DuePaymentTemplateData,
  VendorPaymentTemplateData,
} from "./types";

const STORE_SIGNATURE = `📞 Helpline & Support: +91 99282 03203\n_Laxmi Electronics & Furnitures, Kanore_`;

function formatCurrency(amount: number): string {
  return Number(amount || 0).toLocaleString("en-IN");
}

/**
 * 1. Walk-in Billing Message
 */
export function formatBillInvoiceMessage(data: BillTemplateData): string {
  const hasDue = data.dueAmount > 0;

  return [
    `🧾 *TAX INVOICE: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Thank you for shopping with us! Here is your official invoice *#${data.billNumber}*.`,
    ``,
    `📊 *Bill Summary:*`,
    `• Date: ${data.date}`,
    `• Total Amount: *₹${formatCurrency(data.totalAmount)}*`,
    `• Amount Paid: *₹${formatCurrency(data.paidAmount)}*`,
    `• Balance Due: *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    hasDue
      ? `⚠️ *Payment Notice:*\nAn outstanding balance of *₹${formatCurrency(data.dueAmount)}* is pending on this invoice. Please settle at your convenience.`
      : `✅ *Payment Status:* Paid in Full`,
    ``,
    `📄 Your invoice PDF is attached below for your records.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 2.0 Advance Booking Confirmation Message
 */
export function formatBookingNewMessage(data: BookingNewTemplateData): string {
  const lines: string[] = [
    `🎉 *BOOKING CONFIRMATION: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your advance booking has been successfully confirmed!`,
    ``,
    `🔖 *Booking Reference:* *${data.bookingNumber}*`,
    `📅 *Target Delivery Date:* *${data.expectedDeliveryDate}*`,
  ];

  if (data.eventDate) {
    lines.push(`🎊 *Event / Function Date:* ${data.eventDate}`);
  }

  lines.push(``, `📦 *Package Breakdown:*`);

  if (data.furnitureCount > 0) {
    lines.push(
      `• *Furniture Package:* ₹${formatCurrency(data.furnitureSubtotal)} (${data.furnitureCount} item${data.furnitureCount === 1 ? "" : "s"})`
    );
    if (data.furnitureBillNumber) {
      lines.push(`  ↳ _Immediate Furniture Invoice: #${data.furnitureBillNumber}_`);
    }
  }

  if (data.electronicsCount > 0) {
    lines.push(
      `• *Electronics Package:* ₹${formatCurrency(data.electronicsSubtotal)} (${data.electronicsCount} item${data.electronicsCount === 1 ? "" : "s"})`
    );
    lines.push(`  ↳ _Invoices & warranties will be generated on scheduled delivery._`);
  }

  lines.push(
    ``,
    `💰 *Financial Summary:*`,
    `• Total Estimated Package: *₹${formatCurrency(data.totalAmount)}*`,
    `• Advance Paid Today: *₹${formatCurrency(data.advancePaid)}*`,
    `• Remaining Balance Due: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📎 *Attached Documents:*`,
    `1. Official Booking Slip PDF (with your chosen design specifications embedded)`
  );

  if (data.furnitureBillNumber) {
    lines.push(`2. Furniture Tax Invoice PDF (#${data.furnitureBillNumber})`);
  }

  lines.push(``, STORE_SIGNATURE);

  return lines.join("\n");
}

/**
 * 2.1 Individual Electronics Delivery Invoice Message
 */
export function formatDeliveryInvoiceMessage(data: DeliveryInvoiceTemplateData): string {
  const lines: string[] = [
    `⚡ *DELIVERY INVOICE: LAXMI ELECTRONICS*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your electronics package for Booking *#${data.bookingNumber}* has been billed and prepared for dispatch!`,
    ``,
    `🧾 *Invoice Number:* *${data.billNumber}*`,
    `📅 *Dispatch Date:* ${data.deliveryDate}`,
    ``,
    `📺 *Items & Warranty Coverage:*`,
  ];

  for (const item of data.items) {
    lines.push(`• *${item.productName}* (Qty: ${item.quantity})`);
    if (item.serialNumber) {
      lines.push(`  - Serial / IMEI: \`${item.serialNumber}\``);
    }
    if (item.warrantyMonths) {
      lines.push(`  - Warranty Coverage: ${item.warrantyMonths} Months`);
    }
  }

  lines.push(
    ``,
    `💳 *Payment & Booking Ledger:*`,
    `• Invoice Total: *₹${formatCurrency(data.invoiceTotal)}*`,
    `• Paid with this Delivery: *₹${formatCurrency(data.amountPaidNow)}*`,
    `• Remaining Booking Balance: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Attached is your official electronics invoice with warranty & serial details.`,
    ``,
    STORE_SIGNATURE
  );

  return lines.join("\n");
}

/**
 * 2.2 Booking Settlement / Completion Message
 */
export function formatBookingSettledMessage(data: BookingSettledTemplateData): string {
  return [
    `🎊 *ORDER COMPLETED & SETTLED: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Heartiest congratulations! Your order *#${data.bookingNumber}* has been fully delivered and all accounts are settled.`,
    ``,
    `✨ *Settlement Summary:*`,
    `• Total Order Value: *₹${formatCurrency(data.totalAmount)}*`,
    `• Total Paid: *₹${formatCurrency(data.totalAmount)}*`,
    `• Outstanding Balance: *₹0 (Fully Paid)*`,
    `• Delivery Status: *All Items Delivered* ✅`,
    ``,
    `📑 Attached for your records:`,
    `• Final Consolidated Booking Slip`,
    `• Complete Tax Invoices (Furniture & Electronics)`,
    ``,
    `It was our absolute pleasure serving your family. We wish you wonderful memories with your new furniture & appliances!`,
    ``,
    `🌟 _Thank you for choosing Laxmi Electronics & Furnitures, Kanore._`,
    `📞 Helpline: +91 99282 03203`,
  ].join("\n");
}

/**
 * 2.3 Quick Action: Booking Slip Copy
 */
export function formatBookingSlipCopyMessage(data: BookingSlipCopyTemplateData): string {
  return [
    `📋 *BOOKING COPY: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Here is a copy of your Booking Slip for Booking *#${data.bookingNumber}*.`,
    ``,
    `• Scheduled Delivery: ${data.expectedDeliveryDate}`,
    `• Total Package Value: ₹${formatCurrency(data.totalAmount)}`,
    `• Advance Paid: ₹${formatCurrency(data.advancePaid)}`,
    `• Remaining Balance Due: ₹${formatCurrency(data.remainingBalance)}`,
    ``,
    `📎 Your official Booking Slip PDF (with attached design references) is attached below.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 3. Due Payment Installment / Full Settlement Message
 */
export function formatDuePaymentMessage(data: DuePaymentTemplateData): string {
  if (data.isFullyPaid) {
    return [
      `🎉 *FULL PAYMENT RECEIVED - ZERO DUES: LAXMI ELECTRONICS & FURNITURES*`,
      ``,
      `Namaste *${data.customerName}* ji 🙏,`,
      `Thank you! Your payment of *₹${formatCurrency(data.installmentAmount)}* for Invoice *#${data.billNumber}* has fully settled your account.`,
      ``,
      `✅ *Account Status:*`,
      `• Total Bill Amount: ₹${formatCurrency(data.totalAmount)}`,
      `• Total Paid: ₹${formatCurrency(data.totalAmount)}`,
      `• *Outstanding Balance: ₹0 (NIL DUES)*`,
      ``,
      `Your account for this invoice is now completely cleared. Thank you for your prompt payment!`,
      ``,
      `📄 Attached is your final zero-dues receipt.`,
      ``,
      STORE_SIGNATURE,
    ].join("\n");
  }

  return [
    `💳 *PAYMENT RECEIPT: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `We have received an installment payment against Invoice *#${data.billNumber}*.`,
    ``,
    `💰 *Transaction Details:*`,
    `• Installment Received: *₹${formatCurrency(data.installmentAmount)}*`,
    `• Payment Mode: ${data.paymentMode}`,
    `• Date: ${data.paymentDate}`,
    ``,
    `📊 *Updated Account Status:*`,
    `• Total Bill Amount: ₹${formatCurrency(data.totalAmount)}`,
    `• Total Paid Till Date: *₹${formatCurrency(data.paidAmount)}*`,
    `• *Remaining Balance Due:* *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    `📄 Your updated payment receipt is attached.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 4. Wholesale Purchase / Vendor Payment Advice Message
 */
export function formatVendorPaymentMessage(data: VendorPaymentTemplateData): string {
  const companySuffix = data.vendorCompany ? ` (${data.vendorCompany})` : "";

  if (data.isFullySettled) {
    return [
      `🤝 *FULL SETTLEMENT ADVICE: LAXMI ELECTRONICS & FURNITURES*`,
      ``,
      `Dear *${data.vendorName}*${companySuffix},`,
      `We have disbursed the final settlement payment of *₹${formatCurrency(data.amountPaid)}* for Purchase Reference *#${data.purchaseNumber}*.`,
      ``,
      `✅ *Settlement Details:*`,
      `• Purchase Total: ₹${formatCurrency(data.totalAmount)}`,
      `• Total Disbursed: ₹${formatCurrency(data.totalAmount)}`,
      `• *Outstanding Balance: ₹0 (Fully Settled)*`,
      `• Payment Mode: ${data.paymentMode}${data.transactionRef ? ` | Ref: ${data.transactionRef}` : ""}`,
      ``,
      `This purchase order is now fully settled with nil balance. Thank you for your partnership!`,
      ``,
      `Warm regards,`,
      `*Laxmi Electronics & Furnitures*`,
      `Kanore, Rajasthan | +91 99282 03203`,
    ].join("\n");
  }

  return [
    `💼 *PAYMENT ADVICE: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Dear *${data.vendorName}*${companySuffix},`,
    `A payment has been disbursed towards Purchase Reference *#${data.purchaseNumber}*.`,
    ``,
    `💵 *Disbursement Summary:*`,
    `• Amount Credited: *₹${formatCurrency(data.amountPaid)}*`,
    `• Payment Mode: ${data.paymentMode}${data.transactionRef ? ` | Ref: ${data.transactionRef}` : ""}`,
    `• Date: ${data.paymentDate}`,
    ``,
    `📊 *Vendor Ledger Status:*`,
    `• Purchase Total: ₹${formatCurrency(data.totalAmount)}`,
    `• Total Paid Till Date: *₹${formatCurrency(data.paidAmount)}*`,
    `• *Remaining Payable Balance:* *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    `Please acknowledge receipt in your ledger records.`,
    ``,
    `Warm regards,`,
    `*Laxmi Electronics & Furnitures*`,
    `Kanore, Rajasthan | +91 99282 03203`,
  ].join("\n");
}

