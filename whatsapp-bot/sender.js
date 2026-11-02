const fs = require('fs');
const path = require('path');
const { getGlobalSocket } = require('./whatsapp');
const { enqueueWhatsappMessage } = require('./queue');

/**
 * Format Indian 10-digit phone numbers for WhatsApp JID
 */
function normalizeJid(phone) {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned + '@s.whatsapp.net';
}

/**
 * Sanitize and convert base64 or remote URL into a valid Buffer
 */
async function resolvePdfBuffer(pdfPath, pdfBase64) {
  if (pdfBase64) {
    let clean = String(pdfBase64);
    if (clean.includes('base64,')) {
      clean = clean.split('base64,')[1];
    }
    clean = clean.trim();
    return Buffer.from(clean, 'base64');
  }

  if (pdfPath?.startsWith('http://') || pdfPath?.startsWith('https://')) {
    const res = await fetch(pdfPath);
    if (!res.ok) {
      throw new Error(`Failed to download remote PDF: HTTP ${res.status}`);
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }

  if (pdfPath) {
    const fullPath = path.resolve(pdfPath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
  }

  return null;
}

/**
 * Send WhatsApp text or document message (queued sequentially)
 */
async function dispatchMessage({ phone, text, pdfUrl, pdfFilename, pdfBase64 }) {
  const socket = getGlobalSocket();
  if (!socket) {
    throw new Error('WhatsApp daemon is not connected. Call POST /connect to link a device.');
  }

  const jid = normalizeJid(phone);

  return enqueueWhatsappMessage(async () => {
    // 1. Send Document if provided
    if ((pdfUrl || pdfBase64) && pdfFilename) {
      const buffer = await resolvePdfBuffer(pdfUrl, pdfBase64);
      if (buffer && buffer.length > 0) {
        console.log(`📤 Dispatching PDF document to ${phone} (${pdfFilename}, ${buffer.length} bytes)...`);
        await socket.sendMessage(jid, {
          document: buffer,
          mimetype: 'application/pdf',
          fileName: pdfFilename,
          caption: text,
        });
        console.log(`✅ Delivered PDF document to ${phone} (${pdfFilename})`);
        return { success: true, mode: 'document', bytes: buffer.length };
      }
    }

    // 2. Fallback to Text Message
    console.log(`📤 Dispatching text message to ${phone}...`);
    await socket.sendMessage(jid, { text });
    console.log(`✅ Delivered text message to ${phone}`);
    return { success: true, mode: 'text' };
  });
}

module.exports = {
  dispatchMessage,
  normalizeJid,
  resolvePdfBuffer,
};

