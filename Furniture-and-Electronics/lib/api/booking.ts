import { CreateBookingPayload, BookingResponse } from "@/types/booking";

export async function createBooking(data: CreateBookingPayload): Promise<BookingResponse> {
  const res = await fetch("/api/v1/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const message = error.error || error.message || `Server error (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export async function getBookings(params?: {
  status?: string;
  search?: string;
  department?: string;
}): Promise<BookingResponse[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.department && params.department !== "ALL") {
    query.append("department", params.department);
  }

  const url = `/api/v1/bookings${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function getBooking(id: number | string): Promise<BookingResponse> {
  const res = await fetch(`/api/v1/bookings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch booking details");
  return res.json();
}

export async function generateDeliveryInvoice(
  bookingId: number,
  payload: {
    deliveryDate: string; // YYYY-MM-DD
    itemSerialNumbers?: Record<number, string>; // bookingItemId -> serial number
    paymentMode: string;
    amountPaidNow: number;
    itemIdsToBill?: number[];
    sgstPercent?: number;
    cgstPercent?: number;
    sgstAmount?: number;
    cgstAmount?: number;
    isGstInclusive?: boolean;
    totalAmount?: number;
  }
) {
  const res = await fetch(`/api/v1/bookings/${bookingId}/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to generate delivery invoice");
  }
  return res.json();
}

export async function getBookingHistory(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: BookingResponse[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const url = `/api/v1/bookings/history${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch booking history");
  return res.json();
}

export async function completeBooking(bookingId: number): Promise<{ success: boolean; booking: BookingResponse }> {
  const res = await fetch(`/api/v1/bookings/${bookingId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to mark booking as completed");
  }
  return res.json();
}
