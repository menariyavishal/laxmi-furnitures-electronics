"use client";

import React from "react";
import { FaMoneyBillWave, FaEye, FaTrash, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { Purchase } from "@/types/purchase";

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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs p-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm font-medium">Loading purchases...</p>
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
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
                        p.department === "ELECTRONICS"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.department === "ELECTRONICS" ? "⚡ Elec" : "🛋️ Furn"}
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
                        <span className="ml-1 text-emerald-600 font-bold">✓ In Stock</span>
                      ) : (
                        <span className="ml-1 text-amber-600 font-bold">⚠️ Stock Pending</span>
                      )}
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                    ₹ {Number(p.totalAmount).toLocaleString("en-IN")}
                  </td>

                  {/* Paid Amount */}
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    ₹ {Number(p.paidAmount).toLocaleString("en-IN")}
                  </td>

                  {/* Due Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {isDue ? (
                      <span className="font-black text-red-600 block">
                        ₹ {Number(p.dueAmount).toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="font-bold text-gray-400">₹ 0</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {p.paymentStatus === "PAID" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                        <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                        PAID
                      </span>
                    )}
                    {p.paymentStatus === "PARTIAL" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800">
                        <FaExclamationCircle className="w-3 h-3 text-amber-600" />
                        PARTIAL
                      </span>
                    )}
                    {p.paymentStatus === "UNPAID" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-red-100 text-red-800">
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

