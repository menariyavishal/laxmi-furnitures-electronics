"use client";

import React, { useState, useEffect, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Boxes,
  CalendarCheck2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  History,
  LayoutDashboard,
  ShoppingBag,
  UsersRound,
  type LucideProps,
} from "lucide-react";

export type SidebarPage =
  | "Dashboard"
  | "Billing"
  | "Billing History"
  | "Advance Bookings"
  | "Booking History"
  | "Due Payments"
  | "Finance"
  | "Purchases"
  | "Inventory"
  | "Analytics"
  | "Staff Management";

type Icon = ComponentType<LucideProps>;
type NavGroup = { label: string; items: { label: SidebarPage; icon: Icon; href: string; ownerOnly?: boolean }[] };

const navigation: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    label: "CLIENTS & BOOKINGS",
    items: [
      { label: "Billing", icon: CreditCard, href: "/billing" },
      { label: "Billing History", icon: History, href: "/billing/history" },
      { label: "Advance Bookings", icon: CalendarDays, href: "/bookings" },
      { label: "Booking History", icon: CalendarCheck2, href: "/bookings/history" },
      { label: "Due Payments", icon: CircleDollarSign, href: "/due-payments" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Finance", icon: ChartNoAxesCombined, href: "/finance" },
      { label: "Purchases", icon: ShoppingBag, href: "/purchases" },
      { label: "Inventory", icon: Boxes, href: "/inventory" },
      { label: "Analytics", icon: ChartNoAxesColumnIncreasing, href: "/analytics", ownerOnly: true },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [{ label: "Staff Management", icon: UsersRound, href: "/staff-management", ownerOnly: true }],
  },
];

function getActivePageFromPath(pathname: string): SidebarPage {
  if (pathname.startsWith("/billing/history")) return "Billing History";
  if (pathname.startsWith("/billing")) return "Billing";
  if (pathname.startsWith("/bookings/history")) return "Booking History";
  if (pathname.startsWith("/bookings")) return "Advance Bookings";
  if (pathname.startsWith("/due-payments")) return "Due Payments";
  if (pathname.startsWith("/finance")) return "Finance";
  if (pathname.startsWith("/purchases")) return "Purchases";
  if (pathname.startsWith("/inventory")) return "Inventory";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/staff-management")) return "Staff Management";
  return "Dashboard";
}

export interface SidebarProps {
  isOwner?: boolean;
  activePage?: SidebarPage;
  defaultActivePage?: SidebarPage;
  onPageChange?: (page: SidebarPage) => void;
  className?: string;
}

/** Ink Well (#0B1421) navigation with a spring-animated Ophelia (#283041) active pill. */
export default function Sidebar({
  isOwner = true,
  activePage: controlledPage,
  defaultActivePage = "Dashboard",
  onPageChange,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();
  const [localPage, setLocalPage] = useState<SidebarPage>(defaultActivePage);

  // Sync active page from current Next.js route unless controlled
  useEffect(() => {
    if (pathname && controlledPage === undefined) {
      setLocalPage(getActivePageFromPath(pathname));
    }
  }, [pathname, controlledPage]);

  const activePage = controlledPage ?? localPage;

  function handleSelect(page: SidebarPage) {
    if (controlledPage === undefined) setLocalPage(page);
    onPageChange?.(page);
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen w-[286px] shrink-0 self-start flex-col overflow-hidden no-scrollbar bg-[#0B1421] px-4 pb-4 pt-5 text-white z-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {/* Ambient Lighting Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#283041]/55 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-28 h-72 w-72 rounded-full bg-slate-700/25 blur-3xl"
      />

      {/* Brand Header */}
      <div className="relative mb-6 border-b border-white/[0.08] px-2 pb-4 pt-1">
        <h1 className="max-w-[230px] text-[15px] font-semibold leading-[1.25] tracking-[-0.02em] text-slate-100">
          Laxmi Electronics
          <br />
          &amp; Furnitures
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Owner: <span className="font-medium text-slate-300">Suraj Menariya</span>
        </p>
      </div>

      {/* Navigation Groups */}
      <nav
        aria-label="Primary navigation"
        className="relative min-h-0 flex-1 space-y-5 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-0.5"
      >
        {navigation.map((group) => {
          // Filter items based on isOwner permission
          const visibleItems = group.items.filter((item) => !item.ownerOnly || isOwner);
          if (visibleItems.length === 0) return null;

          return (
            <section key={group.label} aria-label={group.label}>
              <h2 className="mb-2 px-3 text-[9px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                {group.label}
              </h2>
              <div className="space-y-1">
                {visibleItems.map(({ label, icon: Icon, href }) => {
                  const selected = activePage === label;
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => handleSelect(label)}
                      className={`group relative flex min-h-10 w-full items-center gap-3 overflow-hidden rounded-xl px-3 text-left text-[12px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-slate-300/70 ${
                        selected ? "text-white" : "text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      {selected ? (
                        <motion.span
                          layoutId="sidebar-active-indicator"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl border border-white/[0.055] bg-[#283041] shadow-[0_7px_20px_rgba(0,0,0,0.14)]"
                          transition={{ type: "spring", stiffness: 430, damping: 36, mass: 0.8 }}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.045]"
                        />
                      )}
                      <Icon
                        aria-hidden="true"
                        size={16}
                        strokeWidth={selected ? 1.9 : 1.7}
                        className={`relative z-10 shrink-0 transition-colors duration-200 ${
                          selected ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      />
                      <span className="relative z-10 truncate">{label}</span>
                      {selected && (
                        <motion.span
                          aria-hidden="true"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-[#D8DCE3] shadow-[0_0_9px_rgba(216,220,227,0.65)]"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      {/* User / Profile Footer */}
      <div className="relative mt-auto shrink-0 border-t border-white/[0.08] pt-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#697487] to-[#303A4A] text-[11px] font-semibold text-white shadow-lg">
            SM
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-medium text-slate-100">Suraj Menariya</div>
            <div className="mt-0.5 truncate text-[10px] text-slate-500">
              {isOwner ? "Owner" : "Staff"}
            </div>
          </div>
          <span aria-hidden="true" className="text-[14px] text-slate-500">
            ···
          </span>
        </div>
      </div>
    </aside>
  );
}
