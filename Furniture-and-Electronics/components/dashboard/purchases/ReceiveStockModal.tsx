"use client";

import React, { useState } from "react";
import { FaBoxes, FaExclamationTriangle, FaCheck, FaTimes } from "react-icons/fa";
import { Purchase } from "@/types/purchase";
import { receivePurchaseStock } from "@/lib/api/purchase";

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase: Purchase | null;
}

export default function ReceiveStockModal({
  isOpen,
  onClose,
  onSuccess,
  purchase,
}: ReceiveStockModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !purchase) return null;

  const totalQuantity = purchase.items.reduce((s, it) => s + (it.quantity || 0), 0);

  const handleConfirmReceive = async () => {
    try {
      setSubmitting(true);
      setError("");
      await receivePurchaseStock(purchase.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to receive stock:", err);
      setError(err.message || "Failed to add purchase stock to inventory.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <FaBoxes className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                Receive Stock into Inventory
              </h3>
              <p className="text-xs text-blue-700 font-medium font-mono">
                {purchase.purchaseNumber} &bull; {purchase.vendor.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Warning / Alert Notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Confirmation Required: </span>
              Are you sure you have received these items at your showroom?
              Confirming will <strong>immediately add {totalQuantity} units</strong> to your showroom
              inventory stock and update product cost prices.
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase">
              Items to be Credited ({purchase.items.length})
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold text-[10.5px]">
                <tr>
                  <th className="py-2 px-3.5">Item Name</th>
                  <th className="py-2 px-3 text-right">Cost/Unit</th>
                  <th className="py-2 px-3.5 text-right">Qty to Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchase.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3.5">
                      <div
                        className="font-bold text-gray-900 cursor-default"
                        title={item.itemName}
                      >
                        {item.itemName}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {item.product ? (
                          <div className="text-[10.5px] text-gray-500">
                            Current Stock: {item.product.quantityInStock} units
                          </div>
                        ) : (
                          <div className="text-[10.5px] text-blue-600">
                            New product will be registered
                          </div>
                        )}
                        {item.warrantyMonths && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-100 text-purple-700">
                            ⚡ {item.warrantyMonths}M Warranty
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-700">
                      ₹ {Number(item.unitCostPrice).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      +{item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmReceive}
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            {submitting ? (
              "Adding to Stock..."
            ) : (
              <>
                <FaCheck className="w-3.5 h-3.5" />
                Yes, Receive & Add Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

