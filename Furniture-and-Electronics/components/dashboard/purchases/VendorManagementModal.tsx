"use client";

import React, { useState } from "react";
import { FaTimes, FaUsers, FaPlus, FaTrash, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { Vendor } from "@/types/purchase";
import { createVendor, deleteVendor } from "@/lib/api/purchase";

interface VendorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorsUpdated: () => void;
  vendors: Vendor[];
  isOwner?: boolean;
}

export default function VendorManagementModal({
  isOpen,
  onClose,
  onVendorsUpdated,
  vendors,
  isOwner,
}: VendorManagementModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vendor name is required.");
      return;
    }
    if (!phone.trim() || phone.trim().length !== 10) {
      setError("A valid 10-digit phone number is required.");
      return;
    }

    try {
      setSubmitting(true);
      await createVendor({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        gstin: gstin.trim() || undefined,
      });

      setName("");
      setPhone("");
      setAddress("");
      setGstin("");
      setShowAddForm(false);
      onVendorsUpdated();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add vendor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    if (vendor.totalDue && vendor.totalDue > 0) {
      alert(`Cannot delete vendor "${vendor.name}". They have an outstanding due balance of ₹${vendor.totalDue.toLocaleString("en-IN")}. Settle all balances first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete vendor "${vendor.name}"?`)) {
      return;
    }

    try {
      setDeletingId(vendor.id);
      await deleteVendor(vendor.id);
      onVendorsUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete vendor.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FaUsers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Vendor & Supplier Directory</h3>
              <p className="text-xs text-gray-500">Manage parties, view purchase counts, and track total payables.</p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Bar: Add Vendor Button */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Registered Vendors ({vendors.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <FaPlus className="w-3 h-3" />
              <span>{showAddForm ? "Close Form" : "+ Add New Vendor"}</span>
            </button>
          </div>

          {/* Add Vendor Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase">New Supplier Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Supplier / Firm Name *"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs bg-white"
                />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit Phone Number *"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Address / Town (Optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="GSTIN (Optional)"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs bg-white font-mono uppercase"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          )}

          {/* Vendors List Table */}
          {vendors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No vendors registered yet. Click "+ Add New Vendor" above.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Total Purchased</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map((v) => {
                    const due = v.totalDue || 0;
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        {/* Name & Address */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-gray-900">{v.name}</div>
                          {v.address && (
                            <div className="text-[10.5px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <FaMapMarkerAlt className="w-2.5 h-2.5 text-gray-400" />
                              <span className="truncate max-w-[180px]">{v.address}</span>
                            </div>
                          )}
                          {v.gstin && (
                            <div className="text-[9.5px] text-gray-400 font-mono">
                              GST: {v.gstin}
                            </div>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-gray-700 font-semibold flex items-center gap-1">
                            <FaPhone className="w-2.5 h-2.5 text-gray-400" />
                            {v.phone}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {v._count?.purchases || 0} bills
                          </span>
                        </td>

                        {/* Total Purchased */}
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-800">
                          ₹ {(v.totalPurchased || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Paid */}
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                          ₹ {(v.totalPaid || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Outstanding Due */}
                        <td className="py-2.5 px-3 text-right">
                          {due > 0 ? (
                            <span className="font-black text-red-600 font-mono">
                              ₹ {due.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">₹ 0</span>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="py-2.5 px-3 text-center">
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(v)}
                              disabled={deletingId === v.id || due > 0}
                              className={`p-1.5 rounded transition ${
                                due > 0
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={
                                due > 0
                                  ? "Cannot delete vendor with outstanding balance"
                                  : "Delete vendor"
                              }
                            >
                              <FaTrash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

