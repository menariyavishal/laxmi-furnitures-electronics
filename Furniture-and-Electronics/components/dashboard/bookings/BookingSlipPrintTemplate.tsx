import React from "react";
import { BookingResponse } from "@/types/booking";

interface BookingSlipPrintTemplateProps {
  booking: BookingResponse;
  designPhotos?: string[];
}

export default function BookingSlipPrintTemplate({
  booking,
  designPhotos = [],
}: BookingSlipPrintTemplateProps) {
  const formattedBookingDate = new Date(booking.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedEventDate = booking.eventDate
    ? new Date(booking.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const formattedDeliveryDate = new Date(booking.expectedDeliveryDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isDelivered = booking.status === "COMPLETED";

  const itemsTotal = (booking.bookingItems || []).reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  const total = Number(booking.totalEstimatedAmount);
  const match = booking.notes?.match(/Discount:\s*₹?([0-9,.]+)/i);
  const parsedDiscount = match ? parseFloat(match[1].replace(/,/g, "")) : 0;
  const discount = parsedDiscount > 0 ? parsedDiscount : Math.max(0, itemsTotal - total);
  const advance = Number(booking.advancePaid);
  const balance = Number(booking.remainingBalance);

  const furnitureBill = booking.bills?.find((b) => b.department === "FURNITURE");
  const electronicsBills = booking.bills?.filter((b) => b.department === "ELECTRONICS") || [];

  const hasFurniture = booking.bookingItems?.some((i) => i.department === "FURNITURE");
  const hasElectronics = booking.bookingItems?.some((i) => i.department === "ELECTRONICS");

  // Clean notes from internal [DESIGNS] tags
  const cleanNotes = booking.notes
    ? booking.notes.replace(/\[DESIGNS\]:\[.*?\]/g, "").replace(/\(Discount:.*?\)/g, "").trim()
    : "";

  return (
    <div
      style={{
        width: "740px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: "12px",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #2563eb", paddingBottom: "12px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#1e3a8a", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Laxmi Electronics & Furnitures
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#4b5563" }}>
            Main Market, Kanore, Udaipur (Raj.) • Helpline: +91 99282 03203
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "inline-block", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", color: "#1e3a8a" }}>
            {booking.bookingNumber}
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#6b7280" }}>
            Booked on: {formattedBookingDate}
          </p>
        </div>
      </div>

      {/* Target Delivery & Customer Information */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", marginBottom: "4px" }}>
            Customer Details
          </div>
          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#111827" }}>
            {booking.customer?.name || "Customer"}
          </div>
          <div style={{ fontSize: "11px", color: "#374151", marginTop: "2px" }}>
            📞 {booking.customer?.phone || "—"}
          </div>
          {booking.customer?.address && (
            <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>
              📍 {booking.customer.address}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "8px", padding: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: "bold", color: "#1e40af", textTransform: "uppercase", marginBottom: "4px" }}>
            Delivery Schedule
          </div>
          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e3a8a" }}>
            🚚 Target Delivery: {formattedDeliveryDate}
          </div>
          {formattedEventDate && (
            <div style={{ fontSize: "11px", color: "#1e40af", marginTop: "2px" }}>
              🎉 Event Date: {formattedEventDate}
            </div>
          )}
          <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>
            Order Status: <strong>{isDelivered ? "Delivered & Completed" : "Confirmed Booking"}</strong>
          </div>
        </div>
      </div>

      {/* Reserved Package Items Table */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "bold", color: "#4b5563", textTransform: "uppercase", marginBottom: "6px" }}>
          Reserved Package Items ({booking.bookingItems?.length || 0})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", fontSize: "11px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>#</th>
              <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Item Description</th>
              <th style={{ padding: "6px 8px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Dept</th>
              <th style={{ padding: "6px 8px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Qty</th>
              <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>Rate (₹)</th>
              <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>Line Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(booking.bookingItems || []).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "6px 8px", color: "#6b7280" }}>{idx + 1}</td>
                <td style={{ padding: "6px 8px" }}>
                  <div style={{ fontWeight: "bold", color: "#111827" }}>{item.product?.name || "Product"}</div>
                  {item.customisations && (
                    <div style={{ fontSize: "10px", color: "#4b5563", fontStyle: "italic", marginTop: "2px" }}>
                      Specs: {item.customisations}
                    </div>
                  )}
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: "bold", padding: "2px 5px", borderRadius: "4px", backgroundColor: item.department === "ELECTRONICS" ? "#f3e8ff" : "#fef3c7", color: item.department === "ELECTRONICS" ? "#6b21a8" : "#92400e" }}>
                    {item.department === "ELECTRONICS" ? "ELEC" : "FURN"}
                  </span>
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>{item.quantity}</td>
                <td style={{ padding: "6px 8px", textAlign: "right" }}>
                  {Number(item.unitPrice).toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                  {Number(item.lineTotal).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Invoices */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", marginBottom: "4px" }}>
            Linked Tax Invoices
          </div>
          <div style={{ fontSize: "11px", marginBottom: "4px" }}>
            Furniture Invoice:{" "}
            {hasFurniture ? (
              <strong style={{ color: "#065f46" }}>{furnitureBill ? furnitureBill.billNumber : "Generated on Booking"}</strong>
            ) : (
              <span style={{ color: "#9ca3af" }}>—</span>
            )}
          </div>
          <div style={{ fontSize: "11px" }}>
            Electronics Invoice(s):{" "}
            {hasElectronics ? (
              electronicsBills.length > 0 ? (
                <strong style={{ color: "#581c87" }}>{electronicsBills.map((b) => b.billNumber).join(", ")}</strong>
              ) : (
                <span style={{ color: "#92400e" }}>Generated on Delivery</span>
              )
            ) : (
              <span style={{ color: "#9ca3af" }}>—</span>
            )}
          </div>
          {cleanNotes && (
            <div style={{ marginTop: "8px", fontSize: "10px", color: "#4b5563" }}>
              <strong>Notes:</strong> {cleanNotes}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
            <span style={{ color: "#4b5563" }}>Total Package Value:</span>
            <strong>₹{(itemsTotal > 0 ? itemsTotal : total).toLocaleString("en-IN")}</strong>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px", color: "#e11d48" }}>
              <span>Package Discount:</span>
              <span>-₹{discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px", color: "#047857" }}>
            <span>Advance Received:</span>
            <strong>₹{advance.toLocaleString("en-IN")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #bfdbfe", paddingTop: "4px", marginTop: "4px", fontSize: "13px", fontWeight: "900", color: balance <= 0 ? "#047857" : "#1e3a8a" }}>
            <span>{isDelivered ? "Balance Remaining:" : "Balance Due on Delivery:"}</span>
            <span>{balance <= 0 ? "₹0 (Fully Settled)" : `₹${balance.toLocaleString("en-IN")}`}</span>
          </div>
        </div>
      </div>

      {/* Embedded Attached Design References Section */}
      {designPhotos && designPhotos.length > 0 && (
        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "2px dashed #cbd5e1" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1e3a8a", textTransform: "uppercase", marginBottom: "8px" }}>
            📷 Attached Design References & Customization Photos ({designPhotos.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {designPhotos.map((photoUrl, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                  padding: "4px",
                  textAlign: "center",
                }}
              >
                <img
                  src={photoUrl}
                  alt={`Design ${idx + 1}`}
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    display: "block",
                  }}
                />
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", fontWeight: "bold" }}>
                  Design Spec #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", fontSize: "11px", color: "#6b7280" }}>
        <div>
          <div style={{ fontWeight: "bold", color: "#374151" }}>Customer Signature</div>
          <div style={{ width: "140px", borderBottom: "1px solid #9ca3af", marginTop: "25px" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "bold", color: "#374151" }}>For Laxmi Electronics & Furnitures</div>
          <div style={{ width: "160px", borderBottom: "1px solid #9ca3af", marginTop: "25px", marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}

