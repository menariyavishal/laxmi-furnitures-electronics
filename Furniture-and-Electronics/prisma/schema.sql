-- ============================================================================
-- Database Schema DDL for Laxmi Electronics & Furnitures
-- PostgreSQL Dialect (Neon Serverless)
-- Generated from prisma/schema.prisma
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS "public";

-- ----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION
-- ----------------------------------------------------------------------------
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES & CATALOG HIERARCHY
-- ----------------------------------------------------------------------------
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'FURNITURE', -- 'FURNITURE' | 'ELECTRONICS'
    "parent_category_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "categories_department_is_active_idx" ON "categories"("department", "is_active");
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS & INVENTORY
-- ----------------------------------------------------------------------------
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'FURNITURE', -- 'FURNITURE' | 'ELECTRONICS'
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "brand" TEXT,
    "product_type" TEXT NOT NULL, -- 'quantity' | 'serialized' | 'electronics'
    "cost_price" DECIMAL(65,30) NOT NULL,
    "selling_price" DECIMAL(65,30) NOT NULL,
    "quantity_in_stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "warranty_months" INTEGER DEFAULT 12,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");
CREATE INDEX "products_is_active_category_id_idx" ON "products"("is_active", "category_id");
CREATE INDEX "products_department_is_active_idx" ON "products"("department", "is_active");
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_brand_idx" ON "products"("brand");

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "product_units" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "imei_number" TEXT NOT NULL,
    "status" TEXT NOT NULL, -- 'in_stock' | 'sold' | 'defective'
    "cost_price" DECIMAL(65,30) NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sold_at" TIMESTAMP(3),

    CONSTRAINT "product_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_units_imei_number_key" ON "product_units"("imei_number");
CREATE INDEX "product_units_product_id_status_idx" ON "product_units"("product_id", "status");
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "stock_in_records" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity_added" INTEGER NOT NULL,
    "cost_price" DECIMAL(65,30) NOT NULL,
    "added_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_in_records_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "stock_in_records" ADD CONSTRAINT "stock_in_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_in_records" ADD CONSTRAINT "stock_in_records_added_by_user_id_fkey" FOREIGN KEY ("added_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 4. CUSTOMERS
-- ----------------------------------------------------------------------------
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_phone_idx" ON "customers"("phone");
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- ----------------------------------------------------------------------------
-- 5. ADVANCE BOOKINGS & PACKAGES (WEDDINGS / GIFTS)
-- ----------------------------------------------------------------------------
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "booking_number" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "event_date" TIMESTAMP(3),
    "expected_delivery_date" TIMESTAMP(3) NOT NULL,
    "total_estimated_amount" DECIMAL(65,30) NOT NULL,
    "advance_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remaining_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED' | 'PARTIALLY_DELIVERED' | 'COMPLETED' | 'CANCELLED'
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bookings_booking_number_key" ON "bookings"("booking_number");
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_expected_delivery_date_idx" ON "bookings"("expected_delivery_date");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "booking_items" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "department" TEXT NOT NULL, -- 'FURNITURE' | 'ELECTRONICS'
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "line_total" DECIMAL(65,30) NOT NULL,
    "is_billed" BOOLEAN NOT NULL DEFAULT false,
    "bill_id" INTEGER,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");
CREATE INDEX "booking_items_product_id_idx" ON "booking_items"("product_id");

ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "delivery_schedules" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "actual_delivery" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
    "driver_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_schedules_booking_id_idx" ON "delivery_schedules"("booking_id");
CREATE INDEX "delivery_schedules_scheduled_date_status_idx" ON "delivery_schedules"("scheduled_date", "status");

ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 6. BILLS & INVOICES (INSTANT / DELIVERY / TAX INVOICES)
-- ----------------------------------------------------------------------------
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "bill_number" TEXT NOT NULL,
    "bill_type" TEXT NOT NULL DEFAULT 'REGULAR', -- 'REGULAR' | 'DELIVERY_INVOICE'
    "department" TEXT NOT NULL DEFAULT 'FURNITURE', -- 'FURNITURE' | 'ELECTRONICS' | 'COMBINED'
    "booking_id" INTEGER,
    "customer_id" INTEGER,
    "created_by_user_id" INTEGER NOT NULL,
    "delivery_date" TIMESTAMP(3),
    "warranty_starts" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sgst_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cgst_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "due_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'PAID', -- 'PAID' | 'PARTIAL' | 'UNPAID'
    "payment_mode" TEXT NOT NULL, -- 'CASH' | 'UPI' | 'CARD' | 'FINANCE' | 'BANK_TRANSFER'
    "status" TEXT NOT NULL, -- 'completed' | 'voided'
    "whatsapp_status" TEXT,
    "whatsapp_sent_at" TIMESTAMP(3),
    "is_settled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");
CREATE INDEX "bills_customer_id_idx" ON "bills"("customer_id");
CREATE INDEX "bills_department_status_idx" ON "bills"("department", "status");
CREATE INDEX "bills_status_created_at_idx" ON "bills"("status", "created_at");
CREATE INDEX "bills_created_at_idx" ON "bills"("created_at");

ALTER TABLE "bills" ADD CONSTRAINT "bills_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bills" ADD CONSTRAINT "bills_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Link back booking_items to bills
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bill_items" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_unit_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "line_total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bill_items_bill_id_idx" ON "bill_items"("bill_id");
CREATE INDEX "bill_items_product_id_idx" ON "bill_items"("product_id");

ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_unit_id_fkey" FOREIGN KEY ("product_unit_id") REFERENCES "product_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 7. FINANCE & EMI PROVIDERS
-- ----------------------------------------------------------------------------
CREATE TABLE "finance_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finance_providers_name_key" ON "finance_providers"("name");

CREATE TABLE "finance_records" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "finance_provider_id" INTEGER NOT NULL,
    "emi_amount" DECIMAL(65,30) NOT NULL,
    "months" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finance_records_bill_id_key" ON "finance_records"("bill_id");

ALTER TABLE "finance_records" ADD CONSTRAINT "finance_records_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_records" ADD CONSTRAINT "finance_records_finance_provider_id_fkey" FOREIGN KEY ("finance_provider_id") REFERENCES "finance_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 8. WHATSAPP AUTOMATION & AUDIT
-- ----------------------------------------------------------------------------
CREATE TABLE "whatsapp_settings" (
    "id" SERIAL NOT NULL,
    "owner_phone" TEXT NOT NULL DEFAULT '6375591682',
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "qr_code" TEXT,
    "simulate_failures" BOOLEAN NOT NULL DEFAULT false,
    "simulate_session_error" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "whatsapp_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_deliveries" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "bill_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "pdf_path" TEXT NOT NULL,
    "custom_message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_audit_logs" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "bill_number" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_audit_logs_pkey" PRIMARY KEY ("id")
);
