-- Migration: Add audit_logs table for compliance and security auditing
-- Date: Feb 16, 2026
-- Purpose: Track all critical actions for security and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario que realizó la acción
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  
  -- Acción realizada
  action VARCHAR(100) NOT NULL, -- create, update, delete, login, payment, etc
  entity_type VARCHAR(100), -- landing_page, store, product, payment, etc
  entity_id UUID,
  
  -- Cambios realizados
  changes JSONB, -- {old_values: {}, new_values: {}}
  
  -- Detalles
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'success', -- success, error, failed_auth
  error_message TEXT,
  
  -- Metadata
  metadata JSONB, -- Información adicional según contexto
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Para queries por rango de fechas (auditoría común)
CREATE INDEX idx_audit_logs_date_range ON audit_logs(created_at DESC, user_id);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver audit logs
CREATE POLICY audit_logs_admin_view ON audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Usuarios pueden ver solo sus propias acciones
CREATE POLICY audit_logs_user_view ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de todas las acciones críticas para cumplimiento normativo y seguridad';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de acción: create, update, delete, login, payment, export, etc';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipo de entidad afectada: landing_page, store, product, payment, user, etc';
COMMENT ON COLUMN audit_logs.changes IS 'JSON con cambios: {old_values: {...}, new_values: {...}}';
COMMENT ON COLUMN audit_logs.status IS 'Estado de la acción: success, error, failed_auth, warning';
