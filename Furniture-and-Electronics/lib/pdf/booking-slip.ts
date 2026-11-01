import React from "react";
import { createRoot } from "react-dom/client";
import BookingSlipPrintTemplate from "@/components/dashboard/bookings/BookingSlipPrintTemplate";
import { BookingResponse } from "@/types/booking";

/**
 * Helper to extract design photos array from booking notes
 */
export function extractDesignPhotos(notes?: string | null): string[] {
  if (!notes) return [];
  const match = notes.match(/\[DESIGNS\]:(.*?)(?:\n|$)/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generate a PDF Blob for the Booking Slip (including embedded design photos)
 */
export async function generateBookingSlipPdfBlob(
  booking: BookingResponse,
  extraDesigns?: string[]
): Promise<Blob> {
  const jsPDF = (await import("jspdf")).default;
  const html2canvas = (await import("html2canvas-pro")).default;

  const designPhotos = extraDesigns && extraDesigns.length > 0
    ? extraDesigns
    : extractDesignPhotos(booking.notes);

  // Create hidden DOM container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "740px";
  container.style.padding = "0px";
  container.style.margin = "0px";
  container.style.boxSizing = "border-box";
  container.style.background = "#ffffff";
  container.style.overflow = "hidden";

  document.body.appendChild(container);

  const root = createRoot(container);

  // Render template and wait for images to paint
  await new Promise<void>((resolve) => {
    root.render(
      React.createElement(BookingSlipPrintTemplate, {
        booking,
        designPhotos,
      })
    );
    // Allow React and images to render
    setTimeout(resolve, 350);
  });

  // Capture with html2canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  });

  // Cleanup
  root.unmount();
  document.body.removeChild(container);

  // Build PDF
  const imgData = canvas.toDataURL("image/jpeg", 0.85);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  // Multi-page handling if designs exceed 1 page
  let heightLeft = contentHeight;
  let position = margin;
  let page = 1;

  pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight, undefined, "FAST");
  heightLeft -= (pdfHeight - margin * 2);

  while (heightLeft > 0) {
    pdf.addPage();
    page++;
    position = -(page - 1) * (pdfHeight - margin * 2) + margin;
    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight, undefined, "FAST");
    heightLeft -= (pdfHeight - margin * 2);
  }

  return pdf.output("blob");
}

