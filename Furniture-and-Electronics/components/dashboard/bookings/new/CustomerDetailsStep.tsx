"use client";

import React from "react";
import { FaUser, FaPhone, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

interface CustomerDetailsData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  eventDate: string;
  expectedDeliveryDate: string;
  notes?: string;
}

interface CustomerDetailsStepProps {
  formData: CustomerDetailsData;
  onChange: (field: keyof CustomerDetailsData, value: string) => void;
}

export default function CustomerDetailsStep({
  formData,
  onChange,
}: CustomerDetailsStepProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange("customerPhone", val);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 space-y-5">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FaUser className="text-blue-600 w-4 h-4" />
          Customer & Delivery Details
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Enter customer contact information and event / delivery schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaUser className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.customerName}
              onChange={(e) => onChange("customerName", e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaPhone className="w-3.5 h-3.5" />
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="10-digit mobile number"
              value={formData.customerPhone}
              onChange={handlePhoneChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>
        </div>

        {/* Delivery Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Delivery Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute top-2.5 left-3 pointer-events-none text-gray-400">
              <FaMapMarkerAlt className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              required
              placeholder="Full delivery location / village / landmark"
              value={formData.customerAddress}
              onChange={(e) => onChange("customerAddress", e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Event / Function Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            📅 Event / Function Date <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaCalendarAlt className="w-3.5 h-3.5" />
            </span>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => onChange("eventDate", e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Expected Delivery Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            🚚 Target Delivery Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaCalendarAlt className="w-3.5 h-3.5" />
            </span>
            <input
              type="date"
              required
              value={formData.expectedDeliveryDate}
              onChange={(e) => onChange("expectedDeliveryDate", e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            * Electronics warranty clock will begin on this delivery date.
          </p>
        </div>
      </div>
    </div>
  );
}
