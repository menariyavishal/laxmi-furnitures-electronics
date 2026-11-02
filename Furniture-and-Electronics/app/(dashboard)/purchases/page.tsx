"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import { Purchase, Vendor, PurchaseKPIs } from "@/types/purchase";
import { getPurchases, getVendors, deletePurchase } from "@/lib/api/purchase";
import PurchaseKPICards from "@/components/dashboard/purchases/PurchaseKPICards";
import PurchaseFilters from "@/components/dashboard/purchases/PurchaseFilters";
import PurchaseTable from "@/components/dashboard/purchases/PurchaseTable";
import NewPurchaseModal from "@/components/dashboard/purchases/NewPurchaseModal";
import PayInstallmentModal from "@/components/dashboard/purchases/PayInstallmentModal";
import VendorManagementModal from "@/components/dashboard/purchases/VendorManagementModal";
import PurchaseDetailModal from "@/components/dashboard/purchases/PurchaseDetailModal";
import ReceiveStockModal from "@/components/dashboard/purchases/ReceiveStockModal";

export default function PurchasesPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const { department: activeDept } = useDepartment();

  // Search & Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PENDING_DUE" | "PAID"
  const [selectedVendorId, setSelectedVendorId] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modals State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isVendorManagerOpen, setIsVendorManagerOpen] = useState(false);
  const [selectedPayPurchase, setSelectedPayPurchase] = useState<Purchase | null>(null);
  const [selectedDetailPurchase, setSelectedDetailPurchase] = useState<Purchase | null>(null);
  const [selectedReceiveStockPurchase, setSelectedReceiveStockPurchase] = useState<Purchase | null>(null);

  // 1. SWR Caching for Vendors List
  const { data: vendorsData, mutate: mutateVendors } = useSWR<Vendor[]>(
    "/api/v1/vendors",
    () => getVendors(),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const vendors = vendorsData || [];

  // 2. SWR Caching for Purchases Data & KPIs
  const purchasesCacheKey = [
    "purchases",
    debouncedSearch,
    activeDept,
    selectedVendorId,
    statusFilter,
    page,
  ];

  const {
    data: purchasesResponse,
    isLoading,
    mutate: mutatePurchases,
  } = useSWR(
    purchasesCacheKey,
    () =>
      getPurchases({
        search: debouncedSearch,
        department: activeDept === "ALL" ? undefined : activeDept,
        vendorId: selectedVendorId === "ALL" ? undefined : selectedVendorId,
        paymentStatus: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: 20,
      }),
    {
      keepPreviousData: true,
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const purchases = purchasesResponse?.items || [];
  const totalPages = purchasesResponse?.totalPages || 1;
  const kpis: PurchaseKPIs = purchasesResponse?.kpis || {
    totalPurchasesCount: 0,
    totalPurchaseAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    unpaidPurchasesCount: 0,
  };
  const loading = isLoading;

  // Refresh cache on any mutation
  const refreshAll = () => {
    mutatePurchases();
    mutateVendors();
  };

  // Handle Delete Purchase
  const handleDeletePurchase = async (purchase: Purchase) => {
    if (
      !confirm(
        `Are you sure you want to delete purchase #${purchase.purchaseNumber} from ${purchase.vendor.name}? If stock was added, it will be automatically rolled back.`
      )
    ) {
      return;
    }

    try {
      await deletePurchase(purchase.id);
      refreshAll();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete purchase.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Purchases & Vendor Settlements
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Track wholesale procurements, manage supplier accounts payable, and settle installments.
        </p>
      </div>

      {/* KPI Cards */}
      <PurchaseKPICards kpis={kpis} loading={loading} />

      {/* Filters & Actions Bar */}
      <PurchaseFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        selectedVendorId={selectedVendorId}
        onVendorChange={(val) => {
          setSelectedVendorId(val);
          setPage(1);
        }}
        vendors={vendors}
        onOpenNewPurchase={() => setIsNewPurchaseOpen(true)}
        onOpenVendorManager={() => setIsVendorManagerOpen(true)}
      />

      {/* Purchases Data Table */}
      <PurchaseTable
        purchases={purchases}
        loading={loading}
        onPayInstallment={(p) => setSelectedPayPurchase(p)}
        onViewDetails={(p) => setSelectedDetailPurchase(p)}
        onDeletePurchase={handleDeletePurchase}
        onReceiveStock={(p) => setSelectedReceiveStockPurchase(p)}
        isOwner={isOwner}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#6E6862] bg-[#F5F2ED]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#E5DFD7] shadow-sm">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewPurchaseModal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        onSuccess={refreshAll}
        vendors={vendors}
        initialDepartment={activeDept === "ELECTRONICS" ? "ELECTRONICS" : "FURNITURE"}
      />

      <PayInstallmentModal
        isOpen={Boolean(selectedPayPurchase)}
        onClose={() => setSelectedPayPurchase(null)}
        onSuccess={refreshAll}
        purchase={selectedPayPurchase}
      />

      <VendorManagementModal
        isOpen={isVendorManagerOpen}
        onClose={() => setIsVendorManagerOpen(false)}
        onVendorsUpdated={refreshAll}
        vendors={vendors}
        isOwner={isOwner}
      />

      <PurchaseDetailModal
        isOpen={Boolean(selectedDetailPurchase)}
        onClose={() => setSelectedDetailPurchase(null)}
        purchase={selectedDetailPurchase}
        onPayInstallment={(p) => setSelectedPayPurchase(p)}
        onReceiveStock={(p) => setSelectedReceiveStockPurchase(p)}
      />

      <ReceiveStockModal
        isOpen={Boolean(selectedReceiveStockPurchase)}
        onClose={() => setSelectedReceiveStockPurchase(null)}
        onSuccess={refreshAll}
        purchase={selectedReceiveStockPurchase}
      />
    </div>
  );
}

