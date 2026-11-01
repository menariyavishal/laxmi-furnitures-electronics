/**
 * WhatsApp Dispatch Coordinator
 *
 * Coordinates delivery to Railway bot microservice, manages audit logs,
 * updates delivery statuses in PostgreSQL via Prisma.
 */

import { prisma } from "@/lib/prisma";
import { botSendMessage, isBotConfigured, normalizePhoneNumber } from "./client";
import { WhatsAppSendOptions } from "./types";

export interface DispatchParams extends WhatsAppSendOptions {
  billId?: number;
  billNumber?: string;
  customerName?: string;
  isVendor?: boolean;
}

export async function getWhatsappSettings() {
  let settings = await prisma.whatsappSettings.findFirst();
  if (!settings) {
    settings = await prisma.whatsappSettings.create({
      data: {
        ownerPhone: "9928203203",
        status: "disconnected",
        simulateFailures: false,
        simulateSessionError: false,
      },
    });
  }
  return settings;
}

export async function logWhatsappAudit(
  billId: number,
  billNumber: string,
  event: string,
  details: string
) {
  try {
    await prisma.whatsappAuditLog.create({
      data: {
        billId,
        billNumber,
        event,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to write WhatsApp audit log:", err);
  }
}

export const logWhatsappEvent = logWhatsappAudit;

export async function attemptWhatsappDelivery(deliveryId: number, pdfBase64?: string) {
  const delivery = await prisma.whatsappDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) {
    throw new Error("Delivery record not found");
  }

  const bill = await prisma.bill.findUnique({
    where: { id: delivery.billId },
  });

  const settings = await getWhatsappSettings();

  await logWhatsappAudit(
    delivery.billId,
    delivery.billNumber,
    "WhatsApp Attempted",
    `Attempting to send PDF to ${delivery.customerName} (${delivery.mobileNumber})`
  );

  let status = "sent";
  let failureReason: string | null = null;

  if (settings.status !== "connected" || (process.env.NODE_ENV === "development" && settings.simulateSessionError)) {
    status = "failed";
    failureReason = "Session Not Connected";
  } else if (process.env.NODE_ENV === "development" && settings.simulateFailures && delivery.mobileNumber.endsWith("9")) {
    status = "failed";
    failureReason = "Customer is not available on WhatsApp";
  } else if (delivery.mobileNumber.startsWith("000")) {
    status = "failed";
    failureReason = "Invalid Number";
  } else {
    try {
      let messageText = "";
      if (delivery.customMessage) {
        messageText = delivery.customMessage;
      } else if (bill) {
        const { formatBillInvoiceMessage } = await import("./templates");
        messageText = formatBillInvoiceMessage({
          customerName: delivery.customerName,
          billNumber: delivery.billNumber,
          date: new Date(bill.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          totalAmount: Number(bill.totalAmount),
          paidAmount: Number(bill.paidAmount),
          dueAmount: Number(bill.dueAmount),
        });
      } else {
        messageText = `Hello ${delivery.customerName}, here is your invoice #${delivery.billNumber} from Laxmi Electronics & Furnitures.`;
      }

      if (!isBotConfigured()) {
        throw new Error("WhatsApp bot is not configured. Set WHATSAPP_BOT_URL and WHATSAPP_API_KEY environment variables.");
      }

      await botSendMessage({
        phone: delivery.mobileNumber,
        text: messageText,
        pdfFilename: `Laxmi_Invoice_${delivery.billNumber}.pdf`,
        pdfBase64,
        pdfUrl: delivery.pdfPath?.startsWith("http") ? delivery.pdfPath : undefined,
      });
    } catch (error: any) {
      console.error("Failed to send WhatsApp message:", error);
      status = "failed";
      failureReason = error.message || "Failed to send message";
    }
  }

  const updated = await prisma.whatsappDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      failureReason,
      sentAt: status === "sent" ? new Date() : null,
    },
  });

  if (delivery.billId > 0) {
    await prisma.bill.update({
      where: { id: delivery.billId },
      data: {
        whatsappStatus: status,
        whatsappSentAt: status === "sent" ? new Date() : null,
      },
    }).catch(() => null);
  }

  if (status === "sent") {
    await logWhatsappAudit(
      delivery.billId,
      delivery.billNumber,
      "WhatsApp Sent",
      `PDF delivered successfully to ${delivery.mobileNumber}`
    );
  } else {
    await logWhatsappAudit(
      delivery.billId,
      delivery.billNumber,
      "WhatsApp Failed",
      `Delivery failed to ${delivery.mobileNumber}. Reason: ${failureReason}`
    );
  }

  return updated;
}

export async function dispatchWhatsappNotification(params: DispatchParams): Promise<{
  success: boolean;
  deliveryId?: number;
  error?: string;
}> {
  const normalizedPhone = normalizePhoneNumber(params.phone);
  const billId = params.billId ?? 0;
  const billNumber = params.billNumber || "N/A";
  const recipientName = params.customerName || (params.isVendor ? "Supplier" : "Customer");

  if (!normalizedPhone || normalizedPhone.length !== 10) {
    const errorMsg = `Invalid recipient phone number: "${params.phone}"`;
    await logWhatsappAudit(billId, billNumber, "WhatsApp Rejected", errorMsg);
    return { success: false, error: errorMsg };
  }

  // Check if bot is configured
  if (!isBotConfigured()) {
    const errorMsg = "WHATSAPP_BOT_URL or WHATSAPP_API_KEY is not configured";
    await logWhatsappAudit(billId, billNumber, "WhatsApp Disabled", errorMsg);
    return { success: false, error: errorMsg };
  }

  // Create Delivery Record in DB
  let deliveryId: number | undefined;
  try {
    const delivery = await prisma.whatsappDelivery.create({
      data: {
        billId,
        billNumber,
        customerName: recipientName,
        mobileNumber: normalizedPhone,
        pdfPath: params.pdfFilename || "none",
        customMessage: params.text,
        status: "pending",
      },
    });
    deliveryId = delivery.id;
  } catch (err) {
    console.warn("Could not create initial delivery record in DB:", err);
  }

  // Attempt Send
  try {
    await logWhatsappAudit(
      billId,
      billNumber,
      "WhatsApp Attempted",
      `Dispatching to ${recipientName} (${normalizedPhone})`
    );

    await botSendMessage({
      phone: normalizedPhone,
      text: params.text,
      pdfBase64: params.pdfBase64,
      pdfFilename: params.pdfFilename,
      pdfUrl: params.pdfUrl,
    });

    // Mark as sent
    if (deliveryId) {
      await prisma.whatsappDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "sent",
          sentAt: new Date(),
        },
      });
    }

    if (billId > 0) {
      await prisma.bill.update({
        where: { id: billId },
        data: {
          whatsappStatus: "sent",
          whatsappSentAt: new Date(),
        },
      }).catch(() => null);
    }

    await logWhatsappAudit(
      billId,
      billNumber,
      "WhatsApp Sent",
      `Message successfully delivered to ${normalizedPhone}`
    );

    return { success: true, deliveryId };
  } catch (err: any) {
    console.error("WhatsApp dispatch failed:", err);
    const failureReason = err.message || "Failed to dispatch message";

    if (deliveryId) {
      await prisma.whatsappDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          failureReason,
        },
      }).catch(() => null);
    }

    if (billId > 0) {
      await prisma.bill.update({
        where: { id: billId },
        data: {
          whatsappStatus: "failed",
        },
      }).catch(() => null);
    }

    await logWhatsappAudit(
      billId,
      billNumber,
      "WhatsApp Failed",
      `Failed to send to ${normalizedPhone}. Reason: ${failureReason}`
    );

    return { success: false, deliveryId, error: failureReason };
  }
}

