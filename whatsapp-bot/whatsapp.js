const fs = require('fs');
const path = require('path');
const { sessionDir, logger, MAX_RECONNECT_ATTEMPTS } = require('./config');
const { getSettings, updateSettings } = require('./db');

let globalSocket = null;
let isInitializing = false;
let cachedWaVersion = null;
let globalConnectionTimeout = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

function clearSessionFiles() {
  if (fs.existsSync(sessionDir)) {
    try {
      for (const entry of fs.readdirSync(sessionDir)) {
        fs.rmSync(path.join(sessionDir, entry), { recursive: true, force: true });
      }
      console.log('🧹 Session files cleared.');
    } catch (err) {
      console.warn('Warning clearing session directory:', err.message);
    }
  } else {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
}

async function initWhatsappSocket() {
  if (isInitializing) {
    console.log('⏳ WhatsApp initialization already in progress, skipping...');
    return;
  }

  isInitializing = true;
  console.log('🚀 Starting WhatsApp connection...');

  try {
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = baileys;

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const settings = await getSettings();

    // Dead-man switch: do not auto-start if explicitly disconnected
    if (settings.status === 'disconnected') {
      console.log('🛑 DB is set to disconnected. Aborting startup to prevent zombie loops.');
      isInitializing = false;
      reconnectAttempts = 0;
      return;
    }

    await updateSettings(settings.id, { status: 'connecting', qr_code: null });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let versionToUse = cachedWaVersion;
    if (!versionToUse) {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📱 Fetched WhatsApp protocol v${version.join('.')}, isLatest: ${isLatest}`);
      cachedWaVersion = version;
      versionToUse = version;
    } else {
      console.log(`📱 Using cached WhatsApp protocol v${versionToUse.join('.')}`);
    }

    const sock = makeWASocket({
      version: versionToUse,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: true,
      logger: logger,
      fireInitQueries: false,
      syncFullHistory: false, // Prevent high memory usage / OOM
      markOnlineOnConnect: false,
    });

    globalSocket = sock;

    // 60-second watchdog timer for scanning QR code
    globalConnectionTimeout = setTimeout(async () => {
      if (globalSocket === sock) {
        console.log('⏱️ WhatsApp QR pairing timed out after 60s. Terminating socket...');
        try { globalSocket.end(undefined); } catch (e) { /* ignore */ }
        globalSocket = null;
        reconnectAttempts = 0;
        clearSessionFiles();
        await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
      }
    }, 60000);

    sock.ev.on('creds.update', saveCreds);

    // Ignore history sync to avoid memory pressure
    sock.ev.on('messaging-history.set', () => {});

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📱 New WhatsApp QR code generated!');
        await updateSettings(settings.id, { status: 'connecting', qr_code: qr });
      }

      if (connection === 'open') {
        clearTimeout(globalConnectionTimeout);
        reconnectAttempts = 0;
        console.log('✅ WhatsApp connected successfully!');
        await updateSettings(settings.id, { status: 'connected', qr_code: null });
      }

      if (connection === 'close') {
        clearTimeout(globalConnectionTimeout);
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`❌ WhatsApp disconnected (code: ${statusCode}).`);

        if (globalSocket !== sock) {
          console.log('🛑 Socket was replaced or manually killed.');
          reconnectAttempts = 0;
          await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
          return;
        }

        if (statusCode === 515) {
          // 515 is normal pairing restart handshake
          reconnectAttempts++;
          if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.log(`🛑 Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Resetting session.`);
            globalSocket = null;
            isInitializing = false;
            reconnectAttempts = 0;
            clearSessionFiles();
            await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
          } else {
            console.log(`🔄 Reconnecting in 5s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            isInitializing = false;
            reconnectTimer = setTimeout(() => initWhatsappSocket(), 5000);
          }
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log('🛑 Session logged out. Resetting state.');
          globalSocket = null;
          isInitializing = false;
          reconnectAttempts = 0;
          clearSessionFiles();
          await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
        } else {
          console.log(`⚠️ Unexpected disconnect (code: ${statusCode}). Resetting to disconnected.`);
          globalSocket = null;
          isInitializing = false;
          reconnectAttempts = 0;
          clearSessionFiles();
          await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
        }
      }
    });

    isInitializing = false;
  } catch (error) {
    isInitializing = false;
    console.error('❌ WhatsApp initialization failed:', error);
    throw error;
  }
}

async function disconnectWhatsapp() {
  clearTimeout(globalConnectionTimeout);
  clearTimeout(reconnectTimer);
  reconnectAttempts = 0;

  if (globalSocket) {
    try {
      globalSocket.end(undefined);
    } catch (e) {
      console.error('Error closing socket:', e.message);
    }
    globalSocket = null;
  }

  isInitializing = false;

  const settings = await getSettings();
  await updateSettings(settings.id, { status: 'disconnected', qr_code: null });
  clearSessionFiles();
  console.log('✅ WhatsApp disconnected and cleaned up.');
}

function getGlobalSocket() {
  return globalSocket;
}

module.exports = {
  initWhatsappSocket,
  disconnectWhatsapp,
  getGlobalSocket,
  clearSessionFiles,
};

