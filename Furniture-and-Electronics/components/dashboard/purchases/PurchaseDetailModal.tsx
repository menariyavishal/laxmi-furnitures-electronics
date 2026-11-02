"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { FaTimes, FaFileInvoiceDollar, FaCheckCircle, FaExclamationCircle, FaCalendarAlt, FaExclamationTriangle, FaBoxes } from "react-icons/fa";
import { Purchase } from "@/types/purchase";

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  onPayInstallment?: (purchase: Purchase) => void;
  onReceiveStock?: (purchase: Purchase) => void;
}

export default function PurchaseDetailModal({
  isOpen,
  onClose,
  purchase,
  onPayInstallment,
  onReceiveStock,
}: PurchaseDetailModalProps) {
  if (!isOpen || !purchase) return null;

  const formattedDate = new Date(purchase.purchaseDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isDue = Number(purchase.dueAmount) > 0;

  return (
    <Modal
      isOpen={isOpen && Boolean(purchase)}
      onClose={onClose}
      className="bg-[#F4F3F0] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DEDAD3] overflow-hidden"
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FaFileInvoiceDollar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Purchase #{purchase.purchaseNumber}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    purchase.department === "ELECTRONICS"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {purchase.department}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                <span>Dated: {formattedDate}</span>
                {purchase.vendorInvoiceNo && (
                  <span className="font-mono ml-2">| Supplier Bill: {purchase.vendorInvoiceNo}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Unreceived Stock Notice */}
          {!purchase.isStockAdded && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                <FaExclamationTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Stock Pending:</strong> Items for this purchase have not been added to showroom inventory yet.
                </span>
              </div>
              {onReceiveStock && (
                <button
                  onClick={() => {
                    onClose();
                    onReceiveStock(purchase);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <FaBoxes className="w-3.5 h-3.5" />
                  Add to Inventory
                </button>
              )}
            </div>
          )}

          {/* Vendor Box */}
          <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Supplier / Party Details
              </span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{purchase.vendor.name}</p>
              <p className="text-gray-600 font-mono mt-0.5">Mobile: {purchase.vendor.phone}</p>
              {purchase.vendor.address && (
                <p className="text-gray-500 mt-0.5">{purchase.vendor.address}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Payment Status
              </span>
              <div className="mt-1">
                {purchase.paymentStatus === "PAID" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                    FULLY SETTLED
                  </span>
                )}
                {purchase.paymentStatus === "PARTIAL" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <FaExclamationCircle className="w-3 h-3 text-amber-600" />
                    PARTIAL DUE
                  </span>
                )}
                {purchase.paymentStatus === "UNPAID" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <FaExclamationCircle className="w-3 h-3 text-red-600" />
                    UNPAID
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Items Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Purchased Items ({purchase.items.length})
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 text-[10.5px] uppercase font-extrabold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Cost/Unit</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchase.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70">
                      <td className="py-2.5 px-3 text-gray-500 font-bold">{idx + 1}</td>
                      <td
                        className="py-2.5 px-3 font-bold text-gray-900 cursor-default"
                        title={item.itemName}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{item.itemName}</span>
                          {item.warrantyMonths ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-100 text-purple-700">
                              ⚡ {item.warrantyMonths}M Warranty
                            </span>
                          ) : null}
                        </div>
                        {item.serialNumbers && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            SN: {item.serialNumbers}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                        ₹ {Number(item.unitCostPrice).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-gray-900 font-mono text-xs">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-gray-900 font-mono">
                        ₹ {Number(item.lineTotal).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Amount</span>
              <span className="text-base font-black text-gray-900 font-mono mt-0.5 block">
                ₹ {Number(purchase.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Paid</span>
              <span className="text-base font-black text-[#15803D] font-mono mt-0.5 block">
                ₹ {Number(purchase.paidAmount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <span className="text-[10px] font-bold text-red-700 uppercase block">Remaining Due</span>
              <span className="text-base font-black text-red-700 font-mono mt-0.5 block">
                ₹ {Number(purchase.dueAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Installment History Log */}
          {purchase.payments && purchase.payments.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Installment Payment Ledger ({purchase.payments.length})
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3">Reference / Remarks</th>
                      <th className="py-2 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchase.payments.map((pmt, idx) => (
                      <tr key={pmt.id || idx} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-600 font-medium whitespace-nowrap">
                          {new Date(pmt.paymentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                            {pmt.paymentMode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {pmt.transactionRef ? (
                            <span className="font-mono text-gray-800 font-medium mr-1.5">
                              {pmt.transactionRef}
                            </span>
                          ) : null}
                          <span className="text-gray-500">{pmt.notes || "—"}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-black text-[#15803D] font-mono">
                          ₹ {Number(pmt.amountPaid).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {purchase.notes && (
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
              <span className="font-bold text-gray-700 block mb-0.5">Notes:</span>
              {purchase.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            {purchase.isStockAdded ? (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <FaCheckCircle className="w-3.5 h-3.5" />
                Inventory stock credited
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                <FaExclamationTriangle className="w-3.5 h-3.5" />
                Stock not added to inventory yet
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!purchase.isStockAdded && onReceiveStock && (
              <button
                onClick={() => {
                  onClose();
                  onReceiveStock(purchase);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
              >
                <FaBoxes className="w-3.5 h-3.5" />
                Receive Stock
              </button>
            )}
            {isDue && onPayInstallment && (
              <button
                onClick={() => {
                  onClose();
                  onPayInstallment(purchase);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Pay Installment Now
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
  );
}

