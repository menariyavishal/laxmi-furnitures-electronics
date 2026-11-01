"use client";

import React from "react";
import { BookingResponse } from "@/types/booking";
import BookingHistoryRow from "./BookingHistoryRow";
import BookingHistoryEmptyState from "./BookingHistoryEmptyState";
import { FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";

interface BookingHistoryTableProps {
  bookings: BookingResponse[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onViewSlip: (booking: BookingResponse) => void;
}

export default function BookingHistoryTable({
  bookings,
  loading,
  page,
  totalPages,
  onPageChange,
  onViewSlip,
}: BookingHistoryTableProps) {
  if (loading && bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
        <FaSpinner className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-gray-500">Loading booking records...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return <BookingHistoryEmptyState />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Booking / Delivery
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Booking #
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Furniture Bill
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Electronics Bill
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Advance
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Due
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bookings.map((booking) => (
              <BookingHistoryRow
                key={booking.id}
                booking={booking}
                onViewSlip={onViewSlip}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div>
            Page <span className="font-bold text-gray-900">{page}</span> of{" "}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FaChevronLeft className="w-2.5 h-2.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next</span>
              <FaChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
