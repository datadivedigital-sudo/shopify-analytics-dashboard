-- ============================================================================
-- SHOPIFY ANALYTICS DASHBOARD - DATABASE SCHEMA
-- ============================================================================
-- PostgreSQL database schema for storing Shopify app data
-- Run this with: npm run db:migrate
-- Or manually: psql your_database < config/schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: shops
-- ----------------------------------------------------------------------------
-- Stores Shopify shop information and OAuth access tokens
-- One row per shop that installs the app
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shops (
  -- Primary key: auto-incrementing integer
  id SERIAL PRIMARY KEY,

  -- Shop domain (e.g., "mystore.myshopify.com")
  -- UNIQUE constraint ensures each shop can only install once
  shop_domain VARCHAR(255) UNIQUE NOT NULL,

  -- OAuth access token for making API calls to this shop
  -- TEXT type allows for long tokens
  -- This is sensitive data - never expose in logs or UI!
  access_token TEXT NOT NULL,

  -- API scopes granted by the merchant
  -- Comma-separated list (e.g., "read_products,read_orders")
  scopes TEXT,

  -- When the app was first installed
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Last time product data was synced from Shopify
  -- NULL if never synced
  last_sync TIMESTAMP,

  -- Ensure shop_domain is unique (belt and suspenders)
  CONSTRAINT shops_shop_domain_key UNIQUE (shop_domain)
);

-- Create index for faster lookups by shop domain
CREATE INDEX IF NOT EXISTS idx_shops_domain ON shops(shop_domain);

-- ----------------------------------------------------------------------------
-- TABLE: products_snapshot
-- ----------------------------------------------------------------------------
-- Cached product data from Shopify Admin API
-- Stores snapshot of product information to avoid excessive API calls
-- Updated via background sync job and webhooks
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products_snapshot (
  -- Primary key: auto-incrementing integer
  id SERIAL PRIMARY KEY,

  -- Which shop this product belongs to
  shop_domain VARCHAR(255) NOT NULL,

  -- Shopify product ID (e.g., "gid://shopify/Product/123456")
  -- Or numeric ID (e.g., "123456")
  shopify_product_id VARCHAR(255) NOT NULL,

  -- Product title (e.g., "Blue Cotton T-Shirt")
  title VARCHAR(500),

  -- Product handle (URL-friendly slug, e.g., "blue-cotton-t-shirt")
  handle VARCHAR(255),

  -- Vendor/brand name
  vendor VARCHAR(255),

  -- Product type/category (e.g., "Clothing", "Accessories")
  product_type VARCHAR(255),

  -- Product status: "active" or "draft"
  status VARCHAR(50),

  -- Total inventory quantity across all variants
  inventory_quantity INTEGER DEFAULT 0,

  -- Price of the first variant (for display purposes)
  -- DECIMAL(10, 2) = up to 99,999,999.99
  price DECIMAL(10, 2),

  -- URL to product image (first image)
  image_url TEXT,

  -- When this product was first added to Shopify
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- When this record was last updated from Shopify
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure each shop can only have one record per product
  CONSTRAINT products_shop_product_unique UNIQUE (shop_domain, shopify_product_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_products_shop ON products_snapshot(shop_domain);
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products_snapshot(inventory_quantity);
CREATE INDEX IF NOT EXISTS idx_products_status ON products_snapshot(status);
CREATE INDEX IF NOT EXISTS idx_products_handle ON products_snapshot(handle);

-- ----------------------------------------------------------------------------
-- TABLE: webhook_events
-- ----------------------------------------------------------------------------
-- Logs all webhook events received from Shopify
-- Useful for debugging and audit trail
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS webhook_events (
  -- Primary key: auto-incrementing integer
  id SERIAL PRIMARY KEY,

  -- Which shop sent this webhook
  shop_domain VARCHAR(255) NOT NULL,

  -- Webhook topic (e.g., "products/create", "products/update")
  topic VARCHAR(100) NOT NULL,

  -- Full webhook payload as JSON
  -- JSONB type allows querying JSON fields efficiently
  payload JSONB,

  -- Whether we've processed this webhook
  -- Useful for async processing queues
  processed BOOLEAN DEFAULT FALSE,

  -- When the webhook was received
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_webhooks_shop ON webhook_events(shop_domain);
CREATE INDEX IF NOT EXISTS idx_webhooks_topic ON webhook_events(topic);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_received ON webhook_events(received_at DESC);

-- ----------------------------------------------------------------------------
-- TABLE: sessions (Optional - for PostgreSQL session store)
-- ----------------------------------------------------------------------------
-- If using connect-pg-simple, this table stores Express sessions
-- Automatically managed by the connect-pg-simple library
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data for development

-- INSERT INTO shops (shop_domain, access_token, scopes, last_sync)
-- VALUES ('test-store.myshopify.com', 'sample-token-123', 'read_products,read_inventory', NOW());

-- INSERT INTO products_snapshot (shop_domain, shopify_product_id, title, handle, status, inventory_quantity, price)
-- VALUES
--   ('test-store.myshopify.com', '12345', 'Sample Product 1', 'sample-product-1', 'active', 50, 29.99),
--   ('test-store.myshopify.com', '12346', 'Sample Product 2', 'sample-product-2', 'active', 5, 49.99);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Database schema created successfully!';
  RAISE NOTICE '  Tables: shops, products_snapshot, webhook_events, session';
  RAISE NOTICE '  Ready for Shopify app data';
END $$;

