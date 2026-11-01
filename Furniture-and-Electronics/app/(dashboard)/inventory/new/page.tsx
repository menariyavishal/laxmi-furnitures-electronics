"use client";

import { useState, useEffect, useCallback } from "react";
import { getCategories, createCategory, createProduct } from "@/lib/api/inventory";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CategorySelector from "@/components/dashboard/CategorySelector";


import { useDepartment } from "@/components/dashboard/department/DepartmentContext";

export default function NewProductPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { department: activeDept } = useDepartment();
  
  const [selectedDept, setSelectedDept] = useState<"FURNITURE" | "ELECTRONICS">(
    activeDept === "ELECTRONICS" ? "ELECTRONICS" : "FURNITURE"
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    productType: "quantity",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "2",
    initialQuantity: "",
    imeis: "",
    imageUrl: "",
    barcode: "",
    warrantyMonths: "12",
  });

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, categoryId: "" }));
    loadCategories(selectedDept);
  }, [selectedDept]);

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

  const loadCategories = async (dept = selectedDept) => {
    try {
      const cats = await getCategories(dept);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (name: string, parentCategoryId?: number) => {
    try {
      const cat = await createCategory({ name, parentCategoryId, department: selectedDept });
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (err) {
      setError("Failed to create category");
      throw err;
    }
  };
      
  const handleThresholdChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, ""); // Remove all non-digits
    setFormData({ ...formData, lowStockThreshold: cleanValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const threshold = parseInt(formData.lowStockThreshold) || 0;
    if (threshold <= 0) {
      setError("Low Stock Threshold must be a positive number.");
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        categoryId: formData.categoryId,
        department: selectedDept,
        name: formData.name,
        brand: formData.brand,
        productType: formData.productType,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        lowStockThreshold: threshold,
        warrantyMonths: selectedDept === "ELECTRONICS" ? parseInt(formData.warrantyMonths || "12") : null,
        initialQuantity: formData.productType === "quantity" ? parseInt(formData.initialQuantity) || 0 : 0,
        imeis: (formData.productType === "serialized" || formData.productType === "electronics")
          ? formData.imeis.split(",").map(i => i.trim()).filter(Boolean)
          : [],
        imageUrl: formData.imageUrl || undefined,
        barcode: formData.barcode || undefined,
      };

      await createProduct(payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      setLoading(false);
    }
  };

  if (authLoading || role !== "owner") return null;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 font-sans text-black border-b pb-3">Add New Product</h2>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded border border-red-100 font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Showroom Division Selector */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-800 mb-2">Showroom Division</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedDept("FURNITURE")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm border transition ${
                selectedDept === "FURNITURE"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">🪑</span> Furniture
            </button>
            <button
              type="button"
              onClick={() => setSelectedDept("ELECTRONICS")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm border transition ${
                selectedDept === "ELECTRONICS"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">⚡</span> Electronics
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedDept === "FURNITURE"
              ? "Beds, Sofas, Dining Tables, Wardrobes, Dressing Tables, etc."
              : "Appliances, TVs, Refrigerators, ACs, Washing Machines with warranty tracking."}
          </p>
        </div>

        {selectedDept === "ELECTRONICS" && (
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-bold text-blue-900">Manufacturer Warranty (Months)</label>
                <p className="text-xs text-blue-700 mt-0.5">
                  Warranty clock begins on the delivery/invoice date.
                </p>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 sm:text-sm bg-white font-bold"
                  value={formData.warrantyMonths}
                  onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                  placeholder="12"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Product Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Brand</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
            <CategorySelector
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onChange={(catId) => setFormData({ ...formData, categoryId: catId })}
              onAddCategory={handleCreateCategory}
            />
          </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">Product Type</label>
          <select
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
          >
            <option value="quantity">Quantity Based (e.g. Chargers, Cables)</option>
            <option value="serialized">Serialized (e.g. Mobile Phones with IMEIs)</option>
            <option value="electronics">Electronics (with S M No.)</option>
          </select>
        </div>

        

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Cost Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
        </div>

        {/* Initial Stock Setup Field */}
        <div className="border-t pt-4 mt-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Initial Stock Setup</h3>
          {formData.productType === "quantity" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                onKeyDown={(e) => handleNumberKeyDown(e, false)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {formData.productType === "electronics"
                    ? "Initial S M Numbers (Comma Separated)"
                    : "Initial IMEIs (Comma Separated)"}
                </label>
                <textarea
                  placeholder={
                    formData.productType === "electronics"
                      ? "e.g. SN1000234, SN1000235"
                      : "e.g. 866365081122723, 866365081122724"
                  }
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.imeis}
                  onChange={(e) => setFormData({ ...formData, imeis: e.target.value })}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {formData.productType === "electronics"
                    ? "Separate multiple S M Numbers with commas. The initial stock will count the number of entered S M Numbers."
                    : "Separate multiple IMEI numbers with commas. The initial stock will count the number of entered IMEIs."}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">Low Stock Threshold</label>
          <input
            type="text"
            required
            placeholder="e.g. 5"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.lowStockThreshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
