export type Department = "FURNITURE" | "ELECTRONICS";

export type PurchasePaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export type PurchasePaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

export interface Vendor {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  gstin?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // Summary counts / totals
  _count?: {
    purchases: number;
  };
  totalPurchased?: number;
  totalPaid?: number;
  totalDue?: number;
}

export interface PurchaseItem {
  id?: number;
  purchaseId?: number;
  productId?: number | null;
  itemName: string;
  quantity: number;
  unitCostPrice: number;
  lineTotal: number;
  serialNumbers?: string | null;
  warrantyMonths?: number | null;
  product?: {
    id: number;
    name: string;
    brand?: string | null;
    quantityInStock: number;
    costPrice: number | string;
    sellingPrice: number | string;
    warrantyMonths?: number | null;
  } | null;
}

export interface PurchasePayment {
  id: number;
  purchaseId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: PurchasePaymentMode;
  transactionRef?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  vendorInvoiceNo?: string | null;
  vendorId: number;
  department: Department;
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PurchasePaymentStatus;
  isStockAdded: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  vendor: {
    id: number;
    name: string;
    phone: string;
    address?: string | null;
    gstin?: string | null;
  };
  items: PurchaseItem[];
  payments?: PurchasePayment[];
}

export interface PurchaseItemInput {
  productId?: number | null;
  itemName: string;
  quantity: number | string;
  unitCostPrice: number | string;
  lineTotal: number;
  serialNumbers?: string;
  warrantyMonths?: number | string;
  // If user creates a new product directly from purchase
  createNewProduct?: boolean;
  categoryId?: number;
  brand?: string;
  sellingPrice?: number;
}

export interface CreatePurchaseInput {
  vendorId?: number;
  // If user enters a new vendor inline
  newVendor?: {
    name: string;
    phone: string;
    address?: string;
    gstin?: string;
  };
  vendorInvoiceNo?: string;
  department: Department;
  purchaseDate: string;
  notes?: string;
  items: PurchaseItemInput[];
  paidAmount: number;
  paymentMode?: PurchasePaymentMode;
  transactionRef?: string;
  isStockAdded: boolean;
}

export interface RecordInstallmentInput {
  purchaseId: number;
  amountPaid: number;
  paymentMode: PurchasePaymentMode;
  transactionRef?: string;
  notes?: string;
}

export interface PurchaseKPIs {
  totalPurchasesCount: number;
  totalPurchaseAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  unpaidPurchasesCount: number;
}

