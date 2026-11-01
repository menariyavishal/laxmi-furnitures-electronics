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
        <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200/60 font-mono">
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
              className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors shadow-2xs font-mono"
              title="View Furniture Invoice"
            >
              <span>🪑</span>
              <span>{furnitureBill.billNumber}</span>
            </Link>
            {Number(furnitureBill.dueAmount || 0) === 0 ? (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ✓ Paid
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Due: ₹{Number(furnitureBill.dueAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span>⏳</span>
            <span>Pending Delivery</span>
          </span>
        ) : electronicsBills.length === 1 ? (
          /* Single Electronics Invoice: Stacked Link on top, Due/Paid status underneath */
          <div className="flex flex-col items-start gap-1">
            <Link
              href={`/billing/${electronicsBills[0].id}`}
              className="inline-flex items-center gap-1 font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors shadow-2xs font-mono"
              title="View Electronics Delivery Invoice"
            >
              <span>⚡</span>
              <span>{electronicsBills[0].billNumber}</span>
            </Link>
            {Number(electronicsBills[0].dueAmount || 0) === 0 ? (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ✓ Paid
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                Due: ₹{Number(electronicsBills[0].dueAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        ) : (
          /* Multiple Invoices: Split interactive pill with direct link + dropdown toggle, Due/Paid status underneath */
          <div className="flex flex-col items-start gap-1 relative">
            <div className="relative inline-flex items-stretch rounded-md border border-purple-200 bg-purple-50 shadow-2xs">
              {/* Clickable Bill Link */}
              <Link
                href={`/billing/${currentElecBill.id}`}
                className="inline-flex items-center gap-1 font-semibold text-purple-950 hover:bg-purple-100 px-2.5 py-0.5 text-xs transition-colors rounded-l-md font-mono"
                title="Click to open invoice"
              >
                <span>⚡</span>
                <span>{currentElecBill.billNumber}</span>
              </Link>

              {/* Dropdown Toggle Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="px-2 hover:bg-purple-200 border-l border-purple-200 text-purple-700 text-[10px] font-black flex items-center justify-center transition-colors rounded-r-md cursor-pointer"
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
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                              bDue === 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-600 border-red-200"
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
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ✓ Paid
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
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
      <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-700">
        ₹{advance.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-bold">
        {liveRemainingDue <= 0 ? (
          <span className="text-emerald-600">₹0 (Paid)</span>
        ) : (
          <span className="text-red-600">₹{liveRemainingDue.toLocaleString("en-IN")}</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            booking.status === "COMPLETED"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : booking.status === "CANCELLED"
              ? "bg-gray-100 text-gray-700 border border-gray-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
          title="View & Print Package Slip"
        >
          <FaEye className="w-3 h-3" />
          <span>Package Slip</span>
        </button>
      </td>
    </tr>
  );
}
