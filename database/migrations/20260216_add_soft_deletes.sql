-- Migration: Add soft deletes to critical tables
-- Date: Feb 16, 2026
-- Purpose: Allow data recovery by soft-deleting records instead of permanent deletion

-- ============================================
-- ADD deleted_at COLUMN TO LANDING_PAGES
-- ============================================

ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update RLS policy to filter out deleted records by default
CREATE OR REPLACE FUNCTION landing_pages_not_deleted_filter()
RETURNS VOID AS $$
BEGIN
  -- This function is for documentation - actual filtering happens in queries
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Index for soft deletes queries (important for performance)
CREATE INDEX IF NOT EXISTS idx_landing_pages_deleted_at 
  ON landing_pages(deleted_at) 
  WHERE deleted_at IS NULL;

-- ============================================
-- ADD deleted_at COLUMN TO STORES
-- ============================================

ALTER TABLE stores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for soft deletes
CREATE INDEX IF NOT EXISTS idx_stores_deleted_at 
  ON stores(deleted_at) 
  WHERE deleted_at IS NULL;

-- ============================================
-- ADD deleted_at COLUMN TO RESEARCH_SESSIONS
-- ============================================

ALTER TABLE research_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for soft deletes
CREATE INDEX IF NOT EXISTS idx_research_sessions_deleted_at 
  ON research_sessions(deleted_at) 
  WHERE deleted_at IS NULL;

-- ============================================
-- ADD deleted_at COLUMN TO PRODUCTS
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for soft deletes
CREATE INDEX IF NOT EXISTS idx_products_deleted_at 
  ON products(deleted_at) 
  WHERE deleted_at IS NULL;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Soft delete a landing page
 * Usage: SELECT soft_delete_landing('uuid-here')
 */
CREATE OR REPLACE FUNCTION soft_delete_landing(landing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE landing_pages
  SET deleted_at = now(), updated_at = now()
  WHERE id = landing_id;
END;
$$ LANGUAGE plpgsql;

/**
 * Soft delete a store
 * Usage: SELECT soft_delete_store('uuid-here')
 */
CREATE OR REPLACE FUNCTION soft_delete_store(store_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET deleted_at = now(), updated_at = now()
  WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

/**
 * Restore a soft-deleted record
 * Usage: SELECT restore_landing('uuid-here')
 */
CREATE OR REPLACE FUNCTION restore_landing(landing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE landing_pages
  SET deleted_at = NULL, updated_at = now()
  WHERE id = landing_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

/**
 * Restore a soft-deleted store
 * Usage: SELECT restore_store('uuid-here')
 */
CREATE OR REPLACE FUNCTION restore_store(store_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET deleted_at = NULL, updated_at = now()
  WHERE id = store_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON COLUMN landing_pages.deleted_at 
  IS 'Timestamp when record was soft-deleted. NULL means active record.';

COMMENT ON COLUMN stores.deleted_at 
  IS 'Timestamp when record was soft-deleted. NULL means active record.';

COMMENT ON COLUMN research_sessions.deleted_at 
  IS 'Timestamp when record was soft-deleted. NULL means active record.';

COMMENT ON COLUMN products.deleted_at 
  IS 'Timestamp when record was soft-deleted. NULL means active record.';

COMMENT ON FUNCTION soft_delete_landing(UUID) 
  IS 'Soft delete a landing page (mark as deleted without removing)';

COMMENT ON FUNCTION restore_landing(UUID) 
  IS 'Restore a soft-deleted landing page';

COMMENT ON FUNCTION soft_delete_store(UUID) 
  IS 'Soft delete a store (mark as deleted without removing)';

COMMENT ON FUNCTION restore_store(UUID) 
  IS 'Restore a soft-deleted store';
