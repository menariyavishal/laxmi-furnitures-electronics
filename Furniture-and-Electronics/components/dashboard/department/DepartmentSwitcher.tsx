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
      className={`inline-flex items-center p-1 bg-[#131F33] rounded-xl border border-white/[0.08] shadow-inner ${className}`}
      role="group"
      aria-label="Select Store Division"
    >
      {options.map((key) => {
        const item = DEPARTMENTS[key];
        const isActive = department === key;

        let activeClasses = "bg-[#283041] text-white shadow-md border border-white/[0.1] font-semibold";
        if (isActive) {
          if (key === "FURNITURE") {
            activeClasses = "bg-[#8EB69B] text-white font-bold shadow-[0_2.5px_0_#5B7E67,0_4px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.45)] border border-[#7BA289] border-b-[#5B7E67]";
          } else if (key === "ELECTRONICS") {
            activeClasses = "bg-[#216A85] text-white font-bold shadow-[0_2.5px_0_#144E63,0_4px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.45)] border border-[#2D7F9E] border-b-[#144E63]";
          } else {
            activeClasses = "bg-[#CCD0CF] text-[#0B1421] font-bold shadow-[0_2.5px_0_#9BA5A8,0_4px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.7)] border border-[#B8C0C2] border-b-[#9BA5A8]";
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
                : "text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
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
