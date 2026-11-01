"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOwner: boolean;
}

export default function Sidebar({ isOwner }: SidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Billing", href: "/billing" },
    { name: "Billing History", href: "/billing/history" },
    { name: "Advance Bookings", href: "/bookings" },
    { name: "Booking History", href: "/bookings/history" },
    { name: "Due Payments", href: "/due-payments" },
    { name: "Finance", href: "/finance" },
    { name: "Purchases", href: "/purchases" },
    { name: "Inventory", href: "/inventory" },
  ];

  const ownerLinks = [
    { name: "Analytics", href: "/analytics" },
    { name: "Staff Management", href: "/staff-management" },
  ];

  const renderLink = (link: { name: string; href: string }) => {
    // Check if the current pathname matches the link's href.
    // Ensure parent /billing and /bookings stay highlighted for subpaths (like /bookings/new),
    // while preventing collision with their dedicated /history routes.
    const isActive = 
      link.href === "/billing" 
        ? pathname.startsWith("/billing") && !pathname.startsWith("/billing/history")
        : link.href === "/bookings"
        ? pathname.startsWith("/bookings") && !pathname.startsWith("/bookings/history")
        : pathname.startsWith(link.href);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={`block px-4 py-2 rounded-md font-medium transition-colors ${
          isActive 
            ? "bg-blue-100 text-blue-700" 
            : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
        }`}
      >
        {link.name}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:flex flex-col z-10">
      <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-black leading-tight">Laxmi Electronics & Furnitures</h1>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">Owner: Lalit Menariya</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navLinks.map(renderLink)}
        {isOwner && ownerLinks.map(renderLink)}
      </nav>
    </aside>
  );
}
