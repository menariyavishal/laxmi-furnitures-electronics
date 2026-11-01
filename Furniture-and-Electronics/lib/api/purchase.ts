import {
  Purchase,
  Vendor,
  CreatePurchaseInput,
  RecordInstallmentInput,
  PurchaseKPIs,
} from "@/types/purchase";

export interface GetPurchasesParams {
  search?: string;
  department?: string;
  vendorId?: string | number;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export interface GetPurchasesResponse {
  items: Purchase[];
  total: number;
  page: number;
  totalPages: number;
  kpis: PurchaseKPIs;
}

export async function getPurchases(params: GetPurchasesParams = {}): Promise<GetPurchasesResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.department) query.set("department", params.department);
  if (params.vendorId) query.set("vendorId", String(params.vendorId));
  if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`/api/v1/purchases?${query.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch purchases");
  }
  return res.json();
}

export async function getPurchaseById(id: number): Promise<Purchase> {
  const res = await fetch(`/api/v1/purchases/${id}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch purchase details");
  }
  return res.json();
}

export async function createPurchase(data: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch("/api/v1/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create purchase");
  }
  return res.json();
}

export async function deletePurchase(id: number): Promise<void> {
  const res = await fetch(`/api/v1/purchases/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete purchase");
  }
}

export async function recordPurchaseInstallment(
  id: number,
  data: Omit<RecordInstallmentInput, "purchaseId">
): Promise<any> {
  const res = await fetch(`/api/v1/purchases/${id}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to record installment");
  }
  return res.json();
}

export async function receivePurchaseStock(id: number): Promise<{ message: string; purchase: Purchase }> {
  const res = await fetch(`/api/v1/purchases/${id}/receive-stock`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to add purchase stock to inventory");
  }
  return res.json();
}

export async function getVendors(search?: string): Promise<Vendor[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);

  const res = await fetch(`/api/v1/vendors?${query.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch vendors");
  }
  return res.json();
}

export async function getVendorById(id: number): Promise<Vendor> {
  const res = await fetch(`/api/v1/vendors/${id}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch vendor");
  }
  return res.json();
}

export async function createVendor(data: {
  name: string;
  phone: string;
  address?: string;
  gstin?: string;
}): Promise<Vendor> {
  const res = await fetch("/api/v1/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create vendor");
  }
  return res.json();
}

export async function updateVendor(
  id: number,
  data: { name?: string; phone?: string; address?: string; gstin?: string }
): Promise<Vendor> {
  const res = await fetch(`/api/v1/vendors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update vendor");
  }
  return res.json();
}

export async function deleteVendor(id: number): Promise<void> {
  const res = await fetch(`/api/v1/vendors/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete vendor");
  }
}

