"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface AlertItem {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  threshold: number;
  severity: "critical" | "danger" | "warning";
  message: string;
}

export default function NotificationBell() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlerts();
    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Read from localStorage only on client mount / update
    const dismissed = getDismissed();
    setDismissedKeys(dismissed);
    const activeUnread = alerts.filter(
      (alert) => !dismissed.includes(`${alert.id}-${alert.quantity}`)
    );
    setUnreadCount(activeUnread.length);
  }, [alerts]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/v1/dashboard/notifications");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications in bell:", err);
    }
  };

  const getDismissed = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("dismissed_alerts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const markAllAsRead = () => {
    try {
      const currentKeys = alerts.map((alert) => `${alert.id}-${alert.quantity}`);
      localStorage.setItem("dismissed_alerts", JSON.stringify(currentKeys));
      setDismissedKeys(currentKeys);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            markAllAsRead();
          }
        }}
        className="relative p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/[0.1] rounded-full transition focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-2xs"
        aria-label="Notification center"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#780000] rounded-full animate-pulse shadow-[0_2px_4px_rgba(120,0,0,0.3)]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#F5F2ED] rounded-2xl shadow-2xl border border-[#E5DFD7] py-0 z-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5DFD7] flex justify-between items-center bg-[#EFEBE3]">
            <span className="font-extrabold text-[#1C1A17] text-sm">Inventory Alerts</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#E5DFD7]">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#6E6862] text-sm font-semibold">
                No active notifications
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-5 py-3 flex flex-col gap-1 hover:bg-[#EAE4DC]/50 transition ${
                    dismissedKeys.includes(`${alert.id}-${alert.quantity}`) ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C1A17] text-xs truncate max-w-[180px]">
                      {alert.name}
                    </span>
                    <span
                      className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        alert.severity === "critical"
                          ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                          : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      }`}
                    >
                      {alert.severity === "critical" ? "OUT" : "LOW"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6862] line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[#E5DFD7] text-center bg-[#EFEBE3]">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#2563EB] hover:underline block w-full"
            >
              View all alerts &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
