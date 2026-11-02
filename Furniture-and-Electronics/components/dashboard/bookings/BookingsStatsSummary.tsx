"use client";

import React from "react";
import { BookingResponse } from "@/types/booking";
import { FaBoxes, FaRupeeSign, FaHourglassHalf } from "react-icons/fa";

interface BookingsStatsSummaryProps {
  bookings: BookingResponse[];
}

export default function BookingsStatsSummary({ bookings }: BookingsStatsSummaryProps) {
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const activeBookings = safeBookings.length;

  const totalAdvance = safeBookings.reduce(
    (sum, b) => sum + (parseFloat(String(b.advancePaid)) || 0),
    0
  );

  const totalRemaining = safeBookings.reduce(
    (sum, b) => sum + (parseFloat(String(b.remainingBalance)) || 0),
    0
  );

  // Deliveries due within the next 7 days (including today & overdue)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueThisWeekCount = safeBookings.filter((b) => {
    if (!b.expectedDeliveryDate) return false;
    const dDate = new Date(b.expectedDeliveryDate);
    dDate.setHours(0, 0, 0, 0);
    return dDate <= next7Days;
  }).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Active Bookings */}
      <div className="bg-[#F5F2ED]/95 backdrop-blur-md rounded-2xl p-4 border border-[#E5DFD7] shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#6E6862] uppercase tracking-wider">
            Active Bookings
          </p>
          <p className="text-2xl font-black text-[#1C1A17] mt-1">
            {activeBookings}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs">
          <FaBoxes />
        </div>
      </div>

      {/* 2. Advance Paid */}
      <div className="bg-[#F5F2ED]/95 backdrop-blur-md rounded-2xl p-4 border border-[#E5DFD7] shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#6E6862] uppercase tracking-wider">
            Advance Received
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalAdvance)}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs">
          <FaRupeeSign />
        </div>
      </div>

      {/* 3. Balance Due */}
      <div className="bg-[#F5F2ED]/95 backdrop-blur-md rounded-2xl p-4 border border-[#E5DFD7] shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#6E6862] uppercase tracking-wider">
            Pending Balance
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-2xs">
          <FaHourglassHalf />
        </div>
      </div>

      {/* 4. Due in 7 Days (Urgent) */}
      <div className="bg-[#F5F2ED]/95 backdrop-blur-md rounded-2xl p-4 border border-[#E5DFD7] shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#6E6862] uppercase tracking-wider">
            Due in 7 Days
          </p>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {dueThisWeekCount}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shadow-2xs">
          <img
            src="/design-logos/truck-logo.png"
            alt="Truck"
            className="w-6 h-6 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
