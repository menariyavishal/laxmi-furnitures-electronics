"use client";

import React from "react";
import { FaRupeeSign, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

interface AdvancePaymentCardProps {
  totalEstimatedAmount: number;
  advancePaid: number;
  onAdvanceChange: (val: number) => void;
  discount: number;
  onDiscountChange: (val: number) => void;
  submitting: boolean;
  onSubmit: () => void;
  errorMessage?: string;
  hasFurniture: boolean;
  hasElectronics: boolean;
  hasOutOfStockFurniture?: boolean;
}

export default function AdvancePaymentCard({
  totalEstimatedAmount,
  advancePaid,
  onAdvanceChange,
  discount,
  onDiscountChange,
  submitting,
  onSubmit,
  errorMessage,
  hasFurniture,
  hasElectronics,
  hasOutOfStockFurniture,
}: AdvancePaymentCardProps) {
  const netTotal = Math.max(0, totalEstimatedAmount - discount);
  const remainingBalance = Math.max(0, netTotal - advancePaid);
  const percentPaid =
    netTotal > 0
      ? Math.min(100, Math.round((advancePaid / netTotal) * 100))
      : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 space-y-5">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <FaRupeeSign className="text-emerald-600 w-4 h-4" />
          Advance Token & Payment Summary
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Record token advance payment and optional discount for this booking.
        </p>
      </div>

      {/* Amounts Breakdown */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200/70">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-medium">Total Package Estimate:</span>
          <span className="text-lg font-bold text-gray-900">
            ₹{totalEstimatedAmount.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Advance Token Paid */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-medium">Advance Token Paid:</span>
          <div className="relative w-40">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-xs">
              ₹
            </span>
            <input
              type="number"
              min={0}
              max={netTotal}
              value={advancePaid === 0 ? "" : advancePaid}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => onAdvanceChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Optional Discount Section below Advance */}
        <div className="flex justify-between items-center text-sm pt-1">
          <div>
            <span className="text-gray-600 font-medium">Discount (Optional):</span>
            <span className="block text-[11px] text-gray-400">Special concession</span>
          </div>
          <div className="relative w-40">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-xs">
              ₹
            </span>
            <input
              type="number"
              min={0}
              max={totalEstimatedAmount}
              value={discount === 0 ? "" : discount}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-xs text-gray-500 pt-0.5">
            <span>Net Package Value:</span>
            <span className="font-bold text-gray-800">₹{netTotal.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm">
          <span className="text-gray-900 font-bold">Remaining Balance Due at Delivery:</span>
          <span className="text-xl font-extrabold text-amber-600">
            ₹{remainingBalance.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Progress bar */}
        <div className="pt-1">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1">
            <span>Advance Progress</span>
            <span className="font-bold">{percentPaid}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>
      </div>

      {/* Business Policy Banner with Sweet Warning for out-of-stock furniture */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5">
          <FaInfoCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Showroom Billing & Delivery Policy</span>
        </div>
        <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-1">
          {hasOutOfStockFurniture && (
            <li className="text-amber-800 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ <strong>Showroom Stock Notice:</strong> One or more furniture items exceed currently available showroom stock. Furniture billing occurs immediately and items will be registered on backorder.
            </li>
          )}
          {hasFurniture && !hasOutOfStockFurniture && (
            <li>
              <strong>Furniture Items:</strong> Reserved immediately from showroom inventory.
            </li>
          )}
          {hasElectronics && (
            <li>
              <strong>Electronics Items:</strong> Final Tax Invoice with serial number & GST will be generated on delivery day.
            </li>
          )}
          <li>
            Remaining balance of <strong>₹{remainingBalance.toLocaleString("en-IN")}</strong> payable upon delivery.
          </li>
        </ul>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Submit Booking Button */}
      <button
        type="button"
        disabled={submitting || totalEstimatedAmount <= 0}
        onClick={onSubmit}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow transition-all duration-150 flex items-center justify-center gap-2 text-sm"
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <FaCheckCircle className="w-4 h-4" />
            <span>Confirm & Save Advance Booking</span>
          </>
        )}
      </button>
    </div>
  );
}
