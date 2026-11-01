/**
 * WhatsApp Message Templates
 *
 * Professional, concise, markdown-formatted message generators for Laxmi Electronics & Furnitures.
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

const STORE_SIGNATURE = `📞 Helpline & Support: +91 63755 91682\n_Laxmi Electronics & Furnitures, Main Market, Kanore_`;

function formatCurrency(amount: number): string {
  return Number(amount || 0).toLocaleString("en-IN");
}

/**
 * 1. Walk-in / Immediate Tax Invoice Message (Used for Regular & Furniture Invoices)
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
    `• Invoice No: *#${data.billNumber}*`,
    `• Date: ${data.date}`,
    `• Total Amount: *₹${formatCurrency(data.totalAmount)}*`,
    `• Amount Paid: *₹${formatCurrency(data.paidAmount)}*`,
    `• Balance Due: *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    hasDue
      ? `⚠️ *Payment Status:* Pending balance of *₹${formatCurrency(data.dueAmount)}*`
      : `✅ *Payment Status:* Paid in Full`,
    ``,
    `📄 Your invoice PDF is attached below for your records.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 2.0 Advance Booking Confirmation Message (Concise, no verbose breakdown)
 */
export function formatBookingNewMessage(data: BookingNewTemplateData): string {
  const lines: string[] = [
    `🎉 *BOOKING CONFIRMATION: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your advance package booking has been confirmed!`,
    ``,
    `🔖 *Booking Reference:* *${data.bookingNumber}*`,
    `📅 *Target Delivery Date:* *${data.expectedDeliveryDate}*`,
  ];

  if (data.eventDate) {
    lines.push(`🎊 *Event Date:* ${data.eventDate}`);
  }

  lines.push(
    ``,
    `💰 *Payment Details:*`,
    `• Total Package: *₹${formatCurrency(data.totalAmount)}*`,
    `• Advance Paid: *₹${formatCurrency(data.advancePaid)}*`,
    `• Balance Due on Delivery: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Your official Booking Slip PDF is attached below.`,
    ``,
    STORE_SIGNATURE
  );

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
    `Your electronics delivery for Booking *#${data.bookingNumber}* has been billed and prepared!`,
    ``,
    `🧾 *Invoice Number:* *${data.billNumber}*`,
    `📅 *Dispatch Date:* ${data.deliveryDate}`,
    ``,
    `📺 *Items Delivered:*`,
  ];

  for (const item of data.items) {
    lines.push(`• *${item.productName}* (Qty: ${item.quantity})`);
    if (item.serialNumber) {
      lines.push(`  - Serial: \`${item.serialNumber}\``);
    }
  }

  lines.push(
    ``,
    `💳 *Payment Ledger:*`,
    `• Invoice Total: *₹${formatCurrency(data.invoiceTotal)}*`,
    `• Paid with Delivery: *₹${formatCurrency(data.amountPaidNow)}*`,
    `• Remaining Booking Balance: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Attached is your delivery tax invoice with warranty coverage.`,
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
    `🎊 *ORDER COMPLETED: LAXMI ELECTRONICS & FURNITURES*`,
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
    `Thank you for choosing Laxmi Electronics & Furnitures!`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 2.3 Quick Action: Booking Slip Copy
 */
export function formatBookingSlipCopyMessage(data: BookingSlipCopyTemplateData): string {
  return [
    `📋 *BOOKING SLIP: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Here is your Booking Slip for Booking *#${data.bookingNumber}*.`,
    ``,
    `• Target Delivery: *${data.expectedDeliveryDate}*`,
    `• Total Package: *₹${formatCurrency(data.totalAmount)}*`,
    `• Advance Paid: *₹${formatCurrency(data.advancePaid)}*`,
    `• Balance Due on Delivery: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Your official Booking Slip PDF is attached below.`,
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
      `• Total Bill Amount: *₹${formatCurrency(data.totalAmount)}*`,
      `• Total Paid: *₹${formatCurrency(data.totalAmount)}*`,
      `• Outstanding Balance: *₹0 (NIL DUES)*`,
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
    `• Total Bill Amount: *₹${formatCurrency(data.totalAmount)}*`,
    `• Total Paid: *₹${formatCurrency(data.paidAmount)}*`,
    `• Balance Due: *₹${formatCurrency(data.dueAmount)}*`,
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
      `We have disbursed the final settlement payment of *₹${formatCurrency(data.amountPaid)}* for Purchase *#${data.purchaseNumber}*.`,
      ``,
      `✅ *Settlement Details:*`,
      `• Purchase Total: *₹${formatCurrency(data.totalAmount)}*`,
      `• Total Disbursed: *₹${formatCurrency(data.totalAmount)}*`,
      `• Outstanding Balance: *₹0 (Fully Settled)*`,
      `• Payment Mode: ${data.paymentMode}${data.transactionRef ? ` | Ref: ${data.transactionRef}` : ""}`,
      ``,
      STORE_SIGNATURE,
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
    `• Purchase Total: *₹${formatCurrency(data.totalAmount)}*`,
    `• Total Paid: *₹${formatCurrency(data.paidAmount)}*`,
    `• Remaining Balance: *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}
