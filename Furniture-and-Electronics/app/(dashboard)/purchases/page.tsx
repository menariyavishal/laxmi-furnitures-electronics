"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import { Purchase, Vendor, PurchaseKPIs, Department } from "@/types/purchase";
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
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PENDING_DUE" | "PAID"
  const [selectedVendorId, setSelectedVendorId] = useState("ALL");
  const [page, setPage] = useState(1);

  // Data State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [kpis, setKpis] = useState<PurchaseKPIs>({
    totalPurchasesCount: 0,
    totalPurchaseAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    unpaidPurchasesCount: 0,
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isVendorManagerOpen, setIsVendorManagerOpen] = useState(false);
  const [selectedPayPurchase, setSelectedPayPurchase] = useState<Purchase | null>(null);
  const [selectedDetailPurchase, setSelectedDetailPurchase] = useState<Purchase | null>(null);
  const [selectedReceiveStockPurchase, setSelectedReceiveStockPurchase] = useState<Purchase | null>(null);

  // Fetch Vendors
  const fetchVendorsList = useCallback(async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    }
  }, []);

  // Fetch Purchases
  const fetchPurchasesList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPurchases({
        search: debouncedSearch,
        department: activeDept === "ALL" ? undefined : activeDept,
        vendorId: selectedVendorId === "ALL" ? undefined : selectedVendorId,
        paymentStatus: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: 20,
      });

      setPurchases(res.items || []);
      setTotalPages(res.totalPages || 1);
      if (res.kpis) {
        setKpis(res.kpis);
      }
    } catch (err) {
      console.error("Failed to load purchases:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeDept, selectedVendorId, statusFilter, page]);

  useEffect(() => {
    fetchVendorsList();
  }, [fetchVendorsList]);

  useEffect(() => {
    fetchPurchasesList();
  }, [fetchPurchasesList]);

  // Handle Delete Purchase
  const handleDeletePurchase = async (purchase: Purchase) => {
    if (!confirm(`Are you sure you want to delete purchase #${purchase.purchaseNumber} from ${purchase.vendor.name}? If stock was added, it will be automatically rolled back.`)) {
      return;
    }

    try {
      await deletePurchase(purchase.id);
      fetchPurchasesList();
      fetchVendorsList();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete purchase.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
        <div className="flex justify-between items-center text-xs font-semibold text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
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
        onSuccess={() => {
          fetchPurchasesList();
          fetchVendorsList();
        }}
        vendors={vendors}
        initialDepartment={activeDept === "ELECTRONICS" ? "ELECTRONICS" : "FURNITURE"}
      />

      <PayInstallmentModal
        isOpen={Boolean(selectedPayPurchase)}
        onClose={() => setSelectedPayPurchase(null)}
        onSuccess={() => {
          fetchPurchasesList();
          fetchVendorsList();
        }}
        purchase={selectedPayPurchase}
      />

      <VendorManagementModal
        isOpen={isVendorManagerOpen}
        onClose={() => setIsVendorManagerOpen(false)}
        onVendorsUpdated={() => {
          fetchVendorsList();
          fetchPurchasesList();
        }}
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
        onSuccess={() => {
          fetchPurchasesList();
          fetchVendorsList();
        }}
        purchase={selectedReceiveStockPurchase}
      />
    </div>
  );
}

