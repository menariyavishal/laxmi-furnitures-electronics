"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaWhatsapp,
  FaMoneyBillWave,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import DuePaymentsLoading from "./loading";

export default function DuePaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { department } = useDepartment();

  const { data: rawDues, error: swrError, mutate: mutateDues } = useSWR(
    `/api/v1/due-payments?search=${encodeURIComponent(debouncedSearch)}&department=${department || "ALL"}`,
    fetcher,
    { dedupingInterval: 500 }
  );

  const dues = (rawDues || []).filter((bill: any) => {
    if (!department || department === "ALL") return true;
    const dept = (bill.department || "").toUpperCase();
    const billNo = (bill.billNumber || "").toUpperCase();
    if (department === "FURNITURE") {
      return dept.includes("FURN") || billNo.includes("FURN");
    }
    if (department === "ELECTRONICS") {
      return dept.includes("ELEC") || billNo.includes("ELEC");
    }
    return true;
  });
  const loading = !rawDues && !swrError;
  const error = swrError ? "Failed to fetch due payments" : "";

  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);

  // Multi-stage installment payment modal state
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectPaymentMode, setCollectPaymentMode] = useState<string>("CASH");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenPaymentModal = (bill: any) => {
    setSelectedBillForPayment(bill);
    const due = parseFloat(bill.dueAmount || 0);
    setCollectAmount(due > 0 ? due.toFixed(0) : "");
    setCollectPaymentMode("CASH");
    setPaymentNotes("");
    setPaymentError("");
  };

  const handleClosePaymentModal = () => {
    if (settlingId) return;
    setSelectedBillForPayment(null);
    setPaymentError("");
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPayment) return;

    const currentDue = parseFloat(selectedBillForPayment.dueAmount || 0);
    const payingAmount = parseFloat(collectAmount);

    if (isNaN(payingAmount) || payingAmount <= 0) {
      setPaymentError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (payingAmount > currentDue + 0.01) {
      setPaymentError(`Payment cannot exceed outstanding due of ₹${currentDue.toLocaleString("en-IN")}.`);
      return;
    }

    const billId = selectedBillForPayment.id;
    try {
      setSettlingId(billId);
      setPaymentError("");

      const res = await fetch(`/api/v1/due-payments/${billId}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: payingAmount,
          paymentMode: collectPaymentMode,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      const isFullyPaid = data.isFullyPaid;
      const updatedBillData = data.bill;
      const collectedAmount = data.collectedAmount;

      if (isFullyPaid) {
        // Remove from list since it's fully settled
        mutateDues(
          (current: any) => (current || []).filter((d: any) => d.id !== billId),
          false
        );
        showToast(`🎉 Bill #${selectedBillForPayment.billNumber} has been fully settled!`);
      } else {
        // Update in-place with new paid and due balances
        mutateDues(
          (current: any) =>
            (current || []).map((d: any) =>
              d.id === billId
                ? {
                    ...d,
                    paidAmount: updatedBillData.paidAmount,
                    dueAmount: updatedBillData.dueAmount,
                    paymentStatus: updatedBillData.paymentStatus,
                  }
                : d
            ),
          false
        );
        showToast(
          `✓ Received ₹${collectedAmount.toLocaleString("en-IN")}. Remaining Due: ₹${Number(
            updatedBillData.dueAmount
          ).toLocaleString("en-IN")}`
        );
      }

      handleClosePaymentModal();

      // Dispatch WhatsApp receipt automatically if customer has a valid phone
      const customerPhone =
        selectedBillForPayment.customer?.phone || selectedBillForPayment.customerPhone;
      if (customerPhone) {
        try {
          const fullBill = {
            ...selectedBillForPayment,
            paidAmount: updatedBillData.paidAmount,
            dueAmount: updatedBillData.dueAmount,
            paymentStatus: updatedBillData.paymentStatus,
            isSettled: isFullyPaid,
          };

          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const blob = await generateBillPdfBlob(fullBill);

          const formData = new FormData();
          formData.append("file", blob, `Laxmi_Invoice_${fullBill.billNumber}.pdf`);
          formData.append(
            "customerName",
            fullBill.customer?.name || "Customer"
          );
          formData.append("mobileNumber", customerPhone);
          formData.append("billNumber", fullBill.billNumber);

          const { formatDuePaymentMessage } = await import("@/lib/whatsapp/templates");
          const receiptMsg = formatDuePaymentMessage({
            customerName: fullBill.customer?.name || "Customer",
            billNumber: fullBill.billNumber,
            installmentAmount: collectedAmount,
            paymentMode: "Cash / UPI",
            paymentDate: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            totalAmount: Number(fullBill.totalAmount),
            paidAmount: Number(updatedBillData.paidAmount),
            dueAmount: Number(updatedBillData.dueAmount),
            isFullyPaid,
          });

          formData.append("customMessage", receiptMsg);

          await fetch(`/api/v1/bills/${fullBill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          });
        } catch (e) {
          console.error("Failed to send WhatsApp payment receipt:", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || "Failed to process payment. Please try again.");
    } finally {
      setSettlingId(null);
    }
  };

  const calculateDaysPassed = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSendWhatsapp = async (bill: any) => {
    const customerPhone = bill.customer?.phone || bill.customerPhone || "";
    if (!customerPhone) {
      alert("No customer phone number attached to this bill.");
      return;
    }
    try {
      setSendingWhatsappId(bill.id);
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(bill);

      const formData = new FormData();
      formData.append("file", blob, `Laxmi_Invoice_${bill.billNumber}.pdf`);
      formData.append("customerName", bill.customer?.name || "Customer");
      formData.append("mobileNumber", customerPhone);
      formData.append("billNumber", bill.billNumber);

      const reminderMsg = `🔔 *Payment Due Reminder*\n\nHello ${
        bill.customer?.name || "Customer"
      },\nThis is a gentle reminder regarding the outstanding balance for Invoice #${
        bill.billNumber
      }.\n\n*Total Amount:* ₹${Number(bill.totalAmount).toLocaleString(
        "en-IN"
      )}\n*Paid so far:* ₹${Number(bill.paidAmount).toLocaleString(
        "en-IN"
      )}\n*Pending Due:* ₹${Number(bill.dueAmount).toLocaleString(
        "en-IN"
      )}\n\nPlease arrange the payment at your earliest convenience.\n\n*Laxmi Electronics & Furnitures*\nPhone: +91 63755 91682`;

      formData.append("customMessage", reminderMsg);

      const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to send WhatsApp message");
      } else {
        showToast("WhatsApp reminder sent successfully!");
      }
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      alert(err.message || "Failed to send WhatsApp message");
    } finally {
      setSendingWhatsappId(null);
    }
  };

  if (dues.length === 0 && loading) {
    return <DuePaymentsLoading />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-slide-up">
          <FaCheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Due Payments</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage stage payments, installment receipts, and balance dues
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by Bill No, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Bill No
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-red-500 uppercase tracking-wider">
                  Due Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Remind
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 font-medium">Loading dues...</span>
                    </div>
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No pending due payments found.
                  </td>
                </tr>
              ) : (
                dues.map((bill: any) => {
                  const daysPassed = calculateDaysPassed(bill.createdAt);
                  const isOverdue = daysPassed >= 15;
                  const isUnpaid = (bill.paymentStatus || "").toUpperCase() === "UNPAID";

                  return (
                    <tr key={bill.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/billing/${bill.id}`}
                          className="text-sm font-black text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{bill.billNumber}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {(bill.department || "FURNITURE").slice(0, 4)}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              isUnpaid
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isUnpaid ? "UNPAID" : "PARTIAL"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                        {isOverdue ? (
                          <div className="text-[10px] text-red-600 font-bold mt-0.5 bg-red-100 px-1.5 py-0.5 rounded inline-block">
                            Overdue ({daysPassed} days)
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {daysPassed} days ago
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {bill.customer?.name || "Guest"}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {bill.customer?.phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        ₹{parseFloat(bill.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-emerald-700">
                        ₹{parseFloat(bill.paidAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-red-600 bg-red-50/30">
                        ₹{parseFloat(bill.dueAmount).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(bill)}
                          disabled={settlingId === bill.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs hover:shadow disabled:opacity-50"
                          title="Collect Payment / Installment"
                        >
                          <FaMoneyBillWave className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-3">
                          {bill.customer?.phone ? (
                            <button
                              onClick={() => handleSendWhatsapp(bill)}
                              disabled={sendingWhatsappId === bill.id}
                              className="text-gray-400 hover:text-green-600 bg-gray-100 hover:bg-green-50 p-2 rounded-full transition disabled:opacity-50"
                              title="Send WhatsApp Reminder with Invoice PDF"
                            >
                              {sendingWhatsappId === bill.id ? (
                                <div className="animate-spin h-[1.1rem] w-[1.1rem] border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                              ) : (
                                <FaWhatsapp className="text-[1.1rem]" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">No Phone</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Due Payment Modal */}
      {selectedBillForPayment && (
        <div
          onClick={handleClosePaymentModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <FaMoneyBillWave className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Collect Due Payment</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Bill #{selectedBillForPayment.billNumber} • {selectedBillForPayment.customer?.name || "Customer"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={Boolean(settlingId)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {/* Bill Financial Summary Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total Bill</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                    ₹{Number(selectedBillForPayment.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Already Paid</p>
                  <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
                    ₹{Number(selectedBillForPayment.paidAmount).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-red-50/80 rounded-lg py-1 border border-red-200">
                  <p className="text-[10px] font-black text-red-600 uppercase">Current Due</p>
                  <p className="text-sm font-black text-red-700 mt-0.5">
                    ₹{Number(selectedBillForPayment.dueAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Amount to Collect Input */}
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Payment Amount to Collect (₹) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCollectAmount(
                        parseFloat(selectedBillForPayment.dueAmount || 0).toFixed(0)
                      )
                    }
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Pay Full (₹{Number(selectedBillForPayment.dueAmount).toLocaleString("en-IN")})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={parseFloat(selectedBillForPayment.dueAmount || 0)}
                    step="any"
                    value={collectAmount}
                    onChange={(e) => {
                      setCollectAmount(e.target.value);
                      setPaymentError("");
                    }}
                    required
                    placeholder="Enter collected amount"
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl font-mono text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["CASH", "UPI", "CARD", "NET_BANKING"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCollectPaymentMode(mode)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        collectPaymentMode === mode
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {mode.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Reference */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Notes / Ref <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. UPI Ref #, Cheque No, Received in cash"
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Balance Preview */}
              {(() => {
                const paying = parseFloat(collectAmount) || 0;
                const currentDue = parseFloat(selectedBillForPayment.dueAmount || 0);
                const currentPaid = parseFloat(selectedBillForPayment.paidAmount || 0);
                const newPaid = currentPaid + paying;
                const newRemainingDue = Math.max(0, currentDue - paying);
                const isFull = newRemainingDue === 0 && paying > 0;

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isFull
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                        : paying > 0
                        ? "bg-amber-50/70 border-amber-300 text-amber-900"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <div className="flex justify-between font-medium">
                      <span>After this payment:</span>
                      <span className="font-bold">
                        {isFull ? (
                          <span className="text-emerald-700 font-extrabold">
                            ✓ Fully Settled
                          </span>
                        ) : (
                          <span className="text-amber-800 font-extrabold">
                            🟡 Partial Installment
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-gray-200/60">
                      <span>New Total Paid: ₹{newPaid.toLocaleString("en-IN")}</span>
                      <span className="font-black">
                        Remaining Due: ₹{newRemainingDue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {paymentError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-200">
                  <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  disabled={Boolean(settlingId)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(settlingId)}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow disabled:opacity-50"
                >
                  {settlingId ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
