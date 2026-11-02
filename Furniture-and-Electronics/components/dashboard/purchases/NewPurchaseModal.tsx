"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { FaTimes, FaPlus, FaTrash, FaCheck, FaBuilding } from "react-icons/fa";
import { Vendor, Department, PurchasePaymentMode, PurchaseItemInput } from "@/types/purchase";
import { createPurchase } from "@/lib/api/purchase";
import { getProducts, getCategories } from "@/lib/api/inventory";
import ConfirmStockModal from "./ConfirmStockModal";
import CatalogProductPicker from "./CatalogProductPicker";

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendors: Vendor[];
  initialDepartment?: Department;
}

export default function NewPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  vendors,
  initialDepartment = "FURNITURE",
}: NewPurchaseModalProps) {
  const [department, setDepartment] = useState<Department>(initialDepartment);
  const [isNewVendor, setIsNewVendor] = useState(false);
  const [vendorId, setVendorId] = useState<string>("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");
  const [newVendorGstin, setNewVendorGstin] = useState("");

  const [vendorInvoiceNo, setVendorInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Items State
  const [items, setItems] = useState<PurchaseItemInput[]>([
    {
      itemName: "",
      quantity: 1,
      unitCostPrice: "",
      lineTotal: 0,
      warrantyMonths: initialDepartment === "ELECTRONICS" ? 12 : undefined,
    },
  ]);

  // Inventory auto-increment checkbox
  const [isStockAdded, setIsStockAdded] = useState(true);

  // Payment states - placeholder "0" instead of hardcoded 0
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PurchasePaymentMode>("CASH");
  const [transactionRef, setTransactionRef] = useState("");

  // Catalog products for quick picker / preview
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmStockModal, setShowConfirmStockModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      if (vendors.length > 0 && !vendorId) {
        setVendorId(String(vendors[0].id));
      }
    }
  }, [isOpen, department]);

  const loadCatalog = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        getProducts(undefined, undefined, undefined, 1, 50, undefined, undefined, department),
        getCategories(department),
      ]);
      setCatalogProducts(prodsRes.items || []);
      setCategories(catsRes || []);
      if (catsRes && catsRes.length > 0) {
        setItems((prev) =>
          prev.map((it) => (!it.categoryId ? { ...it, categoryId: catsRes[0].id } : it))
        );
      }
    } catch (err) {
      console.error("Failed to load catalog helper data:", err);
    }
  };

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        itemName: "",
        quantity: 1,
        unitCostPrice: "",
        lineTotal: 0,
        categoryId: categories.length > 0 ? categories[0].id : undefined,
        warrantyMonths: department === "ELECTRONICS" ? 12 : undefined,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemInput, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === "quantity" || field === "unitCostPrice") {
        const qty = parseInt(String(item.quantity)) || 0;
        const cost = parseFloat(String(item.unitCostPrice)) || 0;
        item.lineTotal = qty * cost;
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleSelectProduct = (index: number, product: any | null) => {
    setItems((prev) => {
      const updated = [...prev];
      if (!product) {
        // Reset all item details on selecting -- Custom / New Item --
        updated[index] = {
          ...updated[index],
          productId: null,
          itemName: "",
          unitCostPrice: "",
          quantity: 1,
          lineTotal: 0,
          categoryId: categories.length > 0 ? categories[0].id : undefined,
          warrantyMonths: department === "ELECTRONICS" ? 12 : undefined,
        };
      } else {
        const qty = parseInt(String(updated[index].quantity)) || 1;
        const cost = product.costPrice !== undefined ? Number(product.costPrice) : 0;
        updated[index] = {
          ...updated[index],
          productId: product.id,
          itemName: product.name,
          unitCostPrice: cost > 0 ? cost : "",
          quantity: qty,
          lineTotal: qty * cost,
          categoryId: product.categoryId || (categories.length > 0 ? categories[0].id : undefined),
          warrantyMonths: product.warrantyMonths || (department === "ELECTRONICS" ? 12 : undefined),
        };
      }
      return updated;
    });
  };

  const grandTotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const numPaid = Math.max(0, parseFloat(paidAmount) || 0);
  const remainingDue = Math.max(0, grandTotal - numPaid);

  const validateForm = () => {
    setError("");

    if (!isNewVendor && !vendorId) {
      setError("Please select a vendor.");
      return false;
    }
    if (isNewVendor) {
      if (!newVendorName.trim()) {
        setError("Vendor name is required.");
        return false;
      }
      if (!newVendorPhone.trim() || newVendorPhone.trim().length !== 10) {
        setError("Valid 10-digit vendor phone number is required.");
        return false;
      }
    }

    if (items.length === 0 || items.some((i) => !i.itemName.trim() || Number(i.quantity) <= 0)) {
      setError("Please provide a valid name and quantity for all purchase items.");
      return false;
    }

    return true;
  };

  const executeSavePurchase = async () => {
    const preparedItems = items.map((i) => ({
      ...i,
      quantity: parseInt(String(i.quantity)) || 1,
      unitCostPrice: parseFloat(String(i.unitCostPrice)) || 0,
      categoryId: i.categoryId ? parseInt(String(i.categoryId)) : undefined,
      warrantyMonths: i.warrantyMonths ? parseInt(String(i.warrantyMonths)) : undefined,
    }));

    try {
      setSubmitting(true);
      await createPurchase({
        vendorId: !isNewVendor ? parseInt(vendorId) : undefined,
        newVendor: isNewVendor
          ? {
              name: newVendorName.trim(),
              phone: newVendorPhone.trim(),
              address: newVendorAddress.trim() || undefined,
              gstin: newVendorGstin.trim() || undefined,
            }
          : undefined,
        vendorInvoiceNo: vendorInvoiceNo.trim() || undefined,
        department,
        purchaseDate,
        notes: notes.trim() || undefined,
        items: preparedItems,
        paidAmount: numPaid,
        paymentMode: numPaid > 0 ? paymentMode : undefined,
        transactionRef: transactionRef.trim() || undefined,
        isStockAdded,
      });

      setShowConfirmStockModal(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save purchase.");
      setShowConfirmStockModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isStockAdded) {
      // Show confirmation alert with itemized changes before saving
      setShowConfirmStockModal(true);
    } else {
      executeSavePurchase();
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-[#F4F3F0] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#DEDAD3] overflow-hidden"
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FaBuilding className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Record Supplier Purchase</h2>
              <p className="text-xs text-gray-500">Add purchased items, set vendor dues, and credit inventory.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Department & Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/60 rounded-xl border border-gray-200">
            {/* Dept */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs font-bold bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="FURNITURE">🛋️ Furniture Division</option>
                <option value="ELECTRONICS">⚡ Electronics Division</option>
              </select>
            </div>

            {/* Vendor Source Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Vendor / Supplier *</label>
                <button
                  type="button"
                  onClick={() => setIsNewVendor(!isNewVendor)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  {isNewVendor ? "← Select Existing Vendor" : "+ Add New Vendor"}
                </button>
              </div>

              {!isNewVendor ? (
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} ({v.phone})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Supplier / Firm Name *"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit Phone Number *"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value.replace(/\D/g, ""))}
                    className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs font-mono"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address / Town (Optional)"
                    value={newVendorAddress}
                    onChange={(e) => setNewVendorAddress(e.target.value)}
                    className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="GSTIN (Optional)"
                    value={newVendorGstin}
                    onChange={(e) => setNewVendorGstin(e.target.value.toUpperCase())}
                    className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Bill Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Supplier Bill / Challan #</label>
              <input
                type="text"
                placeholder="e.g. INV-8842 or 3042"
                value={vendorInvoiceNo}
                onChange={(e) => setVendorInvoiceNo(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Transport / Vehicle Notes</label>
              <input
                type="text"
                placeholder="e.g. Delivered via RJ27 tempo"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 3: Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100/70 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Purchase Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <FaPlus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[190px]">Catalog Link (Optional)</th>
                    <th className="py-2.5 px-3 min-w-[170px]">Item Name *</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Category *</th>
                    <th className="py-2.5 px-3 w-28">Cost/Unit (₹)</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    {department === "ELECTRONICS" && (
                      <th className="py-2.5 px-3 w-24 text-center">Warranty (Mo)</th>
                    )}
                    <th className="py-2.5 px-3 w-28 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      {/* Catalog Select using Searchable CatalogProductPicker */}
                      <td className="py-2 px-3">
                        <CatalogProductPicker
                          selectedProductId={item.productId}
                          selectedProductName={item.itemName}
                          department={department}
                          onSelectProduct={(product) => handleSelectProduct(idx, product)}
                        />
                      </td>

                      {/* Item Name with Full Hover Tooltip */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Teak Wood Double Bed"
                          title={item.itemName || "Item Name"}
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                          className="w-full py-1.5 px-2.5 border border-gray-300 rounded text-xs font-medium"
                        />
                      </td>

                      {/* Category Selection */}
                      <td className="py-2 px-3">
                        <select
                          value={item.categoryId || ""}
                          onChange={(e) => handleItemChange(idx, "categoryId", e.target.value)}
                          className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs bg-white text-gray-800 font-medium focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Category --</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Unit Cost with placeholder '0' */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0"
                          value={item.unitCostPrice}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => handleItemChange(idx, "unitCostPrice", e.target.value)}
                          className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs font-mono text-right [appearance:textfield]"
                        />
                      </td>

                      {/* Quantity with placeholder '1' */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="1"
                          value={item.quantity}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs font-bold text-center [appearance:textfield]"
                        />
                      </td>

                      {/* Electronics Warranty Section */}
                      {department === "ELECTRONICS" && (
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            placeholder="12"
                            title="Supplier warranty in months"
                            value={item.warrantyMonths !== undefined ? item.warrantyMonths : ""}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) => handleItemChange(idx, "warrantyMonths", e.target.value)}
                            className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs font-bold text-center font-mono [appearance:textfield]"
                          />
                        </td>
                      )}

                      {/* Line Total */}
                      <td className="py-2 px-3 text-right font-black text-gray-900">
                        ₹ {item.lineTotal.toLocaleString("en-IN")}
                      </td>

                      {/* Delete Row */}
                      <td className="py-2 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded"
                            title="Remove row"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Direct Inventory Sync Checkbox */}
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="stockAddedCheckbox"
              checked={isStockAdded}
              onChange={(e) => setIsStockAdded(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="stockAddedCheckbox" className="text-xs text-blue-900 cursor-pointer">
              <span className="font-bold block">✓ Add items to showroom inventory stock immediately</span>
              <span className="text-[11px] text-blue-700">
                Increments stock for linked catalog products and updates cost prices. (Uncheck only if shipment is in-transit).
              </span>
            </label>
          </div>

          {/* Section 5: Payment & Dues Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Left: Payment Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Initial Down Payment Paid Now (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  step="0.01"
                  placeholder="0"
                  value={paidAmount}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm font-black text-emerald-700 font-mono [appearance:textfield]"
                />
              </div>

              {numPaid > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as PurchasePaymentMode)}
                      className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Ref / Cheque #</label>
                    <input
                      type="text"
                      placeholder="Optional UTR / Cheque"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Net Math Summary */}
            <div className="flex flex-col justify-center space-y-2 text-xs bg-white p-3.5 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center text-gray-600 font-bold">
                <span>Total Bill Value:</span>
                <span className="font-mono text-sm text-gray-900">
                  ₹ {grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 font-bold">
                <span>Paid Now:</span>
                <span className="font-mono text-sm">
                  ₹ {numPaid.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">Remaining Balance Due to Vendor:</span>
                <span className={`font-mono text-base font-black ${remainingDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ₹ {remainingDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || grandTotal <= 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "✓ Confirm & Save Purchase"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Alert for Stock Ingestion */}
      <ConfirmStockModal
        isOpen={showConfirmStockModal}
        onClose={() => setShowConfirmStockModal(false)}
        onConfirm={executeSavePurchase}
        submitting={submitting}
        items={items}
        catalogProducts={catalogProducts}
        categories={categories}
        department={department}
      />
    </>
  );
}
