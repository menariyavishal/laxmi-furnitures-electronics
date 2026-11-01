import React from "react";
import { BookingResponse } from "@/types/booking";
import { FaCamera } from "react-icons/fa";

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

  // Check actual delivery date from delivery records if present
  const deliveredRecord = booking.deliveries?.find((d) => d.actualDelivery);
  const formattedDeliveredDate = deliveredRecord?.actualDelivery
    ? new Date(deliveredRecord.actualDelivery).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : formattedDeliveryDate;

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

  const hasFurniture = (booking.bookingItems || []).some(
    (i) => (i.department || "FURNITURE").toUpperCase() === "FURNITURE"
  );
  const hasElectronics = (booking.bookingItems || []).some(
    (i) => (i.department || "").toUpperCase() === "ELECTRONICS"
  );

  return (
    <div
      style={{
        width: "740px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      }}
      className="p-8 space-y-5 bg-white text-gray-900"
    >
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
          Laxmi Electronics & Furnitures
        </h1>
        <p className="text-xs text-gray-600 font-medium mt-0.5">
          Complete Wedding Packages, Electronics & Home Furnishings
        </p>
        <p className="text-xs text-gray-500">Main Market, Kanore | Phone: +91 63755 91682</p>
        {isDelivered ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Delivered Package Order Slip
          </div>
        ) : (
          <div className="mt-2.5 inline-block bg-blue-50 text-blue-900 px-3.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-blue-200">
            Advance Package Order Slip
          </div>
        )}
      </div>

      {/* Booking Meta Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
        <div>
          <p className="text-gray-500 text-[11px]">Booking Reference:</p>
          <p className="font-black text-gray-900 text-sm font-mono">{booking.bookingNumber}</p>
          <p className="text-gray-500 text-[11px] mt-1.5">Booking Date:</p>
          <p className="font-bold text-gray-800">{formattedBookingDate}</p>
        </div>
        <div>
          {isDelivered ? (
            <>
              <p className="text-gray-500 text-[11px]">Delivery Status:</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ DELIVERED
                </span>
                <span className="text-gray-700 font-bold text-xs">{formattedDeliveredDate}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-[11px]">Target Delivery Date:</p>
              <p className="font-extrabold text-blue-900 text-sm flex items-center gap-1.5 mt-0.5">
                <span>🚚</span>
                <span>{formattedDeliveryDate}</span>
              </p>
            </>
          )}
          {formattedEventDate && (
            <>
              <p className="text-gray-500 text-[11px] mt-1.5">Event Date:</p>
              <p className="font-bold text-gray-800">{formattedEventDate}</p>
            </>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="text-xs border-b border-gray-200 pb-2.5">
        <h3 className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">
          Customer Details
        </h3>
        <div className="flex justify-between items-baseline">
          <span className="font-extrabold text-sm text-gray-900">
            {booking.customer?.name || "Customer"}
          </span>
          <span className="font-mono text-gray-700 font-semibold">
            {booking.customer?.phone || "—"}
          </span>
        </div>
        {booking.customer?.address && (
          <p className="text-gray-600 mt-0.5">{booking.customer.address}</p>
        )}
      </div>

      {/* Reserved Items Table */}
      <div>
        <h3 className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1.5">
          Reserved Package Items ({(booking.bookingItems || []).length})
        </h3>
        <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-1.5 px-3 text-left">Item Description</th>
              <th className="py-1.5 px-3 text-center">Dept</th>
              <th className="py-1.5 px-3 text-center">Qty</th>
              <th className="py-1.5 px-3 text-right">Rate</th>
              <th className="py-1.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(booking.bookingItems || []).map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-1.5 px-3 text-left">
                  <div className="font-semibold text-gray-900">
                    {item.product?.name || "Package Item"}
                  </div>
                  {item.customisations && (
                    <div className="text-[10px] text-gray-500 font-normal italic mt-0.5 whitespace-pre-line leading-tight">
                      {item.customisations}
                    </div>
                  )}
                </td>
                <td className="py-1.5 px-3 text-center">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100">
                    {item.department === "ELECTRONICS" ? "ELEC" : "FURN"}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-center font-bold">{item.quantity}</td>
                <td className="py-1.5 px-3 text-right">
                  ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                </td>
                <td className="py-1.5 px-3 text-right font-bold">
                  ₹{Number(item.lineTotal).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financials & Invoices Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
        {/* Linked Invoices */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5">
          <h4 className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">
            Linked Tax Invoices
          </h4>
          <div className="text-[11px] space-y-1">
            <div>
              <span className="text-gray-500">Furniture Bill: </span>
              {hasFurniture ? (
                <span className="font-bold text-emerald-800">
                  {furnitureBill ? furnitureBill.billNumber : "Pending Generation"}
                </span>
              ) : (
                <span className="font-bold text-gray-400">— (Not in Package)</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Electronics Bill(s): </span>
              {!hasElectronics ? (
                <span className="font-bold text-gray-400">— (Not in Package)</span>
              ) : electronicsBills.length > 0 ? (
                <span className="font-bold text-purple-800">
                  {electronicsBills.map((b) => b.billNumber).join(", ")}
                </span>
              ) : isDelivered ? (
                <span className="font-bold text-emerald-700">Fulfilled on Delivery</span>
              ) : (
                <span className="font-bold text-amber-800">Pending Delivery</span>
              )}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 space-y-1 text-right">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Package Value:</span>
            <span className="font-bold text-gray-900">
              ₹{(itemsTotal > 0 ? itemsTotal : total).toLocaleString("en-IN")}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Discount Applied:</span>
              <span>-₹{discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-gray-700 font-semibold border-t border-blue-100 pt-0.5">
              <span>Net Order Total:</span>
              <span className="font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-emerald-700">
            <span className="font-semibold">Advance Received:</span>
            <span className="font-bold">₹{advance.toLocaleString("en-IN")}</span>
          </div>
          <div className="border-t border-blue-200 pt-1 flex justify-between text-xs sm:text-sm">
            <span className="font-extrabold text-gray-900">
              {isDelivered ? "Balance Remaining:" : "Balance Due on Delivery:"}
            </span>
            <span
              className={`font-extrabold ${
                balance <= 0 ? "text-emerald-700" : "text-blue-950"
              }`}
            >
              {balance <= 0 ? "₹0 (Fully Settled)" : `₹${balance.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>
      </div>

      {/* Delivered Verification Seal / Stamp */}
      {isDelivered && (
        <div className="border border-emerald-300 bg-emerald-50/70 rounded-xl px-4 py-2.5 flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              ✓
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Order Delivered & Fulfilled
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Package items inspected and handed over to customer.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-200 text-emerald-900 border border-emerald-300">
            Status: Completed
          </span>
        </div>
      )}

      {/* Attached Design References Section */}
      {designPhotos && designPhotos.length > 0 && (
        <div className="pt-2 border-t border-dashed border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <FaCamera className="w-3 h-3 text-blue-600" />
              Attached Design References ({designPhotos.length})
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {designPhotos.map((url, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shadow-2xs aspect-video"
              >
                <img
                  src={url}
                  alt={`Design ${idx + 1}`}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures & Footer */}
      <div className="pt-6 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
        <div>
          <p className="font-bold text-gray-700">Customer Signature</p>
          <div className="w-32 border-b border-gray-400 mt-5" />
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-700">For Laxmi Electronics & Furnitures</p>
          <div className="w-40 border-b border-gray-400 mt-5 ml-auto" />
        </div>
      </div>
    </div>
  );
}
