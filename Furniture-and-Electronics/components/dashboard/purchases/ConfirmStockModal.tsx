"use client";

import React from "react";
import { FaBoxes, FaExclamationTriangle, FaCheck, FaTimes, FaArrowRight } from "react-icons/fa";
import { PurchaseItemInput, Department } from "@/types/purchase";

interface ConfirmStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  items: PurchaseItemInput[];
  catalogProducts: any[];
  department: Department;
}

export default function ConfirmStockModal({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
  items,
  catalogProducts,
  department,
}: ConfirmStockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <FaBoxes className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                Confirm Inventory Stock Addition
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                Please verify the items and quantities before inventory is updated.
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Important Notice Box */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Attention: </span>
              You have selected to <strong>credit inventory immediately</strong>. Confirming will
              increment showroom stock levels and update product cost prices with this purchase's rates.
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Item / Product</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Stock Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const linkedProd = item.productId
                    ? catalogProducts.find((p) => p.id === item.productId)
                    : null;
                  const currentStock = linkedProd ? Number(linkedProd.quantityInStock || 0) : 0;
                  const addQty = parseInt(String(item.quantity)) || 0;
                  const newStock = currentStock + addQty;
                  const unitCost = parseFloat(String(item.unitCostPrice)) || 0;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <div
                          className="font-bold text-gray-900 cursor-default"
                          title={item.itemName || "Unnamed Item"}
                        >
                          {item.itemName || "Unnamed Item"}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {linkedProd ? (
                            <span className="text-[10.5px] text-gray-500 truncate max-w-xs" title={`${linkedProd.name} ${linkedProd.brand ? `(${linkedProd.brand})` : ""}`}>
                              Linked: {linkedProd.name} {linkedProd.brand ? `(${linkedProd.brand})` : ""}
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-blue-600 font-semibold">
                              Will create a new catalog product
                            </span>
                          )}
                          {item.warrantyMonths && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-100 text-purple-700">
                              ⚡ {item.warrantyMonths}M Warranty
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {linkedProd ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Existing
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            New Product
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">
                        ₹ {unitCost.toLocaleString("en-IN")}
                        {linkedProd && Number(linkedProd.costPrice) !== unitCost && (
                          <div className="text-[10px] text-amber-600 font-medium">
                            Was ₹ {Number(linkedProd.costPrice).toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                        {linkedProd ? (
                          <div className="flex items-center justify-end gap-1 font-mono">
                            <span className="text-gray-500">{currentStock}</span>
                            <FaArrowRight className="w-2.5 h-2.5 text-gray-400" />
                            <span className="text-emerald-700 font-black">{newStock}</span>
                            <span className="text-[10px] text-emerald-600 font-normal">
                              (+{addQty})
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-black font-mono">+{addQty} units</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            Back & Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            {submitting ? (
              "Saving & Updating Stock..."
            ) : (
              <>
                <FaCheck className="w-3.5 h-3.5" />
                Yes, Confirm & Add to Inventory
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

