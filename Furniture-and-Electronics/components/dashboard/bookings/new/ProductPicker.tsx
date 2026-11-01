"use client";

import React, { useState, useEffect } from "react";
import { getProducts, getCategories } from "@/lib/api/inventory";
import { FaCouch, FaTv, FaSearch, FaPlus, FaCheck } from "react-icons/fa";

interface ProductPickerProps {
  onAddItem: (item: {
    productId: number;
    name: string;
    brand: string | null;
    department: "FURNITURE" | "ELECTRONICS";
    warrantyMonths: number | null;
    sellingPrice: number;
    quantity: number;
    stock: number;
  }) => void;
}

export default function ProductPicker({ onAddItem }: ProductPickerProps) {
  const [selectedDept, setSelectedDept] = useState<"FURNITURE" | "ELECTRONICS">("FURNITURE");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Fetch categories when department changes
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await getCategories(selectedDept);
        setCategories(cats || []);
        setSelectedCategory("");
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, [selectedDept]);

  // Fetch initial page of products when department, category, or search changes
  useEffect(() => {
    const fetchProds = async () => {
      setLoading(true);
      setPage(1);
      setSelectedProduct(null);
      setQuantity(1);
      try {
        const catId = selectedCategory ? parseInt(selectedCategory) : undefined;
        const res = await getProducts(catId, search, undefined, 1, 20, undefined, undefined, selectedDept);
        const items = Array.isArray(res) ? res : res?.items || [];
        const more = res?.hasMore !== undefined ? res.hasMore : items.length === 20;
        setProducts(items);
        setHasMore(more);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProds, 200);
    return () => clearTimeout(timer);
  }, [selectedDept, selectedCategory, search]);

  // Infinite scroll loader: fetches next lot of 20 items when scrolled to the bottom
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (hasMore && !loading && !loadingMore) {
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
          const catId = selectedCategory ? parseInt(selectedCategory) : undefined;
          const res = await getProducts(catId, search, undefined, nextPage, 20, undefined, undefined, selectedDept);
          const newItems = Array.isArray(res) ? res : res?.items || [];
          const more = res?.hasMore !== undefined ? res.hasMore : newItems.length === 20;

          if (newItems.length > 0) {
            setProducts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const uniqueNew = newItems.filter((p: any) => !existingIds.has(p.id));
              return [...prev, ...uniqueNew];
            });
            setPage(nextPage);
          }
          setHasMore(more);
        } catch (err) {
          console.error("Failed to load more products:", err);
        } finally {
          setLoadingMore(false);
        }
      }
    }
  };

  // Toggle selection on re-click
  const handleSelectProduct = (prod: any) => {
    if (selectedProduct?.id === prod.id) {
      // Unselect if re-clicked
      setSelectedProduct(null);
      setQuantity(1);
    } else {
      setSelectedProduct(prod);
      setQuantity(1);
    }
  };

  // Decrement: if count drops to 0, unselect the product
  const handleDecrement = () => {
    if (quantity <= 1) {
      setSelectedProduct(null);
      setQuantity(1);
    } else {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAdd = () => {
    if (!selectedProduct) return;

    const currentStock = Number(selectedProduct.stock ?? selectedProduct.quantityInStock ?? 0);

    onAddItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      brand: selectedProduct.brand || null,
      department: selectedDept,
      warrantyMonths: selectedProduct.warrantyMonths || (selectedDept === "ELECTRONICS" ? 12 : null),
      sellingPrice: Number(selectedProduct.sellingPrice),
      quantity,
      stock: currentStock,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 1200);
    setSelectedProduct(null);
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 space-y-5">
      <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaPlus className="text-blue-600 w-3.5 h-3.5" />
            Select Products for Package
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Switch between Furniture and Electronics showroom items to add them.
          </p>
        </div>

        {/* Department Switcher Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedDept("FURNITURE");
              setSelectedProduct(null);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              selectedDept === "FURNITURE"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaCouch className="w-3.5 h-3.5" />
            <span>Furniture</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDept("ELECTRONICS");
              setSelectedProduct(null);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              selectedDept === "ELECTRONICS"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaTv className="w-3.5 h-3.5" />
            <span>Electronics</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Category & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All {selectedDept === "FURNITURE" ? "Furniture" : "Electronics"} Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Search Item
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder={`Search ${selectedDept.toLowerCase()} name or model...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Product Grid / List with Infinite Scroll */}
      <div
        onScroll={handleScroll}
        className="border border-gray-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100"
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading showroom products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No products found in {selectedDept}.
          </div>
        ) : (
          <>
            {products.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-sm ${
                    isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.brand && (
                        <span className="text-xs font-normal text-gray-500">({p.brand})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {(p.stock ?? p.quantityInStock ?? 0) <= 0 ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1">
                          <span>⚠️</span> 0 in Showroom
                        </span>
                      ) : (
                        <span>Stock: {p.stock ?? p.quantityInStock ?? 0}</span>
                      )}
                      {p.warrantyMonths && (
                        <span className="text-purple-600 font-medium">
                          🛡️ {p.warrantyMonths} Mo. Warranty
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      ₹{Number(p.sellingPrice).toLocaleString("en-IN")}
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-0.5">
                        <FaCheck className="w-2.5 h-2.5" /> Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {loadingMore && (
              <div className="p-3 text-center text-xs text-blue-600 font-semibold bg-blue-50/50 flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Loading more items...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Item Action Bar */}
      {selectedProduct && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Selected:
            </span>
            <p className="text-sm font-bold text-blue-950 mt-0.5">
              {selectedProduct.name} — ₹{Number(selectedProduct.sellingPrice).toLocaleString("en-IN")}
            </p>
            {Number(selectedProduct.stock ?? selectedProduct.quantityInStock ?? 0) <= 0 ? (
              <p className="text-[11px] font-semibold text-amber-800 mt-1 flex items-center gap-1.5">
                <span>⚠️ Note:</span> Currently 0 in showroom. Item will be booked on backorder.
              </p>
            ) : quantity > Number(selectedProduct.stock ?? selectedProduct.quantityInStock ?? 0) ? (
              <p className="text-[11px] font-semibold text-amber-800 mt-1 flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <span>⚠️ Note:</span> Only {selectedProduct.stock ?? selectedProduct.quantityInStock} in showroom stock ({quantity} requested). Remaining {quantity - Number(selectedProduct.stock ?? selectedProduct.quantityInStock)} units will be booked on backorder.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
              <button
                type="button"
                onClick={handleDecrement}
                title={quantity <= 1 ? "Drop to 0 to deselect" : "Decrease quantity"}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-bold transition-colors"
              >
                -
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-gray-800 min-w-8 text-center select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FaPlus className="w-3 h-3" />
              <span>Add to Package</span>
            </button>
          </div>
        </div>
      )}

      {addedNotice && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
          <FaCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Item successfully added to the booking package!</span>
        </div>
      )}
    </div>
  );
}
