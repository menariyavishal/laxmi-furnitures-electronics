"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import { BookingResponse } from "@/types/booking";
import BookingsHeader from "@/components/dashboard/bookings/BookingsHeader";
import BookingsStatsSummary from "@/components/dashboard/bookings/BookingsStatsSummary";
import BookingsFilterBar from "@/components/dashboard/bookings/BookingsFilterBar";
import BookingCard from "@/components/dashboard/bookings/BookingCard";
import BookingListEmptyState from "@/components/dashboard/bookings/BookingListEmptyState";
import DeliveryInvoiceModal from "@/components/dashboard/bookings/DeliveryInvoiceModal";
import BookingSlipModal from "@/components/dashboard/bookings/BookingSlipModal";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch bookings");
  }
  return res.json();
};

export default function BookingsPage() {
  const { department } = useDepartment();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeBookingForDelivery, setActiveBookingForDelivery] = useState<BookingResponse | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<BookingResponse | null>(null);

  // Construct SWR URL based on active filters
  const params = new URLSearchParams();
  if (statusFilter !== "ALL") params.append("status", statusFilter);
  if (searchQuery.trim()) params.append("search", searchQuery.trim());
  if (department !== "ALL") params.append("department", department);

  const swrUrl = `/api/v1/bookings${params.toString() ? `?${params.toString()}` : ""}`;
  const { data: bookings, error, isLoading, mutate } = useSWR<BookingResponse[]>(
    swrUrl,
    fetcher,
    { refreshInterval: 15000 }
  );

  const bookingList = Array.isArray(bookings) ? bookings : [];

  const handleOpenDeliveryModal = (booking: BookingResponse) => {
    setActiveBookingForDelivery(booking);
    setIsDeliveryModalOpen(true);
  };

  const handleCloseDeliveryModal = () => {
    setIsDeliveryModalOpen(false);
    setActiveBookingForDelivery(null);
  };

  const [completingBookingId, setCompletingBookingId] = useState<number | null>(null);

  const handleDeliverySuccess = () => {
    mutate();
  };

  const handleCompleteBooking = async (bookingId: number) => {
    const target = bookingList.find((b) => b.id === bookingId);
    const confirm = window.confirm(
      `Confirm delivery completed for Booking #${target?.bookingNumber || bookingId}? This will mark the order fulfilled and move it to Booking History.`
    );
    if (!confirm) return;

    setCompletingBookingId(bookingId);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to mark booking completed");
      }
      mutate();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to complete booking");
    } finally {
      setCompletingBookingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <BookingsHeader />

      {/* 2. Top Metric Cards */}
      <BookingsStatsSummary bookings={bookingList} />

      {/* 3. Search and Filter Bar */}
      <BookingsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        department={department}
      />

      {/* 4. Bookings Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-64 bg-gray-100 rounded-xl animate-pulse border border-gray-200"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">{error.message || "Failed to load advance bookings."}</p>
          <button
            onClick={() => mutate()}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : bookingList.length === 0 ? (
        <BookingListEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookingList.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onOpenDeliveryModal={handleOpenDeliveryModal}
              onViewSlip={setSelectedSlipBooking}
              onCompleteBooking={handleCompleteBooking}
              completingBookingId={completingBookingId}
            />
          ))}
        </div>
      )}

      {/* 5. Delivery Invoice Modal */}
      <DeliveryInvoiceModal
        booking={activeBookingForDelivery}
        isOpen={isDeliveryModalOpen}
        onClose={handleCloseDeliveryModal}
        onSuccess={handleDeliverySuccess}
      />

      {/* 6. Wedding Package Booking Slip Modal */}
      <BookingSlipModal
        booking={selectedSlipBooking}
        isOpen={Boolean(selectedSlipBooking)}
        onClose={() => setSelectedSlipBooking(null)}
      />
    </div>
  );
}
