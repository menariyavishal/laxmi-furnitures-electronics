"use client";

import React from "react";
import { FaSearch, FaTimes, FaUsers, FaPlus } from "react-icons/fa";
import { Vendor } from "@/types/purchase";

interface PurchaseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string; // "ALL" | "PENDING_DUE" | "PAID"
  onStatusFilterChange: (status: string) => void;
  selectedVendorId: string;
  onVendorChange: (vendorId: string) => void;
  vendors: Vendor[];
  onOpenNewPurchase: () => void;
  onOpenVendorManager: () => void;
}

export default function PurchaseFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedVendorId,
  onVendorChange,
  vendors,
  onOpenNewPurchase,
  onOpenVendorManager,
}: PurchaseFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
      {/* Top Row: Search Input + Action Buttons */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by vendor, phone, item name, purchase #..."
            className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              title="Clear search"
            >
              <FaTimes className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vendor Selector Dropdown */}
        <div className="w-full md:w-64">
          <select
            value={selectedVendorId}
            onChange={(e) => onVendorChange(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="ALL">🏢 All Vendors / Suppliers</option>
            {vendors.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.name} ({v.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVendorManager}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold rounded-lg border border-gray-300 transition"
            title="Manage supplier list"
          >
            <FaUsers className="w-3.5 h-3.5 text-gray-600" />
            <span>Vendors ({vendors.length})</span>
          </button>
          <button
            onClick={onOpenNewPurchase}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <FaPlus className="w-3 h-3" />
            <span>+ New Purchase</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Distinct Colored Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
          Filter by Status:
        </span>

        {/* 1. All Purchases: Blue Indicator */}
        <button
          onClick={() => onStatusFilterChange("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            statusFilter === "ALL"
              ? "bg-[#F1F5F9] text-[#334155] border border-[#94A3B8] border-b-[#64748B] shadow-[0_2px_4px_rgba(71,85,105,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] brightness-95"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-blue-400"></span>
          All Purchases
        </button>

        {/* 2. Pending Dues: Amber/Orange Indicator */}
        <button
          onClick={() => onStatusFilterChange("PENDING_DUE")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            statusFilter === "PENDING_DUE"
              ? "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-amber-400 animate-pulse"></span>
          Pending Dues (Unpaid / Partial)
        </button>

        {/* 3. Fully Paid: Emerald/Green Indicator */}
        <button
          onClick={() => onStatusFilterChange("PAID")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            statusFilter === "PAID"
              ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-emerald-400"></span>
          Fully Paid
        </button>
      </div>
    </div>
  );
}

