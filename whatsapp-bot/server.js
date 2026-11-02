/**
 * WhatsApp Bot Microservice Entry Point
 *
 * Modular architecture:
 * - config.js   : Environment variables & secrets
 * - db.js       : PostgreSQL pool & settings persistence
 * - queue.js    : Sequential message queue with spacing to avoid collisions
 * - whatsapp.js : Baileys connection lifecycle & socket management
 * - sender.js   : Message formatting, base64 sanitization & dispatch
 * - routes.js   : Express endpoints & authentication middleware
 */

const express = require('express');
const { PORT } = require('./config');
const { getSettings } = require('./db');
const { initWhatsappSocket } = require('./whatsapp');
const routes = require('./routes');

const app = express();

// Increase JSON payload limit to 25MB for high-resolution PDF invoices and design attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount all API endpoints
app.use('/', routes);

// Start Server
app.listen(PORT, async () => {
  console.log(`\n============================================================`);
  console.log(`🤖 WhatsApp Bot Microservice running on port ${PORT}`);
  console.log(`   Health:     GET  /health`);
  console.log(`   Status:     GET  /status`);
  console.log(`   Connect:    POST /connect`);
  console.log(`   Disconnect: POST /disconnect`);
  console.log(`   Send:       POST /send`);
  console.log(`   Architecture: Modular (Queue + Base64 Sanitization)`);
  console.log(`============================================================\n`);

  // Auto-start bot on container boot ONLY if DB recorded an active session
  try {
    const settings = await getSettings();
    if (settings.status === 'connected') {
      console.log('🔄 Active session found in database. Auto-reconnecting WhatsApp daemon...');
      initWhatsappSocket().catch((e) => console.error('Daemon startup error:', e.message));
    } else {
      console.log('ℹ️ No active session in database. Waiting for /connect trigger.');
    }
  } catch (err) {
    console.error('Initial database session check failed:', err.message);
  }
});
