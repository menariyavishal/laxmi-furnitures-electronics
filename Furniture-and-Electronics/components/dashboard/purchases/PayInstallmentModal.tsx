"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { FaTimes, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";
import { Purchase, PurchasePaymentMode } from "@/types/purchase";
import { recordPurchaseInstallment } from "@/lib/api/purchase";

interface PayInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase: Purchase | null;
}

export default function PayInstallmentModal({
  isOpen,
  onClose,
  onSuccess,
  purchase,
}: PayInstallmentModalProps) {
  if (!isOpen || !purchase) return null;

  const currentDue = Number(purchase.dueAmount);
  const [amount, setAmount] = useState<string>(String(currentDue));
  const [paymentMode, setPaymentMode] = useState<PurchasePaymentMode>("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const numAmount = parseFloat(amount) || 0;
  const newDue = Math.max(0, currentDue - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (numAmount <= 0) {
      setError("Please enter a valid installment amount greater than 0.");
      return;
    }
    if (numAmount > currentDue) {
      setError(`Amount cannot exceed the current outstanding due of ₹${currentDue.toLocaleString("en-IN")}.`);
      return;
    }

    try {
      setSubmitting(true);
      await recordPurchaseInstallment(purchase.id, {
        amountPaid: numAmount,
        paymentMode,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to record installment payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && Boolean(purchase)}
      onClose={onClose}
      className="bg-[#F4F3F0] rounded-2xl max-w-md w-full shadow-2xl border border-[#DEDAD3] overflow-hidden"
    >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <FaMoneyBillWave className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Pay Vendor Installment</h3>
              <p className="text-xs text-amber-800 font-medium">Settle balance for {purchase.purchaseNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Supplier Info Summary */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Vendor:</span>
              <span className="font-bold text-gray-900">{purchase.vendor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Phone:</span>
              <span className="font-mono text-gray-800">{purchase.vendor.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Total Bill:</span>
              <span className="font-bold text-gray-800">
                ₹ {Number(purchase.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Already Paid:</span>
              <span className="font-bold text-emerald-600">
                ₹ {Number(purchase.paidAmount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-800">Remaining Due:</span>
              <span className="font-black text-red-600 font-mono">
                ₹ {currentDue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Amount Paying Now */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Installment Amount (₹) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(currentDue))}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={currentDue}
              step="0.01"
              required
              placeholder="0"
              value={amount}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full py-2 px-3 border-2 border-amber-300 focus:border-amber-600 rounded-lg text-lg font-black text-amber-900 font-mono [appearance:textfield]"
            />
          </div>

          {/* Payment Mode */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PurchasePaymentMode)}
                className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-xs bg-white font-semibold"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT)</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Ref / UTR / Cheque #</label>
              <input
                type="text"
                placeholder="Optional Ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Payment Remarks</label>
            <input
              type="text"
              placeholder="e.g. 2nd installment given in cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          {/* After payment calculation */}
          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 flex justify-between items-center text-xs">
            <span className="text-blue-900 font-semibold">Remaining Balance After Payment:</span>
            <span className="font-mono font-black text-blue-900">
              ₹ {newDue.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || numAmount <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              <FaCheckCircle className="w-3.5 h-3.5" />
              <span>{submitting ? "Processing..." : `Record ₹${numAmount.toLocaleString("en-IN")}`}</span>
            </button>
          </div>
        </form>
      </Modal>
  );
}

