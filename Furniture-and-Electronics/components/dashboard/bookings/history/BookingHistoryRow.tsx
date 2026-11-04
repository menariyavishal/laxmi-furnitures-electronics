"use client";

import React from "react";
import Link from "next/link";
import { BookingResponse } from "@/types/booking";
import { FaFileInvoice, FaEye } from "react-icons/fa";

interface BookingHistoryRowProps {
  booking: BookingResponse;
  onViewSlip: (booking: BookingResponse) => void;
}

export default function BookingHistoryRow({
  booking,
  onViewSlip,
}: BookingHistoryRowProps) {
  const furnitureBill = booking.bills?.find((b) => b.department === "FURNITURE");
  const electronicsBills = booking.bills?.filter((b) => b.department === "ELECTRONICS") || [];

  const hasFurniture =
    Boolean(furnitureBill) ||
    (booking.bookingItems || []).some(
      (i) => (i.department || "FURNITURE").toUpperCase() === "FURNITURE"
    );
  const hasElectronics =
    electronicsBills.length > 0 ||
    (booking.bookingItems || []).some(
      (i) => (i.department || "").toUpperCase() === "ELECTRONICS"
    );

  const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);

  // Default to the most recent electronics delivery bill (last in list)
  const [selectedElecBillId, setSelectedElecBillId] = React.useState<number>(() => {
    return electronicsBills.length > 0 ? electronicsBills[electronicsBills.length - 1].id : 0;
  });

  React.useEffect(() => {
    if (electronicsBills.length > 0 && !electronicsBills.some((b) => b.id === selectedElecBillId)) {
      setSelectedElecBillId(electronicsBills[electronicsBills.length - 1].id);
    }
  }, [booking.bills]);

  const currentElecBill =
    electronicsBills.find((b) => b.id === selectedElecBillId) ||
    electronicsBills[electronicsBills.length - 1];

  const formattedBookingDate = new Date(booking.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const deliveryDateRaw = booking.expectedDeliveryDate || booking.eventDate;
  const formattedDeliveryDate = deliveryDateRaw
    ? new Date(deliveryDateRaw).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const total = Number(booking.totalEstimatedAmount);
  const advance = Number(booking.advancePaid);

  // Compute live remaining due across all bills and any remaining unbilled items
  const totalBillsDue = (booking.bills || []).reduce(
    (sum, b) => sum + Number(b.dueAmount || 0),
    0
  );
  const unbilledItemsDue = (booking.bookingItems || [])
    .filter((i) => !i.isBilled)
    .reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);

  // If bills exist, calculate true remaining due from bills & unbilled items, fallback to remainingBalance
  const liveRemainingDue =
    booking.bills && booking.bills.length > 0
      ? totalBillsDue + unbilledItemsDue
      : Number(booking.remainingBalance);

  return (
    <tr className="hover:bg-gray-50/80 transition-colors border-b border-gray-100 text-xs">
      {/* Date Column */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="font-semibold text-gray-900">{formattedBookingDate}</div>
        {formattedDeliveryDate && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-900 mt-1">
            <img
              src="/design-logos/truck-logo.png"
              alt="Delivery"
              className="w-3.5 h-3.5 object-contain flex-shrink-0"
            />
            <span>Delivery: {formattedDeliveryDate}</span>
          </div>
        )}
      </td>

      {/* Booking Number */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center font-extrabold text-white bg-[#5A94C1] px-2.5 py-1 rounded-md border border-[#6EA6CF] border-b-[#3E7197] shadow-[0_2px_0_#3E7197,0_3px_5px_rgba(45,85,115,0.22),inset_0_1px_0_rgba(255,255,255,0.35)] font-mono text-[11px] tracking-tight">
          {booking.bookingNumber}
        </span>
      </td>

      {/* Customer */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="font-bold text-gray-900">{booking.customer?.name || "Customer"}</div>
        <div className="text-[11px] text-gray-500 font-mono">{booking.customer?.phone || "—"}</div>
      </td>

      {/* Furniture Invoice Column */}
      <td className="px-4 py-3 whitespace-nowrap">
        {!hasFurniture ? (
          <span className="text-gray-400 font-medium">—</span>
        ) : furnitureBill ? (
          <div className="flex flex-col items-start gap-1">
            <Link
              href={`/billing/${furnitureBill.id}`}
              className="inline-flex items-center gap-1.5 font-semibold text-white bg-[#235347] hover:brightness-110 px-2.5 py-0.5 rounded-md border border-[#2F6859] border-b-[#14352D] shadow-[0_2px_0_#14352D,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all font-mono"
              title="View Furniture Invoice"
            >
              <img src="/furniture-logo-icon.png" alt="Furniture" className="w-3.5 h-3.5 object-contain inline-block shrink-0" />
              <span>{furnitureBill.billNumber}</span>
            </Link>
            {Number(furnitureBill.dueAmount || 0) === 0 ? (
              <span className="text-[10px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded">
                ✓ Paid
              </span>
            ) : (
              <span className="text-[10px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded">
                Due: ₹{Number(furnitureBill.dueAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] px-2 py-0.5 rounded">
            <span>⏳</span>
            <span>Pending Invoice</span>
          </span>
        )}
      </td>

      {/* Electronics Invoice(s) Column */}
      <td className="px-4 py-3 whitespace-nowrap">
        {!hasElectronics ? (
          <span className="text-gray-400 font-medium">—</span>
        ) : electronicsBills.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] px-2 py-0.5 rounded">
            <span>⏳</span>
            <span>Pending Delivery</span>
          </span>
        ) : electronicsBills.length === 1 ? (
          /* Single Electronics Invoice: Stacked Link on top, Due/Paid status underneath */
          <div className="flex flex-col items-start gap-1">
            <Link
              href={`/billing/${electronicsBills[0].id}`}
              className="inline-flex items-center gap-1.5 font-semibold text-white bg-[#093F52] hover:brightness-110 px-2.5 py-0.5 rounded-md border border-[#105269] border-b-[#052531] shadow-[0_2px_0_#052531,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all font-mono"
              title="View Electronics Delivery Invoice"
            >
              <span>⚡</span>
              <span>{electronicsBills[0].billNumber}</span>
            </Link>
            {Number(electronicsBills[0].dueAmount || 0) === 0 ? (
              <span className="text-[10px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded">
                ✓ Paid
              </span>
            ) : (
              <span className="text-[10px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded">
                Due: ₹{Number(electronicsBills[0].dueAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        ) : (
          /* Multiple Invoices: Split interactive pill with direct link + dropdown toggle, Due/Paid status underneath */
          <div className="flex flex-col items-start gap-1 relative">
            <div className="relative inline-flex items-stretch rounded-md border border-[#105269] border-b-[#052531] bg-[#093F52] shadow-[0_2px_0_#052531,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]">
              {/* Clickable Bill Link */}
              <Link
                href={`/billing/${currentElecBill.id}`}
                className="inline-flex items-center gap-1.5 font-semibold text-white hover:brightness-110 px-2.5 py-0.5 text-xs transition-all rounded-l-md font-mono"
                title="Click to open invoice"
              >
                <span>⚡</span>
                <span>{currentElecBill.billNumber}</span>
              </Link>

              {/* Dropdown Toggle Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="px-2 hover:bg-white/10 border-l border-[#105269] text-white text-[10px] font-black flex items-center justify-center transition-colors rounded-r-md cursor-pointer"
                title="Switch to another delivery invoice"
              >
                ▾
              </button>

              {/* Floating Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-8 z-30 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[210px] text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex justify-between items-center">
                      <span>Delivery Invoices ({electronicsBills.length})</span>
                      <span className="text-purple-600 font-semibold">Switch</span>
                    </div>
                    {electronicsBills.map((b) => {
                      const bDue = Number(b.dueAmount || 0);
                      const isCurrent = b.id === currentElecBill.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedElecBillId(b.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 hover:bg-purple-50 cursor-pointer transition-colors ${
                            isCurrent ? "bg-purple-50 font-bold text-purple-900" : "text-gray-700"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-mono text-xs">
                            <span>⚡</span>
                            <span>{b.billNumber}</span>
                            {isCurrent && <span className="text-purple-600">●</span>}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              bDue === 0 ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]" : "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                            }`}
                          >
                            {bDue === 0 ? "✓ Paid" : `Due ₹${bDue.toLocaleString("en-IN")}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Live Due / Paid status for the selected bill */}
            {Number(currentElecBill.dueAmount || 0) === 0 ? (
              <span className="text-[10px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded">
                ✓ Paid
              </span>
            ) : (
              <span className="text-[10px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded">
                Due: ₹{Number(currentElecBill.dueAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Financials: Total / Advance / Due */}
      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
        ₹{total.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-medium text-[#15803D]">
        ₹{advance.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-bold">
        {liveRemainingDue <= 0 ? (
          <span className="text-[#15803D]">₹0 (Paid)</span>
        ) : (
          <span className="text-[#780000]">₹{liveRemainingDue.toLocaleString("en-IN")}</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            booking.status === "COMPLETED"
              ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : booking.status === "CANCELLED"
              ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : booking.status === "PARTIALLY_DELIVERED"
              ? "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "bg-[#F1F5F9] text-[#334155] border border-[#94A3B8] border-b-[#64748B] shadow-[0_2px_4px_rgba(71,85,105,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
          }`}
        >
          {booking.status.replace("_", " ")}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <button
          type="button"
          onClick={() => onViewSlip(booking)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#5A94C1] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_#3E7197] text-white text-xs font-bold border border-[#6EA6CF] border-b-[#3E7197] shadow-[0_2px_0_#3E7197,0_3px_5px_rgba(45,85,115,0.22),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all cursor-pointer"
          title="View & Print Package Slip"
        >
          <FaEye className="w-3 h-3 text-white/90" />
          <span>Package Slip</span>
        </button>
      </td>
    </tr>
  );
}
