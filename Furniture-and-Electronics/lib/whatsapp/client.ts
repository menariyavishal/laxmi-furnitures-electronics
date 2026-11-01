/**
 * WhatsApp Bot HTTP Client
 *
 * Communicates with the standalone Baileys WhatsApp bot microservice.
 * Validates URLs, formats phone numbers, and manages connection status.
 */

import { WhatsAppSendOptions } from "./types";

export function isBotConfigured(): boolean {
  // In local development, return true if either local daemon (port 3001) or remote bot is used
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    return true;
  }
  return !!(process.env.WHATSAPP_BOT_URL && process.env.WHATSAPP_API_KEY);
}

function getNormalizedBotUrl(): string {
  let url = process.env.WHATSAPP_BOT_URL || "";
  if (!url) {
    // In local development, automatically point to local daemon on port 3001
    if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
      return "http://localhost:3001";
    }
    throw new Error("WHATSAPP_BOT_URL environment variable is not configured");
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
}

async function botFetch(endpoint: string, options: RequestInit = {}) {
  const botUrl = getNormalizedBotUrl();
  const isLocal = botUrl.includes("localhost") || botUrl.includes("127.0.0.1");
  const apiKey = process.env.WHATSAPP_API_KEY || (isLocal ? "local-dev-key" : "");

  if (!apiKey && !isLocal) {
    throw new Error("WHATSAPP_API_KEY environment variable is not configured");
  }

  const controller = new AbortController();
  const timeoutMs = parseInt(process.env.WHATSAPP_TIMEOUT || "45000", 10);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${botUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Unknown error");
      throw new Error(`Bot API error (${res.status}): ${errorBody}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`WhatsApp request timed out after ${timeoutMs}ms`);
    }
    if (
      err.cause?.code === "ECONNREFUSED" ||
      err.code === "ECONNREFUSED" ||
      err.message?.includes("ECONNREFUSED") ||
      err.message?.includes("fetch failed")
    ) {
      throw new Error(
        `Local WhatsApp daemon is not running at ${botUrl}. Please run "npm run whatsapp:local" in a separate terminal to start it.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Format Indian phone numbers cleanly: removes spaces, +, dashes,
 * and ensures 10 digits are properly normalized for WhatsApp
 */
export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/** Get WhatsApp bot daemon status */
export async function botGetStatus() {
  return botFetch("/status");
}

export const botStatus = botGetStatus;

/** Initiate connection (generates QR code) */
export async function botConnect() {
  return botFetch("/connect", { method: "POST" });
}

/** Disconnect WhatsApp session */
export async function botDisconnect() {
  return botFetch("/disconnect", { method: "POST" });
}

/**
 * Send WhatsApp text and optional PDF attachment
 * Supports both options object and positional arguments for maximum compatibility.
 */
export async function botSendMessage(
  optionsOrPhone: WhatsAppSendOptions | string,
  maybeText?: string,
  pdfUrl?: string,
  pdfFilename?: string,
  pdfBase64?: string
) {
  let opts: WhatsAppSendOptions;
  if (typeof optionsOrPhone === "string") {
    opts = {
      phone: optionsOrPhone,
      text: maybeText || "",
      pdfUrl,
      pdfFilename,
      pdfBase64,
    };
  } else {
    opts = optionsOrPhone;
  }

  const normalizedPhone = normalizePhoneNumber(opts.phone);
  if (!normalizedPhone || normalizedPhone.length !== 10) {
    throw new Error(`Invalid 10-digit mobile number: "${opts.phone}"`);
  }

  return botFetch("/send", {
    method: "POST",
    body: JSON.stringify({
      phone: normalizedPhone,
      text: opts.text,
      pdfUrl: opts.pdfUrl,
      pdfFilename: opts.pdfFilename,
      pdfBase64: opts.pdfBase64,
    }),
  });
}

