"use client";

import React, { useState } from "react";
import {
  FaTrash,
  FaCouch,
  FaTv,
  FaBoxes,
  FaShieldAlt,
  FaSlidersH,
  FaCamera,
  FaTimes,
  FaCheck,
  FaTag,
} from "react-icons/fa";

export interface PackageItem {
  productId: number;
  name: string;
  brand: string | null;
  department: "FURNITURE" | "ELECTRONICS";
  warrantyMonths: number | null;
  sellingPrice: number; // Catalog selling price (acts as MRP)
  customPrice?: number; // Customised selling price (optional)
  customisations?: string; // Specifications/customisations (optional)
  quantity: number;
  stock?: number;
}

interface PackageItemsTableProps {
  items: PackageItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onUpdateItemConfig: (
    index: number,
    config: { customPrice?: number; customisations?: string }
  ) => void;
  onRemoveItem: (index: number) => void;
  attachedPhotos?: Array<{ id: string; url: string; name: string; file?: File }>;
  onPhotosChange?: (photos: Array<{ id: string; url: string; name: string; file?: File }>) => void;
}

export default function PackageItemsTable({
  items,
  onUpdateQuantity,
  onUpdateItemConfig,
  onRemoveItem,
  attachedPhotos = [],
  onPhotosChange,
}: PackageItemsTableProps) {
  // Index of item currently expanded for configuration
  const [activeConfigIndex, setActiveConfigIndex] = useState<number | null>(null);

  // Handle photo attachment (desktop file selector / mobile camera & gallery) with automatic compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { compressImage } = await import("@/lib/image-compression");
    const newPhotos: Array<{ id: string; url: string; name: string; file?: File }> = [];

    for (const file of Array.from(files)) {
      const compressed = await compressImage(file, 1600, 1600, 0.82);
      const url = URL.createObjectURL(compressed);
      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url,
        name: compressed.name,
        file: compressed,
      });
    }

    if (onPhotosChange) {
      onPhotosChange([...attachedPhotos, ...newPhotos]);
    }
    // Reset file input value so re-selecting works
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    if (onPhotosChange) {
      onPhotosChange(attachedPhotos.filter((p) => p.id !== id));
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center flex flex-col items-center justify-center">
        <FaBoxes className="w-10 h-10 text-gray-300 mb-2" />
        <h3 className="text-sm font-bold text-gray-700">No items added to package yet</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          Use the product selector above to add wedding furniture (beds, sofas, almirahs) and electronics (TV, fridge, AC).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Table Header with Photo Attachment Button */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>Package Items</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </h3>

          {/* Photo / Design Attachment Button next to Package Items */}
          <label
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition border border-blue-200 shadow-2xs"
            title="Attach design photos from computer or mobile gallery"
          >
            <FaCamera className="w-3.5 h-3.5 text-blue-600" />
            <span>Attach Designs / Photos</span>
            {attachedPhotos.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {attachedPhotos.length}
              </span>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </label>
        </div>

        <span className="text-xs text-gray-500">
          * Electronics warranty is preserved until scheduled delivery
        </span>
      </div>

      {/* Attached Photos Thumbnail Preview Strip */}
      {attachedPhotos.length > 0 && (
        <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100 flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1 mr-1">
            <FaCamera className="w-3 h-3 text-blue-600" />
            Selected Designs ({attachedPhotos.length}):
          </span>
          {attachedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group w-12 h-12 rounded-lg border border-blue-200 bg-white overflow-hidden shadow-2xs flex-shrink-0"
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo.id)}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <FaTimes className="w-3 h-3 text-red-300 hover:text-red-100" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sweet Warning Notice if any item exceeds showroom stock */}
      {items.some((i) => i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock)) && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2.5 text-amber-900">
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <strong className="font-bold">Showroom Inventory Notice:</strong>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              {items
                .filter((i) => i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock))
                .map((i) => `${i.name} (Stock: ${i.stock ?? 0}, Requested: ${i.quantity})`)
                .join(", ")}{" "}
              exceeds currently available stock. Furniture bills will be registered with items on backorder.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/60">
              <th className="py-3 px-4">Item & Department</th>
              <th className="py-3 px-4">Warranty</th>
              <th className="py-3 px-4 text-right">Price (Rate)</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => {
              const effectivePrice =
                item.customPrice !== undefined && item.customPrice > 0
                  ? item.customPrice
                  : item.sellingPrice;
              const lineTotal = effectivePrice * item.quantity;
              const isFurniture = item.department === "FURNITURE";
              const isConfigOpen = activeConfigIndex === index;
              const hasCustomPrice =
                item.customPrice !== undefined && item.customPrice > 0;
              const hasCustomisations = Boolean(item.customisations?.trim());
              const isDiscounted = hasCustomPrice && item.customPrice! < item.sellingPrice;
              const discountPercent = isDiscounted
                ? (((item.sellingPrice - item.customPrice!) / item.sellingPrice) * 100).toFixed(2)
                : null;

              return (
                <React.Fragment key={`${item.productId}-${index}`}>
                  <tr className={`hover:bg-gray-50/70 transition-colors ${isConfigOpen ? "bg-blue-50/30" : ""}`}>
                    {/* Item & Department */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-md text-xs ${
                            isFurniture
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isFurniture ? <FaCouch className="w-3 h-3" /> : <FaTv className="w-3 h-3" />}
                        </span>
                        <span>{item.name}</span>
                      </div>

                      <div className="flex flex-col ml-7 mt-0.5 space-y-0.5">
                        {item.brand && (
                          <span className="text-xs text-gray-500">Brand: {item.brand}</span>
                        )}

                        {/* Customisations rendered in SMALL & GREY FONT */}
                        {hasCustomisations && (
                          <p className="text-xs text-gray-500 font-normal italic mt-0.5 whitespace-pre-line leading-relaxed">
                            {item.customisations}
                          </p>
                        )}

                        {item.stock !== undefined && item.stock <= 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded w-fit">
                            ⚠️ 0 in Showroom ({isFurniture ? "Billed on Backorder" : "Pending Restock"})
                          </span>
                        )}
                        {item.stock !== undefined && item.stock > 0 && item.quantity > item.stock && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded w-fit">
                            ⚠️ Only {item.stock} in stock ({item.quantity} requested)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Warranty */}
                    <td className="py-3 px-4">
                      {item.warrantyMonths ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <FaShieldAlt className="w-3 h-3" />
                          {item.warrantyMonths} Months
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Standard</span>
                      )}
                    </td>

                    {/* Price (Rate) with Bargain / Customised Rate indicator */}
                    <td className="py-3 px-4 text-right">
                      {hasCustomPrice ? (
                        <div>
                          <div className="font-bold text-gray-900">
                            ₹{item.customPrice!.toLocaleString("en-IN")}
                          </div>
                          {isDiscounted && (
                            <div className="flex items-center justify-end gap-1 text-[10px]">
                              <span className="line-through text-gray-400">
                                ₹{item.sellingPrice.toLocaleString("en-IN")}
                              </span>
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                {discountPercent}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium text-gray-700">
                          ₹{item.sellingPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>

                    {/* Quantity with Steppers */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      ₹{lineTotal.toLocaleString("en-IN")}
                    </td>

                    {/* Action Column: Config + Delete */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveConfigIndex(isConfigOpen ? null : index)
                          }
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                            isConfigOpen
                              ? "bg-blue-600 text-white shadow-2xs"
                              : hasCustomPrice || hasCustomisations
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                              : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                          title="Configure customisations & custom selling price"
                        >
                          <FaSlidersH className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Config</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (activeConfigIndex === index) {
                              setActiveConfigIndex(null);
                            }
                            onRemoveItem(index);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove from package"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline Configuration Drawer */}
                  {isConfigOpen && (
                    <tr className="bg-blue-50/40 border-b border-blue-100 animate-fade-in">
                      <td colSpan={6} className="p-4">
                        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <FaTag className="text-blue-600 w-3.5 h-3.5" />
                              Customise: {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveConfigIndex(null)}
                              className="text-gray-400 hover:text-gray-600 text-xs font-semibold flex items-center gap-1 p-1"
                            >
                              <FaCheck className="w-3 h-3 text-emerald-600" />
                              <span>Done</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Customised Selling Price Input */}
                            <div>
                              <div className="flex justify-between items-baseline mb-1">
                                <label className="text-xs font-bold text-gray-700">
                                  Customised Selling Price (₹)
                                </label>
                                <span className="text-[11px] text-gray-500">
                                  Catalog MRP: ₹{item.sellingPrice.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder={`Standard rate (${item.sellingPrice})`}
                                  value={item.customPrice !== undefined ? item.customPrice : ""}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    onUpdateItemConfig(index, {
                                      customPrice: val === "" ? undefined : parseFloat(val) || 0,
                                    });
                                  }}
                                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              {/* Live Discount % Preview */}
                              {hasCustomPrice && (
                                <div className="mt-1.5 text-[11px]">
                                  {isDiscounted ? (
                                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                      ✓ Customer Discount: {discountPercent}% OFF
                                      (Save ₹{(item.sellingPrice - item.customPrice!).toLocaleString("en-IN")}/unit)
                                    </span>
                                  ) : item.customPrice! > item.sellingPrice ? (
                                    <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                      * Custom rate exceeds catalog price
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 italic">
                                      Rate equal to catalog MRP (No discount)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Item Customisations / Specifications Input */}
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">
                                Item Specifications & Customisations
                              </label>
                              <textarea
                                rows={2}
                                placeholder="e.g. 3 door with dressing, 3 drawer, size - 48&quot;/78&quot;/22&quot;, royal blue fabric, teak polish"
                                value={item.customisations || ""}
                                onChange={(e) =>
                                  onUpdateItemConfig(index, {
                                    customisations: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                              />
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Appears in small grey font below item on slip & invoice.
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}