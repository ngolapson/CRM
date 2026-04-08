-- Tạo toàn bộ bảng cho CRM
-- Chạy file này trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "employees" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "role" text NOT NULL DEFAULT 'Admin',
  "is_protected" boolean NOT NULL DEFAULT false,
  "position" text DEFAULT 'admin',
  "username" text UNIQUE,
  "password_hash" text,
  "photo_url" text,
  "manager_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "customer_statuses" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "color" text NOT NULL DEFAULT '#6b7280',
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_system" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "customer_sources" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "icon" text
);

CREATE TABLE IF NOT EXISTS "product_types" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "slug" text
);

CREATE TABLE IF NOT EXISTS "supply_sources" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "product_type_id" integer REFERENCES "product_types"("id"),
  "supply_source_id" integer REFERENCES "supply_sources"("id"),
  "quantity" integer NOT NULL DEFAULT 0,
  "cost_price" integer NOT NULL DEFAULT 0,
  "sell_price" integer NOT NULL DEFAULT 0,
  "warranty_months" integer,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY,
  "code" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text,
  "address" text,
  "note" text,
  "status_id" integer NOT NULL REFERENCES "customer_statuses"("id"),
  "employee_id" integer NOT NULL REFERENCES "employees"("id"),
  "source_id" integer REFERENCES "customer_sources"("id"),
  "last_contact_at" timestamp,
  "next_contact_at" timestamp
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY,
  "customer_id" integer NOT NULL REFERENCES "customers"("id"),
  "closed_at" timestamp,
  "order_code" text,
  "product_type_id" integer REFERENCES "product_types"("id"),
  "supply_source_id" integer REFERENCES "supply_sources"("id"),
  "product_id" integer REFERENCES "products"("id"),
  "custom_product_name" text,
  "quantity" integer NOT NULL DEFAULT 1,
  "sell_price" integer NOT NULL DEFAULT 0,
  "cost_price" integer NOT NULL DEFAULT 0,
  "revenue" integer NOT NULL DEFAULT 0,
  "profit" integer NOT NULL DEFAULT 0,
  "warranty_months" integer,
  "warranty_source_months" integer,
  "warranty_code" text,
  "warranty_expiry" timestamp,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stock_receipts" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "quantity" integer NOT NULL,
  "import_date" date NOT NULL,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
