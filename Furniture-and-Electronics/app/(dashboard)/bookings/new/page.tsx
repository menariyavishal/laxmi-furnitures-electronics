"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { createBooking } from "@/lib/api/booking";
import CustomerDetailsStep from "@/components/dashboard/bookings/new/CustomerDetailsStep";
import ProductPicker from "@/components/dashboard/bookings/new/ProductPicker";
import PackageItemsTable, { PackageItem } from "@/components/dashboard/bookings/new/PackageItemsTable";
import AdvancePaymentCard from "@/components/dashboard/bookings/new/AdvancePaymentCard";

export default function NewBookingPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    eventDate: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [items, setItems] = useState<PackageItem[]>([]);
  const [attachedPhotos, setAttachedPhotos] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFormFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (item: PackageItem) => {
    setItems((prev) => {
      // If product already in list, increment quantity
      const existingIdx = prev.findIndex(
        (i) => i.productId === item.productId && i.department === item.department
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleUpdateItemConfig = (
    index: number,
    config: { customPrice?: number; customisations?: string }
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...config };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Effective price: customised selling price if set, else catalog price (MRP)
  const getItemEffectivePrice = (item: PackageItem) => {
    return item.customPrice !== undefined && item.customPrice > 0
      ? item.customPrice
      : item.sellingPrice;
  };

  // Calculations: Total package estimate is calculated on the basis of customised selling price
  const totalEstimatedAmount = items.reduce(
    (sum, item) => sum + getItemEffectivePrice(item) * item.quantity,
    0
  );

  const hasFurniture = items.some((i) => i.department === "FURNITURE");
  const hasElectronics = items.some((i) => i.department === "ELECTRONICS");
  const hasOutOfStockFurniture = items.some(
    (i) => i.department === "FURNITURE" && i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock)
  );

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!formData.customerName.trim()) {
      setErrorMessage("Please enter customer name.");
      return;
    }
    if (!formData.customerPhone || formData.customerPhone.trim().length !== 10) {
      setErrorMessage("Please enter a valid 10-digit customer phone number.");
      return;
    }
    if (!formData.expectedDeliveryDate) {
      setErrorMessage("Please select target delivery date.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Please add at least one product to this package order.");
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        eventDate: formData.eventDate || undefined,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        totalEstimatedAmount,
        advancePaid,
        discount,
        notes: formData.notes || undefined,
        items: items.map((i) => {
          const effectivePrice = getItemEffectivePrice(i);
          return {
            productId: i.productId,
            department: i.department,
            quantity: i.quantity,
            mrp: i.sellingPrice, // Catalog price acts as MRP
            unitPrice: effectivePrice, // Customised selling price (or MRP if not bargained)
            lineTotal: effectivePrice * i.quantity,
            customisations: i.customisations?.trim() || undefined,
          };
        }),
      });

      router.push("/bookings");
    } catch (err: any) {
      console.error("Booking error:", err);
      setErrorMessage(err.message || "Failed to create advance booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/bookings"
          className="p-2 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          title="Back to bookings"
        >
          <FaArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Advance Bookings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Book furniture and electronics for events, functions, and scheduled deliveries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Details & Product Picker & Item Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Customer Details */}
          <CustomerDetailsStep
            formData={formData}
            onChange={handleFormFieldChange}
          />

          {/* Step 2: Product Picker */}
          <ProductPicker onAddItem={handleAddItem} />

          {/* Step 3: Selected Package Items Table */}
          <PackageItemsTable
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateItemConfig={handleUpdateItemConfig}
            onRemoveItem={handleRemoveItem}
            attachedPhotos={attachedPhotos}
            onPhotosChange={setAttachedPhotos}
          />
        </div>

        {/* Right Column: Financial Summary & Submit */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <AdvancePaymentCard
            totalEstimatedAmount={totalEstimatedAmount}
            advancePaid={advancePaid}
            onAdvanceChange={setAdvancePaid}
            discount={discount}
            onDiscountChange={setDiscount}
            submitting={submitting}
            onSubmit={handleSubmit}
            errorMessage={errorMessage}
            hasFurniture={hasFurniture}
            hasElectronics={hasElectronics}
            hasOutOfStockFurniture={hasOutOfStockFurniture}
          />
        </div>
      </div>
    </div>
  );
}
