"use client";

import React, { useState } from "react";
import { BookingResponse } from "@/types/booking";
import { FaWhatsapp } from "react-icons/fa";

interface BookingCardProps {
  booking: BookingResponse;
  onOpenDeliveryModal: (booking: BookingResponse) => void;
  onViewSlip?: (booking: BookingResponse) => void;
  onCompleteBooking?: (bookingId: number) => void;
  completingBookingId?: number | null;
}

export default function BookingCard({
  booking,
  onOpenDeliveryModal,
  onViewSlip,
  onCompleteBooking,
  completingBookingId,
}: BookingCardProps) {
  const total = Number(booking.totalEstimatedAmount);
  const advance = Number(booking.advancePaid);

  const totalBillsDue = (booking.bills || []).reduce(
    (sum, b) => sum + Number(b.dueAmount || 0),
    0
  );
  const unbilledItemsDue = (booking.bookingItems || [])
    .filter((i) => !i.isBilled)
    .reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);
  const liveRemainingDue =
    booking.bills && booking.bills.length > 0
      ? totalBillsDue + unbilledItemsDue
      : Number(booking.remainingBalance);

  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const handleResendWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = booking.customer?.phone;
    if (!phone) {
      alert("No customer phone number attached to this booking.");
      return;
    }
    setSendingWhatsApp(true);
    try {
      const { generateBookingSlipPdfBlob } = await import("@/lib/pdf/booking-slip");
      const blob = await generateBookingSlipPdfBlob(booking);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string)?.split(",")[1];
          const res = await fetch(`/api/v1/bookings/${booking.id}/whatsapp/resend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pdfBase64: base64data,
              isNewBooking: false,
            }),
          });
          const data = await res.json();
          if (data.success) {
            alert(`✅ Booking slip sent to ${booking.customer.name} (${phone}) on WhatsApp!`);
          } else {
            alert(`⚠️ WhatsApp notice: ${data.error || "Failed to send"}`);
          }
        } catch (err: any) {
          alert(`Error sending WhatsApp: ${err.message}`);
        } finally {
          setSendingWhatsApp(false);
        }
      };
    } catch (err: any) {
      console.error("Failed to generate/send slip:", err);
      alert(`Error generating slip: ${err.message}`);
      setSendingWhatsApp(false);
    }
  };

  const paidPercent = total > 0 ? Math.min(100, Math.round(((total - liveRemainingDue) / total) * 100)) : 0;

  const furnitureItems = booking.bookingItems.filter((i) => i.department === "FURNITURE");
  const electronicsItems = booking.bookingItems.filter((i) => i.department === "ELECTRONICS");
  const unbilledElectronics = electronicsItems.filter((i) => !i.isBilled);

  const formattedDeliveryDate = new Date(booking.expectedDeliveryDate).toLocaleDateString("en-IN", {
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

  // Relative delivery days
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deliveryDt = new Date(booking.expectedDeliveryDate);
  deliveryDt.setHours(0, 0, 0, 0);
  const diffTime = deliveryDt.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let relativeBadge = "";
  let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
  if (diffDays === 0) {
    relativeBadge = "Today";
    badgeColor = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
  } else if (diffDays === 1) {
    relativeBadge = "Tomorrow";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (diffDays === -1) {
    relativeBadge = "1d Overdue";
    badgeColor = "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]";
  } else if (diffDays < -1) {
    relativeBadge = `${Math.abs(diffDays)}d Overdue`;
    badgeColor = "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]";
  } else if (diffDays <= 7) {
    relativeBadge = `In ${diffDays} days`;
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
  } else {
    relativeBadge = `In ${diffDays} days`;
    badgeColor = "bg-gray-50 text-gray-600 border-gray-200";
  }

  return (
    <div className="bg-[#F5F2ED]/95 backdrop-blur-md rounded-2xl border border-[#E5DFD7] shadow-sm hover:shadow-md hover:border-[#D5CDC3] transition-all duration-200 p-5 flex flex-col justify-between">
      <div>
        {/* Header: Symmetrical Top Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="whitespace-nowrap font-mono text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/80 tracking-tight">
            {booking.bookingNumber}
          </span>

          <div className="flex items-center gap-2">
            {onViewSlip && (
              <button
                type="button"
                onClick={() => onViewSlip(booking)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-2xs transition-colors"
                title="View & Print Order Slip"
              >
                <img
                  src="/design-logos/slip-logo.png"
                  alt="Slip"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Slip</span>
              </button>
            )}

            {/* Quick Resend WhatsApp Button (Icon-Only) */}
            <button
              type="button"
              disabled={sendingWhatsApp}
              onClick={handleResendWhatsApp}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-md border shadow-2xs transition-colors shrink-0 ${
                sendingWhatsApp
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse cursor-wait"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}
              title="Resend Booking Slip & Designs via WhatsApp"
            >
              <FaWhatsapp className="w-4 h-4 text-emerald-600" />
            </button>

            <span
              className={`inline-flex items-center h-7 px-2.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                booking.status === "COMPLETED"
                  ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                  : booking.status === "PARTIALLY_DELIVERED"
                  ? "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
                  : "bg-[#F1F5F9] text-[#334155] border border-[#94A3B8] border-b-[#64748B] shadow-[0_2px_4px_rgba(71,85,105,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
              }`}
            >
              {booking.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-3">
          <h4 className="text-base font-bold text-gray-900 leading-snug">
            {booking.customer.name || "Customer"}
          </h4>
          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
            <span className="font-mono text-gray-600 font-medium">
              {booking.customer.phone || "No phone"}
            </span>
            {booking.customer.address && (
              <span className="truncate max-w-[210px] text-gray-500">
                {booking.customer.address}
              </span>
            )}
          </div>
        </div>

        {/* Expected Delivery Date Banner (with exact date & truck logo) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 mb-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/design-logos/truck-logo.png"
              alt="Delivery"
              className="w-4 h-4 object-contain flex-shrink-0"
            />
            <span className="text-gray-500 font-medium">Delivery:</span>
            <span className="font-black text-blue-950 truncate">{formattedDeliveryDate}</span>
          </div>
          {relativeBadge && (
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeColor}`}
            >
              {relativeBadge}
            </span>
          )}
        </div>

        {/* Event Date (if present) */}
        {formattedEventDate && (
          <div className="text-[11px] text-gray-500 mb-3 px-1 flex items-center gap-1.5">
            <span className="font-medium text-gray-400">Event Date:</span>
            <span className="font-semibold text-gray-700">{formattedEventDate}</span>
          </div>
        )}

        {/* Items Summary */}
        <div className="space-y-1.5 mb-4 text-xs">
          <div className="font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span>Reserved Items ({booking.bookingItems.length})</span>
            <div className="flex gap-1.5">
              {furnitureItems.length > 0 && (
                <span className="bg-[#235347] text-white px-2.5 py-0.5 rounded-md border border-[#2F6859] border-b-[#14352D] shadow-[0_2px_0_#14352D,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] font-bold text-[11px]">
                  {furnitureItems.length} Furniture
                </span>
              )}
              {electronicsItems.length > 0 && (
                <span className="bg-[#093F52] text-white px-2.5 py-0.5 rounded-md border border-[#105269] border-b-[#052531] shadow-[0_2px_0_#052531,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] font-bold text-[11px]">
                  {electronicsItems.length} Electronics
                </span>
              )}
            </div>
          </div>

          <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
            {booking.bookingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1 px-2 rounded bg-gray-50/70 border border-gray-100 gap-2"
              >
                <span className="text-gray-800 truncate min-w-0 flex-1 text-xs">
                  {item.product.name} (x{item.quantity})
                </span>
                <span className="font-medium text-gray-600 shrink-0">
                  {item.isBilled ? (
                    <span className="text-[#15803D] font-bold text-[11px] whitespace-nowrap">✓ Invoiced</span>
                  ) : item.department === "ELECTRONICS" ? (
                    <span className="text-[#854D0E] font-bold bg-[#FEF9E7] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] px-2 py-0.5 rounded text-[10px] whitespace-nowrap inline-block">
                      Pending Delivery
                    </span>
                  ) : (
                    <span className="whitespace-nowrap text-xs">₹{Number(item.lineTotal).toLocaleString("en-IN")}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Financial Progress & Delivery Invoice Action */}
      <div className="border-t border-gray-100 pt-3 mt-2">
        <div className="flex justify-between items-baseline mb-1 text-xs">
          <span className="text-gray-500 font-medium">
            Advance: <strong className="text-[#15803D] font-bold">₹{advance.toLocaleString("en-IN")}</strong> ({paidPercent}%)
          </span>
          <span className="text-gray-500 font-medium">
            Due: <strong className="text-[#780000] font-bold">₹{liveRemainingDue.toLocaleString("en-IN")}</strong>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${paidPercent}%` }}
          />
        </div>

        {/* Action Button */}
        {unbilledElectronics.length > 0 ? (
          <button
            type="button"
            onClick={() => onOpenDeliveryModal(booking)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>⚡</span> Generate Delivery Invoice ({unbilledElectronics.length} Appliances)
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-center py-1.5 bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] rounded-md text-[11px] font-bold">
              ✓ All Delivery Invoices Generated
            </div>
            {onCompleteBooking && (
              <button
                type="button"
                onClick={() => onCompleteBooking(booking.id)}
                disabled={completingBookingId === booking.id}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>🚚</span>
                <span>
                  {completingBookingId === booking.id
                    ? "Completing Delivery..."
                    : "Mark Order Delivered & Complete"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
