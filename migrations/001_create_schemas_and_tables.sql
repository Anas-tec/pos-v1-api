-- Migration: 001_create_schemas_and_tables.sql
-- Description: Create 'organisation' and 'pos_v1' schemas and all 8 required tables with constraints and indexes

-- 1. Create Schemas
CREATE SCHEMA IF NOT EXISTS organisation;
CREATE SCHEMA IF NOT EXISTS pos_v1;

-- 2. Create organisation.users
CREATE TABLE IF NOT EXISTS organisation.users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  otp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- 3. Create organisation.user_otps (Retained for future OTP functionality)
CREATE TABLE IF NOT EXISTS organisation.user_otps (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES organisation.users(id),
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempt_count NUMERIC(12,4) NOT NULL DEFAULT 0,
  verified_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- 4. Create organisation.companies
CREATE TABLE IF NOT EXISTS organisation.companies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(25) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  email VARCHAR(255),
  address VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- 5. Create organisation.user_company_xref
CREATE TABLE IF NOT EXISTS organisation.user_company_xref (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES organisation.users(id),
  company_id BIGINT NOT NULL REFERENCES organisation.companies(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  CONSTRAINT uq_user_company UNIQUE (user_id, company_id)
);

-- 6. Create pos_v1.products
CREATE TABLE IF NOT EXISTS pos_v1.products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES organisation.companies(id),
  code VARCHAR(25) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(25) NOT NULL DEFAULT 'PCS',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  CONSTRAINT uq_company_product_code UNIQUE (company_id, code)
);

-- 7. Create pos_v1.product_pricings
CREATE TABLE IF NOT EXISTS pos_v1.product_pricings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES organisation.companies(id),
  product_id BIGINT NOT NULL REFERENCES pos_v1.products(id),
  selling_price NUMERIC(12,4) NOT NULL,
  effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  CONSTRAINT chk_selling_price_non_negative CHECK (selling_price >= 0),
  CONSTRAINT chk_effective_to_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- 8. Create pos_v1.invoices
CREATE TABLE IF NOT EXISTS pos_v1.invoices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES organisation.companies(id),
  invoice_number VARCHAR(25) NOT NULL,
  invoice_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal NUMERIC(16,4) NOT NULL DEFAULT 0,
  discount NUMERIC(16,4) NOT NULL DEFAULT 0,
  tax NUMERIC(16,4) NOT NULL DEFAULT 0,
  total_amount NUMERIC(16,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  CONSTRAINT uq_company_invoice_number UNIQUE (company_id, invoice_number)
);

-- 9. Create pos_v1.invoice_lines
CREATE TABLE IF NOT EXISTS pos_v1.invoice_lines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES pos_v1.invoices(id),
  product_id BIGINT NOT NULL REFERENCES pos_v1.products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  unit_price NUMERIC(12,4) NOT NULL,
  discount NUMERIC(16,4) NOT NULL DEFAULT 0,
  tax NUMERIC(16,4) NOT NULL DEFAULT 0,
  line_total NUMERIC(16,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  CONSTRAINT chk_qty_positive CHECK (quantity > 0),
  CONSTRAINT chk_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT chk_discount_non_negative CHECK (discount >= 0),
  CONSTRAINT chk_tax_non_negative CHECK (tax >= 0),
  CONSTRAINT chk_line_total_non_negative CHECK (line_total >= 0)
);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON organisation.users (google_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_email ON organisation.users (email) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_company_user ON organisation.user_company_xref (user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_company ON organisation.user_company_xref (company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON pos_v1.products (company_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_product_pricings_product ON pos_v1.product_pricings (product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricings_lookup ON pos_v1.product_pricings (product_id, is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_invoices_company_date ON pos_v1.invoices (company_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON pos_v1.invoice_lines (invoice_id);
