"use client";

import React from "react";
import { useDepartment } from "./DepartmentContext";
import { Department, DEPARTMENTS } from "@/types/department";

interface DepartmentSwitcherProps {
  showCombined?: boolean;
  className?: string;
}

export default function DepartmentSwitcher({
  showCombined = true,
  className = "",
}: DepartmentSwitcherProps) {
  const { department, setDepartment } = useDepartment();

  const options: Department[] = showCombined
    ? ["FURNITURE", "ELECTRONICS", "ALL"]
    : ["FURNITURE", "ELECTRONICS"];

  return (
    <div
      className={`inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200/80 shadow-inner ${className}`}
      role="group"
      aria-label="Select Store Division"
    >
      {options.map((key) => {
        const item = DEPARTMENTS[key];
        const isActive = department === key;

        let activeClasses = "bg-white text-gray-900 shadow-sm border border-gray-200/60";
        if (isActive) {
          if (key === "FURNITURE") {
            activeClasses = "bg-amber-600 text-white shadow-md shadow-amber-200 border-amber-600 font-semibold";
          } else if (key === "ELECTRONICS") {
            activeClasses = "bg-blue-600 text-white shadow-md shadow-blue-200 border-blue-600 font-semibold";
          } else {
            activeClasses = "bg-slate-800 text-white shadow-md shadow-slate-200 border-slate-800 font-semibold";
          }
        }

        return (
          <button
            key={key}
            type="button"
            onClick={() => setDepartment(key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm rounded-lg font-medium transition-all duration-200 ${
              isActive
                ? activeClasses
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 border border-transparent"
            }`}
          >
            <span className="text-sm md:text-base">{item.icon}</span>
            <span>{item.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
