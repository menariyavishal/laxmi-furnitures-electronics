"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getProducts, getCategories, updateProduct, deleteProduct, createCategory, quickSell } from "@/lib/api/inventory";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import useSWRInfinite from "swr/infinite";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import CategorySelector from "@/components/dashboard/CategorySelector";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import InventoryLoading from "./loading";
import { Modal } from "@/components/ui/modal";

export default function InventoryPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { department, config: deptConfig } = useDepartment();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [quickSellData, setQuickSellData] = useState<Record<number, string>>({});
  const [quickSellingId, setQuickSellingId] = useState<number | null>(null);
  const [expandedImeiId, setExpandedImeiId] = useState<number | null>(null);
  const [expandedImeis, setExpandedImeis] = useState<any[]>([]);
  const [isLoadingImeis, setIsLoadingImeis] = useState(false);

  const handleExpandImeis = async (productId: number) => {
    if (expandedImeiId === productId) {
      setExpandedImeiId(null);
      return;
    }
    setExpandedImeiId(productId);
    setIsLoadingImeis(true);
    setExpandedImeis([]);
    try {
      const res = await fetch(`/api/v1/products/${productId}`);
      const data = await res.json();
      setExpandedImeis(data.units || []);
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoadingImeis(false);
    }
  };

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return ['products', selectedCategory, debouncedSearch, department, pageIndex + 1, reloadTrigger];
  };

  const { data, size, setSize, isValidating, error: swrError, mutate: mutateProducts } = useSWRInfinite(
    getKey,
    ([_, cat, search, dept, p]: [string, number | undefined, string, string, number]) =>
      getProducts(cat, search, undefined, p, 50, undefined, undefined, dept),
    { dedupingInterval: 2000, revalidateFirstPage: true, revalidateOnFocus: true, refreshInterval: 15000 }
  );

  const products: any[] = data ? [].concat(...data.map((d: any) => Array.isArray(d) ? d : d.items || [])) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : true;
  const loading = !data && !swrError;
  const error = swrError ? "Failed to load products" : "";

  // Edit modal states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "",
    imageUrl: "",
    barcode: "",
  });
  const [editImageSourceType, setEditImageSourceType] = useState<"file" | "url">("file");
  const [editFileInputKey, setEditFileInputKey] = useState(Date.now());
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [isFetchingAPI, setIsFetchingAPI] = useState(false);

  // Category Selector states are fully encapsulated in CategorySelector component

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isValidating) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setSize(size + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isValidating, hasMore, size, setSize]);

  // Fetch categories filtered by active department and reset page size
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    setSize(1);
    setSelectedCategory(undefined);
    getCategories(department).then(setCategories).catch(console.error);
  }, [department, setSize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.imei-dropdown-container')) {
        setExpandedImeiId(null);
      }
    };
    
    if (expandedImeiId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedImeiId]);

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = false) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      return;
    }
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if (allowDecimal && e.key === ".") {
      if (e.currentTarget.value.includes(".")) {
        e.preventDefault();
      }
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleTextOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      e.preventDefault();
    }
  };

  // loadData function replaced by loadProducts useEffect

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      brand: product.brand || "",
      categoryId: product.categoryId.toString(),
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      imageUrl: product.imageUrl || "",
      barcode: product.barcode || "",
    });
    setEditImageSourceType(product.imageUrl?.startsWith("data:") ? "file" : "url");
    setEditError("");
  };

  const handleCreateCategory = async (name: string, parentCategoryId?: number) => {
    try {
      const cat = await createCategory({ name, parentCategoryId });
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (err) {
      setEditError("Failed to create category");
      throw err;
    }
  };

  const handleDeleteClick = async (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        mutateProducts();
        setReloadTrigger(prev => prev + 1);
      } catch (err: any) {
        alert(err.message || "Failed to delete product");
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError("");

    const threshold = parseInt(editFormData.lowStockThreshold) || 0;
    if (threshold <= 0) {
      setEditError("Low Stock Threshold must be a positive number.");
      setSavingEdit(false);
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        name: editFormData.name,
        brand: editFormData.brand,
        categoryId: parseInt(editFormData.categoryId),
        costPrice: parseFloat(editFormData.costPrice),
        sellingPrice: parseFloat(editFormData.sellingPrice),
        lowStockThreshold: threshold,
        imageUrl: editFormData.imageUrl || null,
        barcode: editFormData.barcode || null,
      });
      setSavingEdit(false);
      setEditingProduct(null);
      mutateProducts();
      setReloadTrigger(prev => prev + 1);
      alert("Product information updated successfully!");
    } catch (err: any) {
      console.error("Update error:", err);
      setEditError(err.message || "Failed to update product");
      setSavingEdit(false);
    }
  };

  const handleQuickSell = async (product: any) => {
    const qtyStr = quickSellData[product.id];
    if (!qtyStr) return;
    
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    
    if (qty > product.quantityInStock) {
      alert(`Cannot sell ${qty}. Only ${product.quantityInStock} in stock.`);
      return;
    }

    setQuickSellingId(product.id);
    try {
      await quickSell(product.id, qty);
      // Clear input
      setQuickSellData(prev => ({ ...prev, [product.id]: "" }));
      // Reload data to reflect new stock
      mutateProducts();
      setReloadTrigger(prev => prev + 1);
      alert(`Item sold successfully! Remaining stock: ${product.quantityInStock - qty}`);
    } catch (err: any) {
      alert(err.message || "Failed to process quick sell.");
    } finally {
      setQuickSellingId(null);
    }
  };

  const isAccessoriesSelected = (() => {
    if (!selectedCategory) return false;
    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) return false;
    
    if (cat.name.toLowerCase() === "accessories") return true;
    
    if (cat.parentCategoryId) {
      const parent = categories.find((c) => c.id === cat.parentCategoryId);
      if (parent && parent.name.toLowerCase() === "accessories") return true;
    }
    
    return false;
  })();

  if (products.length === 0 && loading) {
    return <InventoryLoading />;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-black">Inventory</h2>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${deptConfig.badgeBg} ${deptConfig.badgeText}`}>
            {department === "FURNITURE" ? (
              <img src="/furniture-logo-icon.png" alt="Furniture" className="w-3.5 h-3.5 object-contain inline-block shrink-0" />
            ) : (
              <span>{deptConfig.icon}</span>
            )}
            <span>{deptConfig.label}</span>
          </span>
        </div>
        {role === "owner" && (
          <div className="flex gap-3">
            <Link
              href="/inventory/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold shadow-sm"
            >
              + Add Product
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 border border-gray-300 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-72">
          <CategorySelector
            categories={categories}
            selectedCategoryId={selectedCategory?.toString() || ""}
            onChange={(catId) => setSelectedCategory(catId ? Number(catId) : undefined)}
            showAllOption={true}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                {role === "owner" && (
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                {role === "owner" && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product, index) => {
                const isLast = products.length === index + 1;
                return (
                <tr key={product.id} ref={isLast ? lastElementRef : null}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.brand && <div className="text-sm text-gray-500">{product.brand}</div>}
                        {(product.productType === 'serialized' || product.productType === 'electronics') && product.quantityInStock > 0 && (
                          <div className="mt-1.5 relative imei-dropdown-container">
                            <button 
                              onClick={() => handleExpandImeis(product.id)}
                              className="flex items-center justify-between w-[170px] px-1 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-700 transition-colors"
                            >
                              <span className="truncate mr-2">
                                {product.productType === "electronics" ? "View SNs" : "View IMEIs"}
                              </span>
                              <span className="text-[9px] text-slate-400 bg-slate-200 px-1 rounded-sm">
                                {product.quantityInStock}
                              </span>
                            </button>
                            {expandedImeiId === product.id && (
                              <div className="mt-1 w-[160px] max-h-32 overflow-y-auto border border-slate-200 rounded bg-white shadow-sm absolute z-10">
                                {isLoadingImeis ? (
                                  <div className="px-2 py-2 text-[11px] text-center text-slate-500">Loading...</div>
                                ) : expandedImeis.length > 0 ? (
                                  expandedImeis.map((unit: any) => (
                                    <div key={unit.id} className="px-2 py-1 text-[11px] font-mono text-slate-600 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                      {unit.imeiNumber}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-2 py-2 text-[11px] text-center text-slate-500">No units found</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category?.name}
                  </td>
                  {role === "owner" && (
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.costPrice}
                     </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{product.sellingPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 inline-flex w-fit text-xs leading-5 font-semibold rounded-full ${
                        product.quantityInStock <= product.lowStockThreshold 
                          ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]" 
                          : "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      }`}>
                        {product.quantityInStock}
                      </span>
                    </div>
                  </td>
                  {role === "owner" && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {isAccessoriesSelected && (product.category?.name?.toLowerCase() === "accessories" || product.category?.parentCategory?.name?.toLowerCase() === "accessories") && (
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-1 transition-all duration-200 shadow-sm mr-3">
                          <input
                            type="number"
                            min="1"
                            max={product.quantityInStock}
                            placeholder="Qty"
                            className="w-14 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center transition-all"
                            value={quickSellData[product.id] || ""}
                            onChange={(e) => setQuickSellData(prev => ({ ...prev, [product.id]: e.target.value }))}
                            onKeyDown={(e) => {
                               if (e.key === "Enter") handleQuickSell(product);
                            }}
                            disabled={quickSellingId === product.id}
                          />
                          <button
                            onClick={() => handleQuickSell(product)}
                            disabled={quickSellingId === product.id || !quickSellData[product.id]}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1 rounded-md text-xs transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm shadow-blue-500/10 cursor-pointer"
                            title="Quick Sell (Press Enter)"
                          >
                            {quickSellingId === product.id ? (
                              <FaSpinner className="animate-spin w-3 h-3" />
                            ) : (
                              "Sell"
                            )}
                          </button>
                        </div>
                      )}
                      <Link
                        href={`/inventory/${product.id}/stock`}
                        className="inline-block text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors text-xs font-bold"
                      >
                        + Stock
                      </Link>
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors text-xs font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              )})}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={role === "owner" ? 6 : 4} className="px-6 py-4 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      {isValidating && products.length > 0 && (
        <div className="p-6 flex justify-center items-center">
          <FaSpinner className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Edit Product Modal */}
      <Modal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        className="bg-[#F7F5F0] rounded-2xl max-w-4xl w-full h-[85vh] min-h-[600px] p-8 shadow-2xl flex flex-col overflow-hidden border border-[#E5DFD7]"
      >
            <div className="flex justify-between items-center mb-6 border-b pb-3 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">Edit Product Details</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="mb-4 text-red-600 bg-red-50 p-3 rounded border border-red-100 text-sm font-semibold flex-shrink-0">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6 flex flex-col justify-between">
              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Product Name</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Brand</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.brand}
                      onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <CategorySelector
                    categories={categories}
                    selectedCategoryId={editFormData.categoryId}
                    onChange={(catId) => setEditFormData({ ...editFormData, categoryId: catId })}
                    onAddCategory={handleCreateCategory}
                  />
                </div>

                

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.costPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
                      onKeyDown={(e) => handleNumberKeyDown(e, true)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.sellingPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                      onKeyDown={(e) => handleNumberKeyDown(e, true)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Low Stock Threshold</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5"
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.lowStockThreshold}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, "");
                      setEditFormData({ ...editFormData, lowStockThreshold: cleanValue });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-white border border-gray-300 rounded-md py-2 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-blue-600 border border-transparent rounded-md py-2 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 font-bold"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
