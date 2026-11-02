const { Router } = require('express');
const { API_KEY } = require('./config');
const { getSettings, updateSettings } = require('./db');
const { initWhatsappSocket, disconnectWhatsapp, getGlobalSocket } = require('./whatsapp');
const { dispatchMessage } = require('./sender');

const router = Router();

// Unauthenticated health check endpoint (used by Northflank / monitoring)
router.get('/health', (req, res) => {
  const socket = getGlobalSocket();
  res.json({
    status: 'ok',
    service: 'whatsapp-bot-microservice',
    whatsapp: socket ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Authentication middleware
function authMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
}

router.use(authMiddleware);

// GET /status — Return current WhatsApp status
router.get('/status', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      id: settings.id,
      ownerPhone: settings.owner_phone,
      status: settings.status,
      qrCode: settings.qr_code,
      simulateFailures: settings.simulate_failures,
      simulateSessionError: settings.simulate_session_error,
    });
  } catch (error) {
    console.error('Error fetching status:', error.message);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// POST /connect — Start WhatsApp connection & QR generation
router.post('/connect', async (req, res) => {
  try {
    const socket = getGlobalSocket();
    if (socket) {
      try { socket.end(undefined); } catch (e) { /* ignore */ }
    }

    const settings = await getSettings();
    await updateSettings(settings.id, { status: 'connecting', qr_code: null });

    initWhatsappSocket().catch((err) => {
      console.error('WhatsApp startup error:', err.message);
    });

    res.json({
      status: 'connecting',
      message: 'WhatsApp connection initiated. Poll /status for QR code.',
    });
  } catch (error) {
    console.error('Error starting connection:', error.message);
    res.status(500).json({ error: 'Failed to start WhatsApp connection' });
  }
});

// POST /disconnect — Disconnect WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    await disconnectWhatsapp();
    res.json({ status: 'disconnected', message: 'WhatsApp disconnected successfully.' });
  } catch (error) {
    console.error('Error disconnecting:', error.message);
    res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
  }
});

// POST /send — Send text or document message (queued sequentially)
router.post('/send', async (req, res) => {
  try {
    const { phone, text, pdfUrl, pdfFilename, pdfBase64 } = req.body;

    if (!phone || !text) {
      return res.status(400).json({ error: 'Missing required fields: phone, text' });
    }

    const result = await dispatchMessage({ phone, text, pdfUrl, pdfFilename, pdfBase64 });
    res.json({ success: true, message: `Delivered to ${phone}`, ...result });
  } catch (error) {
    console.error('Error dispatching message:', error.message);
    res.status(500).json({ error: error.message || 'Failed to dispatch message' });
  }
});

module.exports = router;

