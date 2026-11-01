"use client";

import React from "react";
import { FaHistory } from "react-icons/fa";

export default function BookingHistoryEmptyState() {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-xl border border-gray-200/80">
      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
        <FaHistory className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-gray-900">No Booking History Found</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
        Completed bookings will appear here once all package deliveries and invoices are settled.
      </p>
    </div>
  );
}
