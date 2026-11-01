"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaChevronDown, FaBoxes, FaTimes, FaShieldAlt } from "react-icons/fa";
import { Department } from "@/types/purchase";
import { getProducts } from "@/lib/api/inventory";

interface CatalogProductPickerProps {
  selectedProductId: number | null | undefined;
  selectedProductName?: string;
  department: Department;
  onSelectProduct: (product: any | null) => void;
  disabled?: boolean;
}

export default function CatalogProductPicker({
  selectedProductId,
  selectedProductName,
  department,
  onSelectProduct,
  disabled = false,
}: CatalogProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch max 20 products with search query
  const loadProducts = useCallback(
    async (queryTerm: string) => {
      try {
        setLoading(true);
        const res = await getProducts(
          undefined,
          queryTerm.trim() || undefined,
          undefined,
          1,
          20, // Strict limit: 20 at a time
          undefined,
          undefined,
          department
        );
        setProducts(res.items || []);
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      } finally {
        setLoading(false);
      }
    },
    [department]
  );

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadProducts(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, isOpen, loadProducts]);

  // Handle open dropdown & focus search input
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearch("");
      loadProducts("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (product: any | null) => {
    onSelectProduct(product);
    setIsOpen(false);
    setSearch("");
  };

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null;

  const displayTitle = selectedProductName
    ? selectedProductName
    : selectedProduct
    ? `${selectedProduct.name} ${selectedProduct.brand ? `(${selectedProduct.brand})` : ""}`
    : "-- Custom / New Item --";

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        title={displayTitle}
        className="w-full py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 text-left flex items-center justify-between hover:border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
      >
        <span className="truncate font-medium">
          {selectedProductId ? (
            <span className="text-gray-900 font-bold">{displayTitle}</span>
          ) : (
            <span className="text-gray-500 italic">-- Custom / New Item --</span>
          )}
        </span>
        <FaChevronDown className="w-3 h-3 text-gray-400 shrink-0 ml-1.5" />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in flex flex-col max-h-72">
          {/* Inline Keyword Search Input */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70">
            <div className="relative">
              <FaSearch className="w-3 h-3 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog by name or brand..."
                className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 text-xs">
            {/* Top Option: Custom / New Item */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full text-left px-3 py-2 hover:bg-blue-50/60 flex items-center justify-between transition ${
                !selectedProductId ? "bg-blue-50 font-bold text-blue-700" : "text-gray-700"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-blue-600 font-bold text-xs">✨</span>
                <span>-- Custom / New Item --</span>
              </div>
              <span className="text-[10.5px] text-gray-400 font-normal">Reset fields</span>
            </button>

            {/* Loading Indicator */}
            {loading && (
              <div className="py-4 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Searching catalog (top 20)...
              </div>
            )}

            {/* Loaded Products (Max 20) */}
            {!loading && products.length === 0 && search && (
              <div className="py-4 text-center text-gray-400 text-xs">
                No catalog items match &quot;{search}&quot;
              </div>
            )}

            {!loading &&
              products.map((p) => {
                const isSelected = selectedProductId === p.id;
                const cost = Number(p.costPrice) || 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    title={`${p.name} ${p.brand ? `(${p.brand})` : ""}`}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50/50 flex flex-col gap-0.5 transition ${
                      isSelected ? "bg-blue-50 border-l-3 border-blue-600" : ""
                    }`}
                  >
                    <div className="font-bold text-gray-900 truncate">
                      {p.name}
                      {p.brand && (
                        <span className="ml-1 text-[10.5px] text-gray-500 font-normal">
                          ({p.brand})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <FaBoxes className="w-2.5 h-2.5" /> Stock: {p.quantityInStock}
                      </span>
                      <span>&bull;</span>
                      <span>Cost: ₹{cost.toLocaleString("en-IN")}</span>
                      {p.warrantyMonths ? (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-0.5 text-purple-700 font-semibold">
                            <FaShieldAlt className="w-2.5 h-2.5" /> {p.warrantyMonths}M
                          </span>
                        </>
                      ) : null}
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Footer note: Showing 20 at a time */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
            <span>Showing up to 20 results</span>
            {search && <span>Filtered by &quot;{search}&quot;</span>}
          </div>
        </div>
      )}
    </div>
  );
}

