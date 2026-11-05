"use client";

import React from "react";

// Indian currency to words helper
export function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const g = ["", "Thousand", "Lakh", "Crore"];

  const count = (n: number): string => {
    let word = "";
    if (n < 20) {
      word = a[n];
    } else if (n < 100) {
      word = b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    } else {
      word = a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + count(n % 100) : "");
    }
    return word.trim();
  };

  if (!num || isNaN(num) || num === 0) return "Zero Rupees Only";

  let words = "";
  let temp = Math.floor(Math.abs(num));

  const chunks: number[] = [];
  chunks.push(temp % 1000); // hundreds/tens/ones
  temp = Math.floor(temp / 1000);
  chunks.push(temp % 100);  // thousands
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);  // lakhs
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);  // crores

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk > 0) {
      words = count(chunk) + (g[i] ? " " + g[i] : "") + (words ? " " + words : "");
    }
  }

  return (words.trim() + " Rupees").replace(/\s+/g, " ");
}

export interface InvoiceTemplateProps {
  isDraft?: boolean;
  forPrint?: boolean;
  billNumber: string;
  createdAt: string | Date;
  dueDate?: string | Date;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  cartItems: any[];
  subtotal: number;
  grossTotal?: number;
  discount?: number;
  totalAmount: number;
  sgstPercent?: string;
  cgstPercent?: string;
  paidAmount: number;
  dueAmount: number;
  paymentMode?: string;
  previousBalance?: number;
}

export default function InvoiceTemplate({
  isDraft,
  forPrint = false,
  billNumber,
  createdAt,
  dueDate,
  customerName,
  customerAddress,
  customerPhone,
  cartItems = [],
  totalAmount,
  paidAmount = 0,
  dueAmount = 0,
  previousBalance = 0,
}: InvoiceTemplateProps) {
  // Display the bill number as-is (new format: FURN-2026-0014, ELEC-2026-0014, ADB-2026-0005)
  // For legacy INV-FURN-/INV-ELEC- format, strip the leading INV- prefix
  const cleanInvoiceNo = (() => {
    if (!billNumber) return isDraft ? "DRAFT" : "—";
    if (isDraft) return "DRAFT";
    // New clean formats — show as-is
    if (/^(FURN|ELEC|ADB)-\d{4}-\d{4}$/.test(billNumber)) return billNumber;
    // Legacy INV-FURN-YYYY-XXXX → FURN-YYYY-XXXX
    if (/^INV-(FURN|ELEC)-\d{4}-\d{4}$/.test(billNumber)) return billNumber.replace(/^INV-/, "");
    // Plain numeric (direct billing page)
    if (/^\d+$/.test(billNumber)) return billNumber;
    // Fallback: show as-is
    return billNumber;
  })();

  const formattedDate = (() => {
    if (!createdAt) return "";
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  })();

  const formattedDueDate = (() => {
    if (!dueDate) return null;
    const d = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  })();

  // Determine if any item has MRP > rate to show the 6-column layout (invoice1.jpeg) vs 5-column (invoice.jpeg)
  const hasAnyMrp = cartItems.some((item: any) => {
    const rate = Number(item.unitPrice || item.product?.sellingPrice || 0);
    const mrp = Number(
      item.mrp ||
      item.product?.mrp ||
      (item.product?.sellingPrice && rate < Number(item.product.sellingPrice)
        ? item.product.sellingPrice
        : 0)
    );
    return mrp > rate && mrp > 0;
  });

  const totalQty = cartItems.reduce(
    (sum: number, item: any) => sum + (parseInt(item.quantity, 10) || 1),
    0
  );

  const finalDue = dueAmount > 0 ? dueAmount : Math.max(0, totalAmount - paidAmount);

  return (
    <div
      className="w-full bg-white text-black font-sans text-[11px] leading-tight select-none"
      style={
        forPrint
          ? { width: "720px", padding: "16px", boxSizing: "border-box" }
          : { padding: "16px 24px" }
      }
    >
      {/* 1. TOP HEADER (Outside the main border box) */}
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[12px] tracking-wide text-black uppercase">
            BILL OF SUPPLY
          </span>
          <span className="border border-black px-1.5 py-0.5 text-[9.5px] font-bold text-gray-800 tracking-wider">
            ORIGINAL
          </span>
        </div>
        <div className="text-right font-black text-[12px] text-black tracking-wide">
          ॥ श्री गणेशाय नमः ॥
        </div>
      </div>

      {/* 2. MAIN BORDER ENCLOSURE */}
      <div
        className="border border-black flex flex-col bg-white"
        style={forPrint ? { height: "990px" } : {}}
      >
        {/* SHOP BANNER HEADER */}
        <div className="border-b border-black p-3.5 flex items-center justify-between">
          {/* Logo container (Ready for user uploaded logo with clean fallback) */}
          <div className="w-20 flex items-center justify-center flex-shrink-0">
            <div className="relative w-14 h-14 rounded-full border border-black flex flex-col items-center justify-center p-1 bg-white text-center shadow-2xs">
              {/* Optional user-uploaded logo overlay */}
              <img
                src="/uploads/branding/logo.png"
                alt="Logo"
                className="absolute inset-0 w-full h-full object-contain rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-[9px] font-black text-blue-900 tracking-tight leading-none">
                LAXMI
              </span>
              <span className="text-[7px] font-bold text-gray-600 leading-none my-0.5">
                ★ ★ ★
              </span>
              <span className="text-[8px] font-black text-red-700 leading-none">
                LFE
              </span>
            </div>
          </div>

          {/* Centered Shop Info */}
          <div className="text-center flex-1 px-2">
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase">
              Laxmi Electronics & Furnitures
            </h1>
            <p className="text-[12px] text-gray-800 font-medium mt-0.5">
              Bhinder, Udaipur (Raj.)
            </p>
            <p className="text-[12px] font-bold text-black mt-0.5">
              Mobile: +91 820 939 9683
            </p>
          </div>

          {/* Right Spacer for visual balance */}
          <div className="w-20 flex-shrink-0"></div>
        </div>

        {/* CUSTOMER & INVOICE METADATA GRID */}
        <div className="border-b border-black flex">
          {/* Left: Customer Info (BILL TO) */}
          <div className="w-3/5 border-r border-black p-2.5 sm:p-3 flex flex-col justify-between min-h-[75px]">
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-700 tracking-wider">
                BILL TO
              </p>
              <p className="font-black text-black text-xs uppercase mt-0.5">
                {customerName ? (
                  customerName.toUpperCase().startsWith("MR") ? (
                    customerName
                  ) : (
                    `MR/MISS/MRS. ${customerName}`
                  )
                ) : (
                  "MR/MISS/MRS. VALUED CUSTOMER"
                )}
              </p>
            </div>
            <div className="mt-1 space-y-0.5 text-[10px] text-gray-900">
              {customerAddress && (
                <p className="font-medium leading-tight">
                  <span className="text-gray-700 font-bold">Address: </span>
                  {customerAddress}
                </p>
              )}
              {customerPhone && (
                <p className="font-semibold">
                  <span className="text-gray-700 font-bold">Mobile: </span>
                  {customerPhone}
                </p>
              )}
            </div>
          </div>

          {/* Right: Invoice No. & Date columns */}
          <div className="w-2/5 flex">
            {/* Invoice No. */}
            <div className="flex-1 border-r border-black flex flex-col">
              <div className="border-b border-black p-1 text-center font-bold text-[10px] text-gray-800">
                Invoice No.
              </div>
              <div className="flex-1 flex items-center justify-center p-2 font-mono text-sm font-black text-black">
                {cleanInvoiceNo}
              </div>
            </div>

            {/* Invoice Date */}
            <div className="flex-1 border-r last:border-r-0 border-black flex flex-col">
              <div className="border-b border-black p-1 text-center font-bold text-[10px] text-gray-800">
                Invoice Date
              </div>
              <div className="flex-1 flex items-center justify-center p-2 font-mono text-[11px] font-bold text-black">
                {formattedDate || "—"}
              </div>
            </div>

            {/* Optional Due Date (if present, matches invoice1.jpeg) */}
            {formattedDueDate && (
              <div className="flex-1 flex flex-col">
                <div className="border-b border-black p-1 text-center font-bold text-[10px] text-gray-800">
                  Due Date
                </div>
                <div className="flex-1 flex items-center justify-center p-2 font-mono text-[11px] font-bold text-black">
                  {formattedDueDate}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className={forPrint ? "flex-1 flex flex-col overflow-hidden" : "flex flex-col"}>
          <table className="w-full border-collapse text-[10px]" style={forPrint ? { height: "100%" } : {}}>
            <thead>
              <tr className="border-b border-black text-black">
                <th className="w-12 py-1.5 px-2 text-center font-extrabold uppercase border-r border-black">
                  S.NO.
                </th>
                <th className="py-1.5 px-3 text-left font-extrabold uppercase border-r border-black">
                  ITEMS
                </th>
                <th className="w-16 py-1.5 px-2 text-center font-extrabold uppercase border-r border-black">
                  QTY.
                </th>
                {hasAnyMrp && (
                  <th className="w-24 py-1.5 px-2 text-right font-extrabold uppercase border-r border-black">
                    MRP
                  </th>
                )}
                <th className="w-24 py-1.5 px-2 text-right font-extrabold uppercase border-r border-black">
                  RATE
                </th>
                <th className="w-28 py-1.5 px-3 text-right font-extrabold uppercase">
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {cartItems.map((item: any, idx: number) => {
                const pName = item.product?.name || item.name || "Item";
                const pBrand = item.product?.brand || item.brand;
                const pQty = parseInt(item.quantity, 10) || 1;
                const pRate = Number(item.unitPrice || item.product?.sellingPrice || 0);
                const pMrp = Number(
                  item.mrp ||
                  item.product?.mrp ||
                  (item.product?.sellingPrice && pRate < Number(item.product.sellingPrice)
                    ? item.product.sellingPrice
                    : pRate)
                );
                const pTotal = Number(item.lineTotal || pRate * pQty);

                const discountPercent =
                  pMrp > pRate && pMrp > 0
                    ? (((pMrp - pRate) / pMrp) * 100).toFixed(2)
                    : null;

                const imei =
                  item.productUnit?.imeiNumber ||
                  item.serialNo ||
                  item.imeiNumber ||
                  (item.product?.units?.find(
                    (u: any) => String(u.id) === String(item.selectedUnitId)
                  )?.imeiNumber);

                const specs = item.customisations || item.specifications || item.notes;

                return (
                  <tr key={idx} className="align-top">
                    {/* S.No */}
                    <td className="w-12 py-1.5 px-2 text-center font-medium border-r border-black">
                      {idx + 1}
                    </td>

                    {/* Items & Multiline Specs */}
                    <td className="py-1.5 px-3 text-left border-r border-black">
                      <div className="font-bold text-[11px] text-black">
                        {pBrand ? `${pBrand} - ${pName}` : pName}
                      </div>

                      {/* Multiline specifications (e.g. Almari item 4) */}
                      {specs && (
                        <div className="text-[9.5px] text-gray-700 leading-tight mt-0.5 whitespace-pre-line font-normal">
                          {specs}
                        </div>
                      )}

                      {/* Appliance Serial / IMEI (e.g. Samsung Ref item 1) */}
                      {imei && (
                        <div className="text-[9.5px] font-mono text-gray-800 mt-0.5">
                          {imei}
                        </div>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="w-16 py-1.5 px-2 text-center font-bold text-[10.5px] border-r border-black">
                      {pQty} PCS
                    </td>

                    {/* Optional MRP & Discount % */}
                    {hasAnyMrp && (
                      <td className="w-24 py-1.5 px-2 text-right border-r border-black">
                        {pMrp > 0 ? (
                          <>
                            <span className="font-bold text-[10.5px]">
                              {pMrp.toLocaleString("en-IN")}
                            </span>
                            {discountPercent && (
                              <span className="block text-[8.5px] text-gray-600 font-semibold mt-0.5">
                                ({discountPercent}% OFF)
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}

                    {/* Rate */}
                    <td className="w-24 py-1.5 px-2 text-right font-bold text-[10.5px] border-r border-black">
                      {pRate.toLocaleString("en-IN")}
                    </td>

                    {/* Amount */}
                    <td className="w-28 py-1.5 px-3 text-right font-black text-[11px]">
                      {pTotal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}

              {/* Spacer row — in print fills remaining height; on screen minimal */}
              <tr style={{ height: forPrint ? "100%" : "20px" }} className="align-top">
                <td className="w-12 border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="w-16 border-r border-black"></td>
                {hasAnyMrp && <td className="w-24 border-r border-black"></td>}
                <td className="w-24 border-r border-black"></td>
                <td className="w-28"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. TOTALS & BALANCES SECTION */}
        <div className="border-t border-black text-[11px]">
          {/* TOTAL ROW */}
          <div className="flex border-b border-black">
            <div className="flex-1 py-1 px-3 text-right font-extrabold uppercase text-[10.5px] tracking-wider border-r border-black">
              TOTAL
            </div>
            <div className="w-16 py-1 text-center font-bold border-r border-black">
              {totalQty}
            </div>
            {hasAnyMrp && <div className="w-24 border-r border-black"></div>}
            <div className="w-24 border-r border-black"></div>
            <div className="w-28 py-1 px-3 text-right font-black">
              ₹ {totalAmount.toLocaleString("en-IN")}
            </div>
          </div>

          {/* RECEIVED AMOUNT */}
          <div className="flex border-b border-black">
            <div className="flex-1 py-1 px-3 text-right font-extrabold uppercase text-[10.5px] tracking-wider border-r border-black">
              RECEIVED AMOUNT
            </div>
            <div className="w-28 py-1 px-3 text-right font-black">
              ₹ {paidAmount.toLocaleString("en-IN")}
            </div>
          </div>

          {/* BALANCE AMOUNT (if fully paid, shows 0; else shows due) */}
          {finalDue === 0 && (
            <div className="flex border-b border-black">
              <div className="flex-1 py-1 px-3 text-right font-extrabold uppercase text-[10.5px] tracking-wider border-r border-black">
                BALANCE AMOUNT
              </div>
              <div className="w-28 py-1 px-3 text-right font-black">
                ₹ 0
              </div>
            </div>
          )}

          {/* PREVIOUS BALANCE */}
          <div className="flex border-b border-black">
            <div className="flex-1 py-1 px-3 text-right font-extrabold uppercase text-[10.5px] tracking-wider border-r border-black">
              PREVIOUS BALANCE
            </div>
            <div className="w-28 py-1 px-3 text-right font-bold text-gray-800">
              ₹ {previousBalance.toLocaleString("en-IN")}
            </div>
          </div>

          {/* CURRENT BALANCE */}
          <div className="flex border-b border-black">
            <div className="flex-1 py-1 px-3 text-right font-extrabold uppercase text-[10.5px] tracking-wider border-r border-black">
              CURRENT BALANCE
            </div>
            <div className="w-28 py-1 px-3 text-right font-black text-black">
              ₹ {finalDue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* 4. TOTAL AMOUNT (IN WORDS) */}
        <div className="border-b border-black p-2 bg-white">
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
            Total Amount (in words)
          </p>
          <p className="font-bold text-black text-[11px] mt-0.5">
            {numberToWords(totalAmount)}
          </p>
        </div>

        {/* 5. FOOTER: BANK DETAILS, TERMS & CONDITIONS, AUTHORISED SIGNATORY */}
        <div className="flex text-[9.5px]">
          {/* Column 1: Bank Details */}
          <div className="w-1/3 border-r border-black p-2.5 flex flex-col justify-between">
            <div>
              <p className="font-extrabold text-[10px] text-black uppercase tracking-wider mb-1">
                Bank Details
              </p>
              <div className="space-y-0.5 text-gray-900 leading-tight">
                <p>
                  <span className="font-semibold text-gray-700">Name: </span>
                  <span className="font-bold">MADAN LAL MENARIA</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">IFSC Code: </span>
                  <span className="font-mono font-bold">ICIC0006904</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Account No: </span>
                  <span className="font-mono font-bold">690401702662</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Bank: </span>
                  <span className="font-bold">ICICI Bank</span>
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Terms and Conditions */}
          <div className="w-5/12 border-r border-black p-2.5 text-[9px] leading-tight">
            <p className="font-extrabold text-[10px] text-black uppercase tracking-wider mb-1">
              Terms and Conditions
            </p>
            <ol className="list-decimal pl-3 space-y-0.5 text-gray-800">
              <li>Goods once sold will not be taken back or exchanged</li>
              <li>All disputes are subject to BHINDER jurisdiction only</li>
              <li>गारंटी क्मप्लेन प्रोडक्ट रिप्लेश का गाड़ी किराया कस्टमर का रहेगा</li>
            </ol>
            <p className="font-bold text-black mt-1 text-[9.5px]">
              Helpline Number: +91 820 939 9683 (Suraj Menariya)
            </p>
          </div>

          {/* Column 3: Authorised Signatory */}
          <div className="flex-1 p-2.5 flex flex-col justify-between items-center text-center">
            {/* Signature Graphic Area (Ready for user uploaded signature) */}
            <div className="h-9 w-full flex items-center justify-center relative">
              <img
                src="/uploads/branding/signature.png"
                alt="Signature"
                className="h-9 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Fallback signature line */}
              <div className="w-24 border-b border-dashed border-gray-400"></div>
            </div>

            <div>
              <p className="text-[9px] text-gray-700 font-semibold">
                Authorised Signatory For
              </p>
              <p className="text-[10px] font-black text-black uppercase tracking-tight">
                Laxmi Electronics & Furnitures
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
