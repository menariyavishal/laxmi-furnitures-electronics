import React from "react";
import { FaSpinner } from "react-icons/fa";

export default function BookingHistoryLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="h-10 bg-gray-200 animate-pulse rounded-lg w-64" />
      <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
      <div className="h-96 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-gray-500">Loading booking archive...</p>
        </div>
      </div>
    </div>
  );
}
