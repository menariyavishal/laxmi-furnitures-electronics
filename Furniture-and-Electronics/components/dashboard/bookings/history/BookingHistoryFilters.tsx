"use client";

import React from "react";
import { FaSearch } from "react-icons/fa";

interface BookingHistoryFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export default function BookingHistoryFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: BookingHistoryFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <FaSearch className="w-3.5 h-3.5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Booking #, Customer Name, Mobile..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
        />
      </div>

      {/* Direct Status Buttons (Beside Search) */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
        <button
          type="button"
          onClick={() => onStatusChange("COMPLETED")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all ${
            status === "COMPLETED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Completed (Fully Delivered)
        </button>

        <button
          type="button"
          onClick={() => onStatusChange("CANCELLED")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all ${
            status === "CANCELLED"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Cancelled
        </button>

        <button
          type="button"
          onClick={() => onStatusChange("ALL")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all ${
            status === "ALL"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          All Historical
        </button>
      </div>
    </div>
  );
}
