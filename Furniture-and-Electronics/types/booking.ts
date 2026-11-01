export type BookingStatus = "CONFIRMED" | "PARTIALLY_DELIVERED" | "COMPLETED" | "CANCELLED";

export interface BookingItemInput {
  productId: number;
  department: "FURNITURE" | "ELECTRONICS";
  quantity: number;
  mrp?: number;
  unitPrice: number;
  lineTotal: number;
  customisations?: string;
}

export interface CreateBookingPayload {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  eventDate?: string; // Wedding / Event date (YYYY-MM-DD)
  expectedDeliveryDate: string; // Target delivery date (YYYY-MM-DD)
  totalEstimatedAmount: number;
  advancePaid: number;
  discount?: number;
  notes?: string;
  designPhotos?: string[];
  items: BookingItemInput[];
}

export interface BookingItemResponse {
  id: number;
  bookingId: number;
  productId: number;
  department: string;
  quantity: number;
  mrp?: number | string | null;
  unitPrice: number | string;
  lineTotal: number | string;
  customisations?: string | null;
  isBilled: boolean;
  billId: number | null;
  product: {
    id: number;
    name: string;
    brand: string | null;
    warrantyMonths: number | null;
    productType: string;
    quantityInStock?: number;
  };
}

export interface BookingResponse {
  id: number;
  bookingNumber: string;
  customerId: number;
  eventDate: string | null;
  expectedDeliveryDate: string;
  totalEstimatedAmount: number | string;
  advancePaid: number | string;
  remainingBalance: number | string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  customer: {
    id: number;
    name: string | null;
    phone: string | null;
    address: string | null;
  };
  bookingItems: BookingItemResponse[];
  deliveries: Array<{
    id: number;
    scheduledDate: string;
    actualDelivery: string | null;
    status: string;
    driverNotes: string | null;
  }>;
  bills: Array<{
    id: number;
    billNumber: string;
    department: string;
    billType?: string;
    totalAmount: number | string;
    paidAmount: number | string;
    dueAmount?: number | string;
    paymentStatus?: string;
    createdAt: string;
  }>;
}
