"use client";

import React from "react";

interface DashboardBackgroundProps {
  src?: string;
  overlayOpacity?: number;
}

export default function DashboardBackground({
  src = "/Minimalist White Hexagon Honeycomb.png",
  overlayOpacity = 0.25,
}: DashboardBackgroundProps) {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
      <img
        src={encodeURI(src)}
        alt="Dashboard Background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Subtle Anti-Glare Soft Frosted Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-[1.5px]"
        style={{ backgroundColor: `rgba(245, 242, 237, ${overlayOpacity})` }}
      />
    </div>
  );
}

