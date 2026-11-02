const { Pool } = require('pg');
const { DATABASE_URL } = require('./config');

const pool = new Pool({ connectionString: DATABASE_URL });

async function getSettings() {
  const res = await pool.query('SELECT * FROM "whatsapp_settings" ORDER BY id ASC LIMIT 1');
  if (res.rows.length === 0) {
    const created = await pool.query(`
      INSERT INTO "whatsapp_settings" (owner_phone, status, simulate_failures, simulate_session_error)
      VALUES ('6375591682', 'disconnected', false, false)
      RETURNING *
    `);
    return created.rows[0];
  }
  return res.rows[0];
}

async function updateSettings(id, data) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (data.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.qr_code !== undefined) {
    setClauses.push(`qr_code = $${idx++}`);
    values.push(data.qr_code);
  }

  if (setClauses.length === 0) return;
  values.push(id);

  const query = `UPDATE "whatsapp_settings" SET ${setClauses.join(', ')} WHERE id = $${idx}`;
  await pool.query(query, values);
}

async function logAuditEvent(billId, billNumber, event, details) {
  try {
    await pool.query(`
      INSERT INTO "whatsapp_audit_logs" (bill_id, bill_number, event, details)
      VALUES ($1, $2, $3, $4)
    `, [billId, billNumber, event, details]);
  } catch (err) {
    console.error('Failed to write audit event:', err.message);
  }
}

module.exports = {
  pool,
  getSettings,
  updateSettings,
  logAuditEvent,
};

