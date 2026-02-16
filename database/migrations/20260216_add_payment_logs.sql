-- Migration: Add payment_logs table for MercadoPago webhook tracking
-- Date: Feb 16, 2026
-- Purpose: Track all payment events from MercadoPago webhooks for fraud prevention

-- Tabla para registrar todos los eventos de pago
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  mercadopago_id VARCHAR(255) UNIQUE NOT NULL,
  external_reference VARCHAR(255), -- 'landing:uuid' o 'store:uuid'
  
  -- Detalles del pago
  status VARCHAR(50) NOT NULL, -- approved, pending, rejected, etc.
  status_detail VARCHAR(100),
  payment_type VARCHAR(50),
  
  -- Montos
  transaction_amount DECIMAL(10,2),
  currency_id VARCHAR(10),
  
  -- Usuario y recurso
  landing_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  buyer_email VARCHAR(255),
  
  -- Auditoría
  webhook_data JSONB, -- Guardar el payload completo
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_payment_logs_mp_id ON payment_logs(mercadopago_id);
CREATE INDEX idx_payment_logs_external_ref ON payment_logs(external_reference);
CREATE INDEX idx_payment_logs_landing ON payment_logs(landing_id);
CREATE INDEX idx_payment_logs_store ON payment_logs(store_id);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_created ON payment_logs(created_at DESC);

-- RLS Policies
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todos los pagos
CREATE POLICY payment_logs_admin_view ON payment_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Usuarios pueden ver sus propios pagos
CREATE POLICY payment_logs_user_view ON payment_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM landing_pages WHERE id = payment_logs.landing_id
      UNION
      SELECT user_id FROM stores WHERE id = payment_logs.store_id
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payment_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_logs_updated_at
  BEFORE UPDATE ON payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_logs_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE payment_logs IS 'Logs de todos los eventos de pago de MercadoPago para auditoría y prevención de fraude';
COMMENT ON COLUMN payment_logs.mercadopago_id IS 'ID del pago en MercadoPago (único)';
COMMENT ON COLUMN payment_logs.external_reference IS 'Referencia externa formato: landing:uuid o store:uuid';
COMMENT ON COLUMN payment_logs.verified IS 'Indica si el pago fue verificado contra la API de MercadoPago';
COMMENT ON COLUMN payment_logs.webhook_data IS 'Payload completo del webhook para debugging';
