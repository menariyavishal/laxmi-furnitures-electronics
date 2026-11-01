"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaHistory } from "react-icons/fa";
import { BookingResponse } from "@/types/booking";
import { getBookingHistory } from "@/lib/api/booking";
import BookingHistoryFilters from "@/components/dashboard/bookings/history/BookingHistoryFilters";
import BookingHistoryTable from "@/components/dashboard/bookings/history/BookingHistoryTable";
import BookingSlipModal from "@/components/dashboard/bookings/BookingSlipModal";
import { useDebounce } from "@/hooks/useDebounce";

export default function BookingHistoryPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<BookingResponse | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [debouncedSearch, status, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getBookingHistory({
        search: debouncedSearch,
        status,
        page,
        limit: 20,
      });
      setBookings(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load booking history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FaHistory className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Booking Archive & History
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Historical record of settled wedding packages, dual tax invoices, and customer receipts.
          </p>
        </div>

        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 transition"
        >
          <span>🚚 Back to Active Deliveries</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <BookingHistoryFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
      />

      {/* History Table */}
      <BookingHistoryTable
        bookings={bookings}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onViewSlip={setSelectedSlipBooking}
      />

      {/* Printable Booking Slip Modal */}
      <BookingSlipModal
        booking={selectedSlipBooking}
        isOpen={Boolean(selectedSlipBooking)}
        onClose={() => setSelectedSlipBooking(null)}
      />
    </div>
  );
}
