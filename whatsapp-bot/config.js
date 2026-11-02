require('dotenv').config();
const path = require('path');
const pino = require('pino');

const PORT = parseInt(process.env.PORT || '3001', 10);
const API_KEY = process.env.API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const sessionDir = process.env.WHATSAPP_SESSION_DIR || path.join(process.cwd(), 'whatsapp-sessions');
const MAX_RECONNECT_ATTEMPTS = 3;

if (!API_KEY) {
  console.error('❌ API_KEY environment variable is required');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const logger = pino({ level: process.env.LOG_LEVEL || 'warn' });

module.exports = {
  PORT,
  API_KEY,
  DATABASE_URL,
  sessionDir,
  logger,
  MAX_RECONNECT_ATTEMPTS,
};

