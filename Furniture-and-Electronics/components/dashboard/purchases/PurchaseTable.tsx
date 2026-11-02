"use client";

import React from "react";
import { FaMoneyBillWave, FaEye, FaTrash, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { Purchase } from "@/types/purchase";
import { Skeleton } from "@/components/dashboard/Skeleton";

interface PurchaseTableProps {
  purchases: Purchase[];
  loading: boolean;
  onPayInstallment: (purchase: Purchase) => void;
  onViewDetails: (purchase: Purchase) => void;
  onDeletePurchase: (purchase: Purchase) => void;
  onReceiveStock?: (purchase: Purchase) => void;
  isOwner?: boolean;
}

export default function PurchaseTable({
  purchases,
  loading,
  onPayInstallment,
  onViewDetails,
  onDeletePurchase,
  onReceiveStock,
  isOwner,
}: PurchaseTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[10.5px] font-extrabold">
                <th className="py-3 px-4">Date & Purchase #</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-2.5 w-16 rounded" />
                  </td>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-2.5 w-20 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-5 w-14 rounded" />
                  </td>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-2.5 w-24 rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="h-4 w-14 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-6 w-16 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs p-12 text-center">
        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <FaMoneyBillWave className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-800">No purchases found</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          No supplier bills match your search or filter. Click "+ New Purchase" to record your first procurement.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[10.5px] font-extrabold">
              <th className="py-3 px-4">Date & Purchase #</th>
              <th className="py-3 px-4">Vendor / Supplier</th>
              <th className="py-3 px-4">Dept</th>
              <th className="py-3 px-4">Items Summary</th>
              <th className="py-3 px-4 text-right">Total (₹)</th>
              <th className="py-3 px-4 text-right">Paid (₹)</th>
              <th className="py-3 px-4 text-right">Due (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.map((p) => {
              const formattedDate = new Date(p.purchaseDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              const itemsCount = p.items.length;
              const itemsPreview = p.items
                .map((i) => `${i.itemName} (${i.quantity})`)
                .slice(0, 2)
                .join(", ") + (itemsCount > 2 ? ` +${itemsCount - 2} more` : "");
              const fullItemsList = p.items
                .map(
                  (i) =>
                    `${i.itemName} (Qty: ${i.quantity}${
                      i.warrantyMonths ? `, ${i.warrantyMonths}M Warranty` : ""
                    })`
                )
                .join("\n");

              const isDue = Number(p.dueAmount) > 0;

              return (
                <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                  {/* Date & Number */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-blue-700 block text-xs">
                      {p.purchaseNumber}
                    </span>
                    <span className="text-[11px] text-gray-500">{formattedDate}</span>
                    {p.vendorInvoiceNo && (
                      <span className="text-[10px] text-gray-400 block font-mono">
                        Inv: {p.vendorInvoiceNo}
                      </span>
                    )}
                  </td>

                  {/* Vendor Info */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{p.vendor.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{p.vendor.phone}</div>
                    {p.vendor.address && (
                      <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                        {p.vendor.address}
                      </div>
                    )}
                  </td>

                  {/* Dept Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${
                        p.department === "ELECTRONICS"
                          ? "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_2px_0_#052531,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]"
                          : "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_2px_0_#14352D,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]"
                      }`}
                    >
                      {p.department === "ELECTRONICS" ? "⚡ Elec" : "🪑 Furn"}
                    </span>
                  </td>

                  {/* Items Preview */}
                  <td className="py-3 px-4 max-w-[220px]">
                    <div
                      className="text-gray-800 font-medium truncate cursor-default"
                      title={fullItemsList || itemsPreview || "No items"}
                    >
                      {itemsPreview || "No items"}
                    </div>
                    <div className="text-[10.5px] text-gray-400">
                      {itemsCount} {itemsCount === 1 ? "line item" : "line items"}
                      {p.isStockAdded ? (
                        <span className="ml-1 text-[#15803D] font-bold">✓ In Stock</span>
                      ) : (
                        <span className="ml-1 text-[#854D0E] font-bold">⚠️ Stock Pending</span>
                      )}
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                    ₹ {Number(p.totalAmount).toLocaleString("en-IN")}
                  </td>

                  {/* Paid Amount */}
                  <td className="py-3 px-4 text-right font-bold text-[#15803D] whitespace-nowrap">
                    ₹ {Number(p.paidAmount).toLocaleString("en-IN")}
                  </td>

                  {/* Due Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {isDue ? (
                      <span className="font-black text-[#780000] block">
                        ₹ {Number(p.dueAmount).toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="font-bold text-gray-400">₹ 0</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {p.paymentStatus === "PAID" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                        PAID
                      </span>
                    )}
                    {p.paymentStatus === "PARTIAL" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <FaExclamationCircle className="w-3 h-3 text-amber-600" />
                        PARTIAL
                      </span>
                    )}
                    {p.paymentStatus === "UNPAID" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <FaExclamationCircle className="w-3 h-3 text-red-600" />
                        UNPAID
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* Context Action Slot (Fixed Width so standard icons never shift position) */}
                      <div className="flex items-center justify-end gap-1.5 min-w-[150px]">
                        {!p.isStockAdded && onReceiveStock && (
                          <button
                            onClick={() => onReceiveStock(p)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap"
                            title="Receive items and add to showroom inventory"
                          >
                            📦 Stock In
                          </button>
                        )}
                        {isDue && (
                          <button
                            onClick={() => onPayInstallment(p)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap"
                            title="Pay installment towards this purchase"
                          >
                            Pay Due
                          </button>
                        )}
                      </div>

                      {/* Fixed Standard Icons Slot (Eye & Delete) - Position is 100% constant across all rows */}
                      <div className="flex items-center justify-end gap-1 w-14 shrink-0">
                        <button
                          onClick={() => onViewDetails(p)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View bill breakdown & payment history"
                        >
                          <FaEye className="w-3.5 h-3.5" />
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => onDeletePurchase(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete purchase"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

