/**
 * WhatsApp Messaging Service - Type Definitions
 */

export interface WhatsAppSettings {
  id: number;
  ownerPhone: string;
  status: "connected" | "disconnected" | "connecting";
  qrCode?: string | null;
  simulateFailures: boolean;
  simulateSessionError: boolean;
}

export interface WhatsAppSendOptions {
  phone: string;
  text: string;
  pdfBase64?: string;
  pdfFilename?: string;
  pdfUrl?: string;
}

export interface BillTemplateData {
  customerName: string;
  billNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface BookingNewTemplateData {
  customerName: string;
  bookingNumber: string;
  expectedDeliveryDate: string;
  eventDate?: string | null;
  furnitureCount: number;
  furnitureSubtotal: number;
  furnitureBillNumber?: string | null;
  electronicsCount: number;
  electronicsSubtotal: number;
  totalAmount: number;
  advancePaid: number;
  remainingBalance: number;
  hasDesigns?: boolean;
}

export interface DeliveryItemInfo {
  productName: string;
  quantity: number;
  serialNumber?: string | null;
  warrantyMonths?: number | null;
}

export interface DeliveryInvoiceTemplateData {
  customerName: string;
  bookingNumber: string;
  billNumber: string;
  deliveryDate: string;
  items: DeliveryItemInfo[];
  invoiceTotal: number;
  amountPaidNow: number;
  remainingBalance: number;
}

export interface BookingSettledTemplateData {
  customerName: string;
  bookingNumber: string;
  totalAmount: number;
}

export interface BookingSlipCopyTemplateData {
  customerName: string;
  bookingNumber: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  advancePaid: number;
  remainingBalance: number;
}

export interface DuePaymentTemplateData {
  customerName: string;
  billNumber: string;
  installmentAmount: number;
  paymentMode: string;
  paymentDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  isFullyPaid: boolean;
}

export interface VendorPaymentTemplateData {
  vendorName: string;
  vendorCompany?: string | null;
  purchaseNumber: string;
  amountPaid: number;
  paymentMode: string;
  transactionRef?: string | null;
  paymentDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  isFullySettled: boolean;
}

