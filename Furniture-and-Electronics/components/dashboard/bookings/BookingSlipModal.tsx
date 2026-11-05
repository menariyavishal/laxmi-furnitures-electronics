"use client";

import React, { useRef, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { BookingResponse } from "@/types/booking";
import { FaPrint, FaTimes, FaCamera, FaSearchPlus } from "react-icons/fa";
import { extractDesignPhotos } from "@/lib/booking-photos";

interface BookingSlipModalProps {
  booking: BookingResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingSlipModal({
  booking,
  isOpen,
  onClose,
}: BookingSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Close modal or image preview on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewImageUrl) {
          setPreviewImageUrl(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, previewImageUrl]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedBookingDate = new Date(booking.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedEventDate = booking.eventDate
    ? new Date(booking.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const formattedDeliveryDate = new Date(booking.expectedDeliveryDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isDelivered = booking.status === "COMPLETED";

  // Check actual delivery date from delivery records if present
  const deliveredRecord = booking.deliveries?.find((d) => d.actualDelivery);
  const formattedDeliveredDate = deliveredRecord?.actualDelivery
    ? new Date(deliveredRecord.actualDelivery).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : formattedDeliveryDate;

  const itemsTotal = (booking.bookingItems || []).reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  const total = Number(booking.totalEstimatedAmount);
  const match = booking.notes?.match(/Discount:\s*₹?([0-9,.]+)/i);
  const parsedDiscount = match ? parseFloat(match[1].replace(/,/g, "")) : 0;
  const discount = parsedDiscount > 0 ? parsedDiscount : Math.max(0, itemsTotal - total);
  const advance = Number(booking.advancePaid);
  const balance = Number(booking.remainingBalance);

  const furnitureBill = booking.bills?.find((b) => b.department === "FURNITURE");
  const electronicsBills = booking.bills?.filter((b) => b.department === "ELECTRONICS") || [];

  const hasFurniture = (booking.bookingItems || []).some(
    (i) => (i.department || "FURNITURE").toUpperCase() === "FURNITURE"
  );
  const hasElectronics = (booking.bookingItems || []).some(
    (i) => (i.department || "").toUpperCase() === "ELECTRONICS"
  );

  const designPhotos = extractDesignPhotos(booking.notes);

  return (
    <Modal
      isOpen={isOpen && Boolean(booking)}
      onClose={onClose}
      className="bg-[#FAF6F0] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#EADFCF] print:max-h-none print:shadow-none print:rounded-none"
    >
        {/* Fixed Header Controls (Always visible, docked at top, hidden in print) */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex justify-between items-center px-6 py-3.5 bg-gray-50 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <img
              src="/design-logos/slip-logo.png"
              alt="Slip"
              className="w-5 h-5 object-contain"
            />
            <span className="font-mono text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
              {booking.bookingNumber}
            </span>
            <span className="text-xs text-gray-500 font-medium">Package Order Slip</span>
            {isDelivered && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✓ Delivered
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <FaPrint className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              title="Close (Esc)"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Slip Body */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-4 text-gray-900 bg-white">
          {/* Header */}
          <div className="text-center border-b border-gray-300 pb-3">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">
              Laxmi Electronics & Furnitures
            </h1>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              Complete Wedding Packages, Electronics & Home Furnishings
            </p>
            <p className="text-xs text-gray-500">Bhinder | Phone: +91 820 939 9683</p>
            {isDelivered ? (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Delivered Package Order Slip
              </div>
            ) : (
              <div className="mt-2.5 inline-block bg-blue-50 text-blue-900 px-3.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-blue-200">
                Advance Package Order Slip
              </div>
            )}
          </div>

          {/* Booking Meta Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div>
              <p className="text-gray-500 text-[11px]">Booking Reference:</p>
              <p className="font-black text-gray-900 text-sm font-mono">{booking.bookingNumber}</p>
              <p className="text-gray-500 text-[11px] mt-1.5">Booking Date:</p>
              <p className="font-bold text-gray-800">{formattedBookingDate}</p>
            </div>
            <div>
              {isDelivered ? (
                <>
                  <p className="text-gray-500 text-[11px]">Delivery Status:</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
                      ✓ DELIVERED
                    </span>
                    <span className="text-gray-700 font-bold text-xs">
                      {formattedDeliveredDate}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-[11px]">Target Delivery Date:</p>
                  <p className="font-extrabold text-blue-900 text-sm flex items-center gap-1.5 mt-0.5">
                    <img
                      src="/design-logos/truck-logo.png"
                      alt="Delivery"
                      className="w-4 h-4 object-contain inline-block"
                    />
                    <span>{formattedDeliveryDate}</span>
                  </p>
                </>
              )}
              {formattedEventDate && (
                <>
                  <p className="text-gray-500 text-[11px] mt-1.5">Event Date:</p>
                  <p className="font-bold text-gray-800">{formattedEventDate}</p>
                </>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="text-xs border-b border-gray-200 pb-2.5">
            <h3 className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">
              Customer Details
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="font-extrabold text-sm text-gray-900">
                {booking.customer?.name || "Customer"}
              </span>
              <span className="font-mono text-gray-700 font-semibold">{booking.customer?.phone || "—"}</span>
            </div>
            {booking.customer?.address && (
              <p className="text-gray-600 mt-0.5">{booking.customer.address}</p>
            )}
          </div>

          {/* Reserved Items Table */}
          <div>
            <h3 className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1.5">
              Reserved Package Items ({booking.bookingItems.length})
            </h3>
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-1.5 px-3 text-left">Item Description</th>
                  <th className="py-1.5 px-3 text-center">Dept</th>
                  <th className="py-1.5 px-3 text-center">Qty</th>
                  <th className="py-1.5 px-3 text-right">Rate</th>
                  <th className="py-1.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {booking.bookingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-1.5 px-3 text-left">
                      <div className="font-semibold text-gray-900">{item.product.name}</div>
                      {item.customisations && (
                        <div className="text-[10px] text-gray-500 font-normal italic mt-0.5 whitespace-pre-line leading-tight">
                          {item.customisations}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100">
                        {item.department === "ELECTRONICS" ? "ELEC" : "FURN"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-1.5 px-3 text-right">
                      ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold">
                      ₹{Number(item.lineTotal).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Invoices Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            {/* Linked Invoices */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5">
              <h4 className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">
                Linked Tax Invoices
              </h4>
              <div className="text-[11px] space-y-1">
                <div>
                  <span className="text-gray-500">Furniture Bill: </span>
                  {hasFurniture ? (
                    <span className="font-bold text-emerald-800">
                      {furnitureBill ? furnitureBill.billNumber : "Pending Generation"}
                    </span>
                  ) : (
                    <span className="font-bold text-gray-400">— (Not in Package)</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Electronics Bill(s): </span>
                  {!hasElectronics ? (
                    <span className="font-bold text-gray-400">— (Not in Package)</span>
                  ) : electronicsBills.length > 0 ? (
                    <span className="font-bold text-purple-800">
                      {electronicsBills.map((b) => b.billNumber).join(", ")}
                    </span>
                  ) : isDelivered ? (
                    <span className="font-bold text-[#15803D]">Fulfilled on Delivery</span>
                  ) : (
                    <span className="font-bold text-[#854D0E]">Pending Delivery</span>
                  )}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 space-y-1 text-right">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Package Value:</span>
                <span className="font-bold text-gray-900">
                  ₹{(itemsTotal > 0 ? itemsTotal : total).toLocaleString("en-IN")}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount Applied:</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-gray-700 font-semibold border-t border-blue-100 pt-0.5">
                  <span>Net Order Total:</span>
                  <span className="font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-[#15803D]">
                <span className="font-semibold">Advance Received:</span>
                <span className="font-bold">₹{advance.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-blue-200 pt-1 flex justify-between text-xs sm:text-sm">
                <span className="font-extrabold text-gray-900">
                  {isDelivered ? "Balance Remaining:" : "Balance Due on Delivery:"}
                </span>
                <span
                  className={`font-extrabold ${
                    balance <= 0 ? "text-[#15803D]" : "text-[#780000]"
                  }`}
                >
                  {balance <= 0 ? "₹0 (Fully Settled)" : `₹${balance.toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>
          </div>

          {/* Delivered Verification Seal / Stamp */}
          {isDelivered && (
            <div className="border border-emerald-300 bg-emerald-50/70 rounded-xl px-4 py-2.5 flex items-center justify-between text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Order Delivered & Fulfilled
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Package items inspected and handed over to customer.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-200 text-emerald-900 border border-emerald-300">
                Status: Completed
              </span>
            </div>
          )}

          {/* Attached Design References Section */}
          {designPhotos && designPhotos.length > 0 && (
            <div className="pt-2 border-t border-dashed border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FaCamera className="w-3 h-3 text-blue-600" />
                  Attached Design References ({designPhotos.length})
                </h4>
                <span className="text-[10px] text-gray-400 font-medium">Click image to enlarge</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {designPhotos.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImageUrl(url)}
                    className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shadow-2xs aspect-video group cursor-pointer hover:border-blue-400 transition-all"
                    title="Click to view full size"
                  >
                    <img
                      src={url}
                      alt={`Design ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                      <FaSearchPlus className="w-3.5 h-3.5 text-blue-300" />
                      <span>View Full Size</span>
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Footer */}
          <div className="pt-6 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-700">Customer Signature</p>
              <div className="w-32 border-b border-gray-400 mt-5" />
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-700">For Laxmi Electronics & Furnitures</p>
              <div className="w-40 border-b border-gray-400 mt-5 ml-auto" />
            </div>
          </div>
        </div>

      {/* Full-Size Design Image Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-md sm:max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <FaCamera className="w-3.5 h-3.5 text-blue-600" />
                Attached Design Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                title="Close preview (Esc)"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Image viewport in standard size */}
            <div className="p-3 bg-gray-50/60 flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt="Design Reference Preview"
                className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-xs border border-gray-200/80 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
