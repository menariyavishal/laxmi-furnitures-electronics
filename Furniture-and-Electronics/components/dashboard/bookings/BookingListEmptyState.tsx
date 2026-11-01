"use client";

import React from "react";
import Link from "next/link";
import { FaCalendarPlus, FaBoxes } from "react-icons/fa";

interface BookingListEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export default function BookingListEmptyState({
  hasFilters,
  onClearFilters,
}: BookingListEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl mb-4">
        {hasFilters ? <FaBoxes /> : <FaCalendarPlus />}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        {hasFilters ? "No matching bookings found" : "No advance bookings yet"}
      </h3>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        {hasFilters
          ? "We couldn't find any bookings matching your current filter criteria. Try adjusting or resetting your search."
          : "Create an advance wedding booking to bundle furniture items and schedule electronics delivery with warranty activation."}
      </p>

      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      ) : (
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          <FaCalendarPlus className="w-4 h-4" />
          <span>Create First Booking</span>
        </Link>
      )}
    </div>
  );
}
