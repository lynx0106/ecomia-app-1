/**
 * Onboarding Tables Migration
 * 
 * Crea dos tablas principales para el sistema de onboarding:
 * 1. onboarding_status - Estado general del onboarding por usuario
 * 2. onboarding_events - Eventos detallados del tour
 * 
 * Ejecutar en Supabase SQL Editor
 */

-- ============================================
-- TABLE: onboarding_status
-- ============================================
-- Rastrear estado general del onboarding de cada usuario

CREATE TABLE IF NOT EXISTS onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_tour BOOLEAN DEFAULT FALSE,
  tour_started_at TIMESTAMP DEFAULT NULL,
  tour_completed_at TIMESTAMP DEFAULT NULL,
  tour_skipped_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: onboarding_events
-- ============================================
-- Rastrear eventos detallados del tour para análisis

CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES - Búsquedas rápidas
-- ============================================

CREATE INDEX IF NOT EXISTS idx_onboarding_user_id 
  ON onboarding_status(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_completed 
  ON onboarding_status(completed_tour);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id 
  ON onboarding_events(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_type 
  ON onboarding_events(event_type);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_timestamp 
  ON onboarding_events(timestamp);

-- ============================================
-- TRIGGERS - Timestamps automáticos
-- ============================================

CREATE OR REPLACE FUNCTION update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_timestamp_trigger
BEFORE UPDATE ON onboarding_status
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- onboarding_status: Solo el usuario puede ver/editar su registro
CREATE POLICY "Users can view own onboarding status"
  ON onboarding_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding status"
  ON onboarding_status FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for authentication users"
  ON onboarding_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- onboarding_events: Solo el usuario puede ver sus eventos
CREATE POLICY "Users can view own onboarding events"
  ON onboarding_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert onboarding events"
  ON onboarding_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- VISTAS ÚTILES (Opcional)
-- ============================================

-- Vista: Resumen de onboarding por usuario
CREATE OR REPLACE VIEW onboarding_summary AS
SELECT 
  os.user_id,
  os.completed_tour,
  os.tour_started_at,
  os.tour_completed_at,
  os.created_at,
  COUNT(oe.id) as total_events,
  COUNT(CASE WHEN oe.event_type = 'tour_step_completed' THEN 1 END) as steps_completed,
  MAX(oe.timestamp) as last_event_at
FROM onboarding_status os
LEFT JOIN onboarding_events oe ON os.user_id = oe.user_id
GROUP BY os.user_id, os.completed_tour, os.tour_started_at, os.tour_completed_at, os.created_at;
