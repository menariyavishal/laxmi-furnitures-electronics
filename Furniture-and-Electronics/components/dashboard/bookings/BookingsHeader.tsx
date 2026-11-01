"use client";

import React from "react";
import Link from "next/link";
import { FaPlus, FaCalendarCheck } from "react-icons/fa";

export default function BookingsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FaCalendarCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Advance Bookings
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Manage advance customer orders and packages for weddings, events, and scheduled future deliveries.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/bookings/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150"
        >
          <FaPlus className="w-3.5 h-3.5" />
          <span>New Advance Booking</span>
        </Link>
      </div>
    </div>
  );
}
