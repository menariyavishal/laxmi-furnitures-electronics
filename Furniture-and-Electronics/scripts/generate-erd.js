const fs = require('fs');
const path = require('path');

// Complete definition of tables, columns, constraints, and relationships
const tablesData = [
  {
    name: "users",
    comment: "System users (Admin / Staff / Owner) & authentication",
    color: "#2563eb",
    x: 50, y: 50,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "name", type: "TEXT", pk: false, uq: false, nn: true, comment: "Full Name" },
      { name: "username", type: "TEXT", pk: false, uq: true, nn: true, comment: "Unique Login Username" },
      { name: "email", type: "TEXT", pk: false, uq: true, nn: false, comment: "Optional Email" },
      { name: "password_hash", type: "TEXT", pk: false, uq: false, nn: true, comment: "Bcrypt hash" },
      { name: "role", type: "TEXT", pk: false, uq: false, nn: true, comment: "owner | staff | admin" },
      { name: "is_active", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Active flag", default: "true" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Created timestamp", default: "NOW()" }
    ]
  },
  {
    name: "password_reset_tokens",
    comment: "Secure password reset tokens for staff/owners",
    color: "#64748b",
    x: 50, y: 350,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "user_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "users.id", comment: "FK -> users.id" },
      { name: "token", type: "TEXT", pk: false, uq: true, nn: true, comment: "Reset Token" },
      { name: "expires_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Expiration time" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Created time", default: "NOW()" }
    ]
  },
  {
    name: "categories",
    comment: "Product categories hierarchy with Department tagging",
    color: "#059669",
    x: 420, y: 50,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "name", type: "TEXT", pk: false, uq: false, nn: true, comment: "Category Name" },
      { name: "department", type: "TEXT", pk: false, uq: false, nn: true, comment: "FURNITURE | ELECTRONICS", default: "'FURNITURE'" },
      { name: "parent_category_id", type: "INTEGER", pk: false, uq: false, nn: false, fk: "categories.id", comment: "FK -> categories.id (Self-Ref)" },
      { name: "is_active", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Active flag", default: "true" }
    ]
  },
  {
    name: "products",
    comment: "Showroom catalog items for both Furniture & Electronics",
    color: "#0284c7",
    x: 420, y: 280,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "category_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "categories.id", comment: "FK -> categories.id" },
      { name: "department", type: "TEXT", pk: false, uq: false, nn: true, comment: "FURNITURE | ELECTRONICS", default: "'FURNITURE'" },
      { name: "name", type: "TEXT", pk: false, uq: false, nn: true, comment: "Product Name / Model" },
      { name: "barcode", type: "TEXT", pk: false, uq: true, nn: false, comment: "Unique barcode" },
      { name: "brand", type: "TEXT", pk: false, uq: false, nn: false, comment: "Brand Name" },
      { name: "product_type", type: "TEXT", pk: false, uq: false, nn: true, comment: "quantity | serialized | electronics" },
      { name: "cost_price", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Purchase Cost" },
      { name: "selling_price", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "MSRP / Price" },
      { name: "quantity_in_stock", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Available Units", default: "0" },
      { name: "low_stock_threshold", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Alert threshold", default: "5" },
      { name: "warranty_months", type: "INTEGER", pk: false, uq: false, nn: false, comment: "Warranty coverage", default: "12" },
      { name: "image_url", type: "TEXT", pk: false, uq: false, nn: false, comment: "Product Image" },
      { name: "is_active", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Active flag", default: "true" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Created date", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Updated date" }
    ]
  },
  {
    name: "product_units",
    comment: "Individual serialized inventory (Appliance Serial / IMEI numbers)",
    color: "#0891b2",
    x: 420, y: 760,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "product_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "products.id", comment: "FK -> products.id" },
      { name: "imei_number", type: "TEXT", pk: false, uq: true, nn: true, comment: "Appliance Serial / IMEI" },
      { name: "status", type: "TEXT", pk: false, uq: false, nn: true, comment: "in_stock | sold | defective" },
      { name: "cost_price", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Unit cost" },
      { name: "added_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Added date", default: "NOW()" },
      { name: "sold_at", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "Delivery / Sold date" }
    ]
  },
  {
    name: "stock_in_records",
    comment: "Audit log of inventory additions with purchasing user",
    color: "#0f766e",
    x: 50, y: 550,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "product_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "products.id", comment: "FK -> products.id" },
      { name: "quantity_added", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Units added" },
      { name: "cost_price", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Batch cost" },
      { name: "added_by_user_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "users.id", comment: "FK -> users.id" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Date added", default: "NOW()" }
    ]
  },
  {
    name: "customers",
    comment: "Customer contact repository for bills & wedding bookings",
    color: "#d97706",
    x: 820, y: 50,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "name", type: "TEXT", pk: false, uq: false, nn: false, comment: "Customer Full Name" },
      { name: "address", type: "TEXT", pk: false, uq: false, nn: false, comment: "Delivery / Home Address" },
      { name: "phone", type: "TEXT", pk: false, uq: false, nn: false, comment: "10-digit mobile number" }
    ]
  },
  {
    name: "bookings",
    comment: "Advance bookings & wedding gift packages",
    color: "#e11d48",
    x: 820, y: 260,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "booking_number", type: "TEXT", pk: false, uq: true, nn: true, comment: "Unique Booking # (e.g. WB-2026-0001)" },
      { name: "customer_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "customers.id", comment: "FK -> customers.id" },
      { name: "event_date", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "Wedding / Event Date" },
      { name: "expected_delivery_date", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Target Delivery Date" },
      { name: "total_estimated_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Total Package Value" },
      { name: "advance_paid", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Token advance", default: "0" },
      { name: "remaining_balance", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Balance due", default: "0" },
      { name: "status", type: "TEXT", pk: false, uq: false, nn: true, comment: "CONFIRMED | PARTIALLY_DELIVERED | COMPLETED | CANCELLED", default: "'CONFIRMED'" },
      { name: "notes", type: "TEXT", pk: false, uq: false, nn: false, comment: "Customer preferences / notes" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Booked date", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Updated date" }
    ]
  },
  {
    name: "booking_items",
    comment: "Reserved items in advance packages with billing status",
    color: "#be123c",
    x: 820, y: 640,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "booking_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "bookings.id", comment: "FK -> bookings.id" },
      { name: "product_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "products.id", comment: "FK -> products.id" },
      { name: "department", type: "TEXT", pk: false, uq: false, nn: true, comment: "FURNITURE | ELECTRONICS" },
      { name: "quantity", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Units reserved" },
      { name: "unit_price", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Locked-in unit rate" },
      { name: "line_total", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Total amount" },
      { name: "is_billed", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Invoiced on delivery", default: "false" },
      { name: "bill_id", type: "INTEGER", pk: false, uq: false, nn: false, fk: "bills.id", comment: "FK -> bills.id (Delivery Invoice)" }
    ]
  },
  {
    name: "delivery_schedules",
    comment: "Truck dispatch and delivery logistics tracking",
    color: "#b91c1c",
    x: 820, y: 950,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "booking_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "bookings.id", comment: "FK -> bookings.id" },
      { name: "scheduled_date", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Scheduled Date" },
      { name: "actual_delivery", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "Completed Date" },
      { name: "status", type: "TEXT", pk: false, uq: false, nn: true, comment: "SCHEDULED | OUT_FOR_DELIVERY | DELIVERED", default: "'SCHEDULED'" },
      { name: "driver_notes", type: "TEXT", pk: false, uq: false, nn: false, comment: "Dispatch notes" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Created date", default: "NOW()" }
    ]
  },
  {
    name: "bills",
    comment: "Sales & Delivery Invoices (Warranty starts on delivery)",
    color: "#7c3aed",
    x: 1220, y: 50,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "bill_number", type: "TEXT", pk: false, uq: true, nn: true, comment: "Unique Invoice # (e.g. INV-ELEC-2026-0001)" },
      { name: "bill_type", type: "TEXT", pk: false, uq: false, nn: true, comment: "REGULAR | DELIVERY_INVOICE", default: "'REGULAR'" },
      { name: "department", type: "TEXT", pk: false, uq: false, nn: true, comment: "FURNITURE | ELECTRONICS | COMBINED", default: "'FURNITURE'" },
      { name: "booking_id", type: "INTEGER", pk: false, uq: false, nn: false, fk: "bookings.id", comment: "FK -> bookings.id" },
      { name: "customer_id", type: "INTEGER", pk: false, uq: false, nn: false, fk: "customers.id", comment: "FK -> customers.id" },
      { name: "created_by_user_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "users.id", comment: "FK -> users.id" },
      { name: "delivery_date", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "Delivery Date" },
      { name: "warranty_starts", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "Official Warranty Start Date" },
      { name: "subtotal", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Taxable subtotal" },
      { name: "discount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Discount", default: "0" },
      { name: "sgst_percent", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "SGST %", default: "0" },
      { name: "cgst_percent", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "CGST %", default: "0" },
      { name: "sgst_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "SGST Amount", default: "0" },
      { name: "cgst_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "CGST Amount", default: "0" },
      { name: "total_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Final Grand Total" },
      { name: "paid_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Amount Collected", default: "0" },
      { name: "due_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Remaining Udhaari", default: "0" },
      { name: "payment_status", type: "TEXT", pk: false, uq: false, nn: true, comment: "PAID | PARTIAL | UNPAID", default: "'PAID'" },
      { name: "payment_mode", type: "TEXT", pk: false, uq: false, nn: true, comment: "CASH | UPI | CARD | FINANCE | BANK_TRANSFER" },
      { name: "status", type: "TEXT", pk: false, uq: false, nn: true, comment: "completed | voided" },
      { name: "whatsapp_status", type: "TEXT", pk: false, uq: false, nn: false, comment: "pending | sent | failed" },
      { name: "whatsapp_sent_at", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "WhatsApp sent time" },
      { name: "is_settled", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Dues settled flag", default: "false" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Invoice date", default: "NOW()" }
    ]
  },
  {
    name: "bill_items",
    comment: "Individual items in sales invoices",
    color: "#6d28d9",
    x: 1220, y: 700,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "bill_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "bills.id", comment: "FK -> bills.id" },
      { name: "product_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "products.id", comment: "FK -> products.id" },
      { name: "product_unit_id", type: "INTEGER", pk: false, uq: false, nn: false, fk: "product_units.id", comment: "FK -> product_units.id" },
      { name: "quantity", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Units billed" },
      { name: "unit_price", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Unit rate" },
      { name: "line_total", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Line total" }
    ]
  },
  {
    name: "finance_providers",
    comment: "Financing institutions (Bajaj Finserv, HDFC, TVS, etc.)",
    color: "#475569",
    x: 1620, y: 50,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "name", type: "TEXT", pk: false, uq: true, nn: true, comment: "Provider Name (e.g. Bajaj)" },
      { name: "is_active", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Active status", default: "true" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Created date", default: "NOW()" }
    ]
  },
  {
    name: "finance_records",
    comment: "EMI plans attached to invoices",
    color: "#334155",
    x: 1620, y: 240,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "bill_id", type: "INTEGER", pk: false, uq: true, nn: true, fk: "bills.id", comment: "FK -> bills.id (1:1)" },
      { name: "finance_provider_id", type: "INTEGER", pk: false, uq: false, nn: true, fk: "finance_providers.id", comment: "FK -> finance_providers.id" },
      { name: "emi_amount", type: "DECIMAL(65,30)", pk: false, uq: false, nn: true, comment: "Monthly installment" },
      { name: "months", type: "INTEGER", pk: false, uq: false, nn: false, comment: "Tenure duration" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Created date", default: "NOW()" }
    ]
  },
  {
    name: "whatsapp_settings",
    comment: "WhatsApp gateway credentials and configuration",
    color: "#16a34a",
    x: 1620, y: 460,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "owner_phone", type: "TEXT", pk: false, uq: false, nn: true, comment: "Owner WhatsApp phone", default: "'6375591682'" },
      { name: "status", type: "TEXT", pk: false, uq: false, nn: true, comment: "connected | disconnected", default: "'disconnected'" },
      { name: "qr_code", type: "TEXT", pk: false, uq: false, nn: false, comment: "Base64 QR code" },
      { name: "simulate_failures", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Debug flag", default: "false" },
      { name: "simulate_session_error", type: "BOOLEAN", pk: false, uq: false, nn: true, comment: "Debug flag", default: "false" }
    ]
  },
  {
    name: "whatsapp_deliveries",
    comment: "Outgoing PDF invoice WhatsApp message queue",
    color: "#15803d",
    x: 1620, y: 700,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "bill_id", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Associated Bill ID" },
      { name: "bill_number", type: "TEXT", pk: false, uq: false, nn: true, comment: "Invoice Number" },
      { name: "customer_name", type: "TEXT", pk: false, uq: false, nn: true, comment: "Customer Name" },
      { name: "mobile_number", type: "TEXT", pk: false, uq: false, nn: true, comment: "Target WhatsApp number" },
      { name: "pdf_path", type: "TEXT", pk: false, uq: false, nn: true, comment: "Stored PDF path" },
      { name: "custom_message", type: "TEXT", pk: false, uq: false, nn: false, comment: "Message text" },
      { name: "status", type: "TEXT", pk: false, uq: false, nn: true, comment: "pending | sent | failed", default: "'pending'" },
      { name: "failure_reason", type: "TEXT", pk: false, uq: false, nn: false, comment: "Failure error" },
      { name: "sent_at", type: "TIMESTAMP", pk: false, uq: false, nn: false, comment: "Delivery timestamp" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Queue time", default: "NOW()" }
    ]
  },
  {
    name: "whatsapp_audit_logs",
    comment: "Audit trail of all WhatsApp notification attempts",
    color: "#166534",
    x: 1620, y: 1000,
    columns: [
      { name: "id", type: "SERIAL", pk: true, uq: true, nn: true, comment: "Primary Key" },
      { name: "bill_id", type: "INTEGER", pk: false, uq: false, nn: true, comment: "Bill ID" },
      { name: "bill_number", type: "TEXT", pk: false, uq: false, nn: true, comment: "Invoice Number" },
      { name: "event", type: "TEXT", pk: false, uq: false, nn: true, comment: "Event type" },
      { name: "details", type: "TEXT", pk: false, uq: false, nn: false, comment: "Metadata / Response" },
      { name: "created_at", type: "TIMESTAMP", pk: false, uq: false, nn: true, comment: "Timestamp", default: "NOW()" }
    ]
  }
];

// Build ERD JSON
const erd = {
  $schema: "https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json",
  version: "3.0.0",
  database: "PostgreSQL",
  canvas: {
    width: 2400,
    height: 1400,
    offsetX: 0,
    offsetY: 0,
    zoom: 0.85
  },
  tableIds: [],
  tables: {},
  columns: {},
  relationshipIds: [],
  relationships: {},
  memos: {},
  memoIds: [],
  tableGroups: [],
  tableGroupIds: []
};

// Map column references for foreign keys
const colLookup = {}; // "table.col" -> colId
const tableLookup = {}; // "table" -> tableId

tablesData.forEach((t) => {
  const tableId = `tbl_${t.name}`;
  tableLookup[t.name] = tableId;
  erd.tableIds.push(tableId);

  const columnIds = [];
  t.columns.forEach((c) => {
    const colId = `col_${t.name}_${c.name}`;
    colLookup[`${t.name}.${c.name}`] = colId;
    columnIds.push(colId);

    erd.columns[colId] = {
      id: colId,
      name: c.name,
      dataType: c.type,
      option: {
        primaryKey: c.pk || false,
        unique: c.uq || false,
        notNull: c.nn !== false
      },
      default: c.default || "",
      comment: c.comment || ""
    };
  });

  erd.tables[tableId] = {
    id: tableId,
    name: t.name,
    comment: t.comment || "",
    columnIds: columnIds,
    ui: {
      x: t.x,
      y: t.y,
      width: 250,
      height: 40 + t.columns.length * 24,
      zIndex: 1,
      color: t.color
    }
  };
});

// Relationships
let relIdx = 1;
tablesData.forEach((t) => {
  t.columns.forEach((c) => {
    if (c.fk) {
      const [parentTable, parentCol] = c.fk.split(".");
      const parentTableId = tableLookup[parentTable];
      const parentColId = colLookup[`${parentTable}.${parentCol}`];
      const childTableId = tableLookup[t.name];
      const childColId = colLookup[`${t.name}.${c.name}`];

      if (parentTableId && parentColId && childTableId && childColId) {
        const relId = `rel_${relIdx++}_${t.name}_to_${parentTable}`;
        erd.relationshipIds.push(relId);
        erd.relationships[relId] = {
          id: relId,
          identification: false,
          relationshipType: c.uq ? "One Only One" : "One N",
          start: {
            tableId: parentTableId,
            columnIds: [parentColId],
            relation: "Parent"
          },
          end: {
            tableId: childTableId,
            columnIds: [childColId],
            relation: "Child"
          }
        };
      }
    }
  });
});

const outputPath = path.resolve(__dirname, '..', 'schema.erd.json');
fs.writeFileSync(outputPath, JSON.stringify(erd, null, 2));
console.log(`Generated ERD file at: ${outputPath}`);
