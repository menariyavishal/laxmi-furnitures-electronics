"use client";

import React, { useState, useEffect } from "react";
import { BookingResponse } from "@/types/booking";
import { generateDeliveryInvoice } from "@/lib/api/booking";

interface DeliveryInvoiceModalProps {
  booking: BookingResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeliveryInvoiceModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: DeliveryInvoiceModalProps) {
  if (!isOpen || !booking) return null;

  const unbilledItems = booking.bookingItems.filter((i) => !i.isBilled);

  // Default: All unbilled items selected for delivery
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>(() =>
    unbilledItems.map((i) => i.id)
  );

  const [serialNumbers, setSerialNumbers] = useState<Record<number, string>>({});
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [sgstPercent, setSgstPercent] = useState<string>("0");
  const [cgstPercent, setCgstPercent] = useState<string>("0");
  const [isGstInclusive, setIsGstInclusive] = useState<boolean>(true);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedItems = unbilledItems.filter((i) => selectedItemIds.includes(i.id));
  const subtotalToBill = selectedItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);

  const outOfStockItems = selectedItems.filter(
    (i) => i.product.quantityInStock !== undefined && i.product.quantityInStock <= 0
  );

  // Manual GST & Inclusive/Exclusive Calculations
  const sPercent = parseFloat(sgstPercent) || 0;
  const cPercent = parseFloat(cgstPercent) || 0;
  const totalGstPercent = sPercent + cPercent;

  let taxableAmount = subtotalToBill;
  let sgstAmount = 0;
  let cgstAmount = 0;
  let finalBillTotal = subtotalToBill;

  if (totalGstPercent > 0) {
    if (isGstInclusive) {
      // Reverse GST calculation (inclusive: price already includes GST)
      taxableAmount = subtotalToBill / (1 + totalGstPercent / 100);
      sgstAmount = taxableAmount * (sPercent / 100);
      cgstAmount = taxableAmount * (cPercent / 100);
      finalBillTotal = subtotalToBill;
    } else {
      // Exclusive GST: tax added on top of total
      taxableAmount = subtotalToBill;
      sgstAmount = taxableAmount * (sPercent / 100);
      cgstAmount = taxableAmount * (cPercent / 100);
      finalBillTotal = subtotalToBill + sgstAmount + cgstAmount;
    }
  }

  const [amountPaidNow, setAmountPaidNow] = useState<string>(
    String(Math.min(finalBillTotal, Number(booking.remainingBalance)))
  );

  // Update default payment amount whenever item selection or finalBillTotal changes
  useEffect(() => {
    setAmountPaidNow(String(Math.min(finalBillTotal, Number(booking.remainingBalance))));
  }, [selectedItemIds, finalBillTotal, booking.remainingBalance]);

  const handleToggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSerialChange = (itemId: number, serial: string) => {
    setSerialNumbers((prev) => ({
      ...prev,
      [itemId]: serial,
    }));
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedItemIds.length === 0) {
      setError("Please select at least one item to deliver and bill now.");
      return;
    }

    setLoading(true);

    try {
      const createdBill = await generateDeliveryInvoice(booking.id, {
        deliveryDate,
        itemSerialNumbers: serialNumbers,
        paymentMode,
        amountPaidNow: parseFloat(amountPaidNow) || 0,
        itemIdsToBill: selectedItemIds,
        sgstPercent: sPercent,
        cgstPercent: cPercent,
        sgstAmount,
        cgstAmount,
        isGstInclusive,
        totalAmount: finalBillTotal,
      });

      // Auto-dispatch WhatsApp Electronics Delivery Invoice
      const customerPhone = booking.customer?.phone;
      if (customerPhone && createdBill) {
        try {
          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const { formatDeliveryInvoiceMessage } = await import("@/lib/whatsapp/templates");

          const customerName = booking.customer?.name || "Customer";
          const deliveryMsg = formatDeliveryInvoiceMessage({
            customerName,
            bookingNumber: booking.bookingNumber,
            billNumber: createdBill.billNumber,
            deliveryDate,
            items: selectedItems.map((i) => ({
              productName: i.product.name,
              quantity: i.quantity,
              serialNumber: serialNumbers[i.id] || null,
              warrantyMonths: i.product.warrantyMonths,
            })),
            invoiceTotal: finalBillTotal,
            amountPaidNow: parseFloat(amountPaidNow) || 0,
            remainingBalance: Math.max(0, Number(booking.remainingBalance) - (parseFloat(amountPaidNow) || 0)),
          });

          const fullBillData = {
            ...createdBill,
            customer: booking.customer,
            billItems: selectedItems.map((i) => ({
              product: i.product,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
            })),
          };

          const blob = await generateBillPdfBlob(fullBillData);
          const formData = new FormData();
          formData.append("file", blob, `Laxmi_Invoice_${createdBill.billNumber}.pdf`);
          formData.append("customerName", customerName);
          formData.append("mobileNumber", customerPhone);
          formData.append("billNumber", createdBill.billNumber);
          formData.append("customMessage", deliveryMsg);

          fetch(`/api/v1/bills/${createdBill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          }).catch((err) => console.error("Auto WhatsApp electronics dispatch failed:", err));
        } catch (waErr) {
          console.error("Failed to generate delivery invoice PDF for WhatsApp:", waErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate delivery invoice");
    } finally {
      setLoading(false);
    }
  };

  const isPartial = selectedItemIds.length < unbilledItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>⚡</span> Generate Delivery Tax Invoice
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Booking #{booking.bookingNumber} — {booking.customer.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold leading-none p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleGenerateInvoice} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Sweet Warning Banner for Out-of-Stock Appliances */}
          {outOfStockItems.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
              <span className="text-base flex-shrink-0">⚠️</span>
              <div>
                <strong className="font-bold">Showroom Inventory Notice:</strong>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  {outOfStockItems.map((i) => i.product.name).join(", ")}{" "}
                  currently {outOfStockItems.length === 1 ? "has" : "have"} 0 units in showroom inventory. Generating this delivery invoice will register the sale and decrement stock to negative. Please ensure the physical unit is in hand.
                </p>
              </div>
            </div>
          )}

          {/* Warranty Explanation Banner */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <strong className="font-bold">Official Warranty Starts on Delivery Date:</strong>
              <p className="mt-0.5 text-blue-800">
                This invoice will be dated on the delivery day. Manufacturer warranty activates from this date
                exclusively for the items selected below.
              </p>
            </div>
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Invoice & Delivery Date
            </label>
            <input
              type="date"
              required
              className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Items to Deliver Checkbox Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select Items to Deliver Now ({selectedItemIds.length}/{unbilledItems.length})
              </label>
              {isPartial && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Partial Delivery: Remaining items stay in booking
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {unbilledItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const isOutOfStock =
                  item.product.quantityInStock !== undefined && item.product.quantityInStock <= 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-blue-300 bg-blue-50/40 shadow-2xs"
                        : "border-gray-200 bg-gray-50/60 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />

                      <div className="flex-1">
                        <label
                          htmlFor={`item-${item.id}`}
                          className="flex justify-between items-center text-xs cursor-pointer"
                        >
                          <span className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                            <span>{item.department === "ELECTRONICS" ? "⚡" : "🪑"} {item.product.name}</span>
                            <span className="text-gray-500 font-normal">(Qty: {item.quantity})</span>
                            {isOutOfStock && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                ⚠️ 0 in stock
                              </span>
                            )}
                          </span>
                          <span className="font-extrabold text-gray-800">
                            ₹{Number(item.lineTotal).toLocaleString("en-IN")}
                          </span>
                        </label>

                        {isSelected ? (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              placeholder="Scan or enter Appliance Serial Number / IMEI (Optional)"
                              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              value={serialNumbers[item.id] || ""}
                              onChange={(e) => handleSerialChange(item.id, e.target.value)}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              🛡️ Warranty starts on {deliveryDate}: {item.product.warrantyMonths || 12} Months
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] font-semibold text-amber-700 mt-1">
                            ⏳ Item will remain pending in the booking card for a future delivery.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtotal of Selected Items */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Selected Delivery Subtotal:</span>
            <span className="text-sm font-black text-gray-900">
              ₹{subtotalToBill.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Payment & GST Section */}
          <div className="space-y-3.5 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="FINANCE">Finance / EMI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Collected Now (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={amountPaidNow}
                  onChange={(e) => setAmountPaidNow(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Remaining due will appear in Due Payments
                </p>
              </div>
            </div>

            {/* GST Tax Configuration Section (Manual SGST/CGST inputs + Include/Exclude tickmark) */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    GST Tax Details
                  </label>
                  <span className="text-[11px] text-slate-500 block">
                    {isGstInclusive
                      ? "Inclusive: Reverse calculated from price (default)"
                      : "Exclusive: Added on top of item total"}
                  </span>
                </div>

                {/* Include / Exclude Tickmark (Default: Included) */}
                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs select-none">
                  <input
                    type="checkbox"
                    checked={isGstInclusive}
                    onChange={(e) => setIsGstInclusive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Include GST</span>
                </label>
              </div>

              {/* Side-by-Side SGST (%) and CGST (%) Manual Inputs (Exactly like image 3) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    SGST (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    value={sgstPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setSgstPercent(val);
                      }
                    }}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    CGST (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    value={cgstPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setCgstPercent(val);
                      }
                    }}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                  />
                </div>
              </div>

              {/* Live GST Breakdown */}
              {(sPercent > 0 || cPercent > 0) && (
                <div className="grid grid-cols-4 gap-2 text-[11px] pt-2 border-t border-slate-200 text-slate-700">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Taxable Base:</span>
                    <span className="font-bold text-slate-900">₹{taxableAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">SGST ({sPercent}%):</span>
                    <span className="font-bold text-blue-900">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">CGST ({cPercent}%):</span>
                    <span className="font-bold text-blue-900">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Invoice Total:</span>
                    <span className="font-extrabold text-emerald-800">₹{finalBillTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedItemIds.length === 0}
              className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? "Generating Invoice..."
                : isPartial
                ? `Confirm Partial Delivery (${selectedItemIds.length} Items)`
                : `Confirm & Generate Bill (${selectedItemIds.length} Items)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
