# 📋 PLAN DE IMPLEMENTACIÓN - ECOMIA APP
**Lista de Tareas Priorizadas para Llevar la App al 100% de Producción**

**Fecha de inicio:** 16 de febrero, 2026  
**Objetivo:** Resolver vulnerabilidades críticas y optimizar para producción  
**Enfoque:** Implementación segura sin romper código existente

---

## 🎯 METODOLOGÍA DE IMPLEMENTACIÓN

### Principios de Seguridad
1. ✅ **Cada tarea es independiente** - Se puede implementar por separado
2. ✅ **Testing obligatorio** - Probar antes de hacer commit
3. ✅ **Backward compatible** - No romper funcionalidad existente
4. ✅ **Branch por tarea** - Una rama por cada tarea crítica
5. ✅ **Code review** - Revisar antes de merge a main

### Workflow
```
1. Crear branch: git checkout -b feature/tarea-nombre
2. Implementar cambios
3. Probar localmente
4. Commit con mensaje descriptivo
5. Push y crear PR
6. Review y merge
7. Deploy automático en Vercel
8. Verificar en producción
```

---

## 🔴 FASE 1: SEGURIDAD CRÍTICA
**Prioridad:** MÁXIMA  
**Tiempo estimado:** 10-14 horas  
**Debe completarse antes de:** Continuar operando en producción

---

### ✅ TAREA 1.1: Validación de Webhooks de MercadoPago
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 4-6 horas  
**Branch:** `feature/mercadopago-webhook-validation`

#### Objetivo
Proteger contra fraude validando que los pagos notificados por MercadoPago son legítimos.

#### Archivos a crear
```
✅ database/migrations/20260216_add_payment_logs.sql
✅ src/lib/mercadopago/webhook-validator.ts
✅ src/app/api/webhooks/mercadopago/route.ts
```

#### Paso 1: Crear tabla de logs de pago
**Archivo:** `database/migrations/20260216_add_payment_logs.sql`

```sql
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
```

**Cómo aplicar:**
```bash
# Conectarse a Supabase y ejecutar la migración
npx supabase migration up
```

---

#### Paso 2: Crear validador de webhooks
**Archivo:** `src/lib/mercadopago/webhook-validator.ts`

```typescript
import crypto from 'crypto';

interface WebhookPayload {
  id: string;
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  live_mode: boolean;
  type: string;
  user_id: string;
}

/**
 * Valida la firma del webhook de MercadoPago
 * Documentación: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 */
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  rawBody: string,
  secret: string
): boolean {
  try {
    // Extraer ts y hash de x-signature
    // Formato: "ts=1234567890,v1=hash"
    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!ts || !hash) {
      console.error('[Webhook] Missing ts or hash in x-signature');
      return false;
    }

    // Construir el string a validar
    // Formato: id;request-id;ts
    const manifest = `id:${rawBody};request-id:${xRequestId};ts:${ts};`;

    // Generar HMAC SHA256
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    // Comparar hashes
    return hmac === hash;
  } catch (error) {
    console.error('[Webhook] Validation error:', error);
    return false;
  }
}

/**
 * Verifica el pago directamente en la API de MercadoPago
 */
export async function verifyPaymentWithApi(
  paymentId: string,
  accessToken: string
): Promise<{ valid: boolean; data: any }> {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Webhook] API verification failed:', response.status);
      return { valid: false, data: null };
    }

    const data = await response.json();
    return { valid: true, data };
  } catch (error) {
    console.error('[Webhook] API verification error:', error);
    return { valid: false, data: null };
  }
}

export function parseWebhookPayload(body: any): WebhookPayload | null {
  try {
    // Validar estructura básica
    if (!body.data?.id || !body.type) {
      return null;
    }

    return body as WebhookPayload;
  } catch {
    return null;
  }
}
```

---

#### Paso 3: Crear endpoint de webhook
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { decryptString } from '@/lib/crypto';
import {
  validateWebhookSignature,
  verifyPaymentWithApi,
  parseWebhookPayload,
} from '@/lib/mercadopago/webhook-validator';

/**
 * Webhook de MercadoPago
 * Se debe configurar en: https://www.mercadopago.com.co/developers/panel/app/{APP_ID}/webhooks
 * URL: https://ecomia-app.online/api/webhooks/mercadopago
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener headers de validación
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error('[Webhook] Missing signature headers');
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 400 }
      );
    }

    // 2. Obtener el body RAW (necesario para validar firma)
    const rawBody = await request.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('[Webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 3. Parsear payload
    const payload = parseWebhookPayload(body);
    if (!payload) {
      console.error('[Webhook] Invalid payload structure');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // 4. Solo procesar eventos de pago
    if (payload.type !== 'payment') {
      console.log('[Webhook] Ignoring non-payment event:', payload.type);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paymentId = payload.data.id;
    console.log('[Webhook] Processing payment:', paymentId);

    // 5. Obtener el access token para verificar el pago
    // Necesitamos el external_reference para saber de qué tienda/landing es
    // Primero obtenemos los datos básicos del pago
    const supabase = createServiceClient();

    // IMPORTANTE: En producción, necesitas el secret de webhook de MercadoPago
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] MERCADOPAGO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 6. Validar firma del webhook
    const isValidSignature = validateWebhookSignature(
      xSignature,
      xRequestId,
      paymentId,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error('[Webhook] Invalid signature for payment:', paymentId);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('[Webhook] Signature validated successfully');

    // 7. Verificar pago en API de MercadoPago
    // Necesitamos obtener el access token de la tienda/landing correspondiente
    // Por ahora, usamos un token temporal para obtener el external_reference
    const tempToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!tempToken) {
      console.error('[Webhook] MERCADOPAGO_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { valid, data: paymentData } = await verifyPaymentWithApi(
      paymentId,
      tempToken
    );

    if (!valid || !paymentData) {
      console.error('[Webhook] Payment verification failed:', paymentId);
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    console.log('[Webhook] Payment verified:', paymentData.status);

    // 8. Extraer external_reference
    const externalRef = paymentData.external_reference as string;
    if (!externalRef) {
      console.error('[Webhook] Missing external_reference in payment');
      return NextResponse.json(
        { error: 'Missing external_reference' },
        { status: 400 }
      );
    }

    // Format: "landing:uuid" or "store:uuid"
    const [type, resourceId] = externalRef.split(':');

    // 9. Guardar log del pago
    const logData: any = {
      mercadopago_id: paymentId,
      external_reference: externalRef,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_type: paymentData.payment_type_id,
      transaction_amount: paymentData.transaction_amount,
      currency_id: paymentData.currency_id,
      buyer_email: paymentData.payer?.email,
      webhook_data: paymentData,
      verified: true,
      verified_at: new Date().toISOString(),
    };

    if (type === 'landing') {
      logData.landing_id = resourceId;
    } else if (type === 'store') {
      logData.store_id = resourceId;
    }

    const { error: logError } = await supabase
      .from('payment_logs')
      .upsert(logData, { onConflict: 'mercadopago_id' });

    if (logError) {
      console.error('[Webhook] Error saving payment log:', logError);
      // No retornamos error porque el pago ya fue validado
    }

    // 10. Actualizar estado en landing o store si el pago fue aprobado
    if (paymentData.status === 'approved') {
      console.log('[Webhook] Payment approved, updating resource');

      if (type === 'landing' && resourceId) {
        // Marcar la landing como "paid" o agregar metadata
        const { error } = await supabase
          .from('landing_pages')
          .update({
            // Agregar campo de pago en metadata
            content: supabase.raw(`
              jsonb_set(
                COALESCE(content, '{}'::jsonb),
                '{payment_status}',
                '"paid"'::jsonb
              )
            `),
          })
          .eq('id', resourceId);

        if (error) {
          console.error('[Webhook] Error updating landing:', error);
        }
      } else if (type === 'store' && resourceId) {
        // Similar para store
        const { error } = await supabase
          .from('stores')
          .update({
            meta: supabase.raw(`
              jsonb_set(
                COALESCE(meta, '{}'::jsonb),
                '{payment_status}',
                '"paid"'::jsonb
              )
            `),
          })
          .eq('id', resourceId);

        if (error) {
          console.error('[Webhook] Error updating store:', error);
        }
      }
    }

    console.log('[Webhook] Processing completed successfully');

    return NextResponse.json({
      ok: true,
      paymentId,
      status: paymentData.status,
    });
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET para health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook' });
}
```

---

#### Paso 4: Configurar webhook en MercadoPago
**Manual:**

1. Ir a https://www.mercadopago.com.co/developers/panel
2. Seleccionar tu aplicación
3. Ir a "Webhooks"
4. Agregar URL: `https://ecomia-app.online/api/webhooks/mercadopago`
5. Seleccionar eventos: `payment`
6. Guardar

---

#### Paso 5: Agregar variables de entorno
**Archivo:** `.env.local` (no commitear)

```bash
# MercadoPago Webhook Secret (obtener del panel de MercadoPago)
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret_aqui

# MercadoPago Access Token (temporal para verificación)
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
```

---

#### Testing
```bash
# 1. Aplicar migración
npx supabase migration up

# 2. Reiniciar servidor
npm run dev

# 3. Probar webhook con curl (simular notificación)
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=test_hash" \
  -H "x-request-id: test-request-id" \
  -d '{"type":"payment","data":{"id":"12345"}}'

# 4. Verificar que el log se guardó en payment_logs
```

---

#### Checklist de completitud
- [ ] Migración de base de datos aplicada
- [ ] Archivo webhook-validator.ts creado
- [ ] Endpoint /api/webhooks/mercadopago creado
- [ ] Variables de entorno configuradas
- [ ] Webhook configurado en panel de MercadoPago
- [ ] Probado localmente
- [ ] Probado con pago real en staging
- [ ] Commit y PR creado
- [ ] Deployed en producción

---

### ✅ TAREA 1.2: Rate Limiting
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 3-4 horas  
**Branch:** `feature/rate-limiting`

#### Objetivo
Prevenir abuso de APIs limitando el número de requests por usuario/IP.

#### Archivos a crear/modificar
```
✅ src/lib/rate-limit.ts (nuevo)
✅ src/app/api/checkout/mercadopago/route.ts
✅ src/app/api/agents/route.ts
✅ src/app/api/chat/route.ts
```

#### Paso 1: Crear utilidad de rate limiting
**Archivo:** `src/lib/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests permitidos
  identifier: 'ip' | 'user' | 'both'; // Identificador
}

// Store de rate limits en memoria (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Middleware de rate limiting
 * En producción, usar Vercel KV o Upstash Redis
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<{ allowed: boolean; limit: number; remaining: number; resetAt: number }> {
  const { windowMs, maxRequests, identifier } = config;

  // Obtener identificador
  let key: string;
  if (identifier === 'ip') {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    key = `ip:${ip}`;
  } else if (identifier === 'user') {
    key = `user:${userId || 'anonymous'}`;
  } else {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    key = `both:${userId || 'anonymous'}:${ip}`;
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Si no existe o expiró, crear nuevo
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Si ya alcanzó el límite
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Incrementar contador
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Crear respuesta de rate limit excedido
 */
export function createRateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
      },
    }
  );
}

/**
 * Limpiar registros expirados (ejecutar periódicamente)
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpiar cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

/**
 * Configuraciones predefinidas
 */
export const RATE_LIMITS = {
  // Endpoints de pago: 5 requests por minuto
  PAYMENT: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    identifier: 'user' as const,
  },
  // APIs de chat: 20 requests por minuto
  CHAT: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    identifier: 'user' as const,
  },
  // Endpoints públicos: 100 requests por minuto por IP
  PUBLIC: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    identifier: 'ip' as const,
  },
  // Agentes: 10 requests por minuto
  AGENTS: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    identifier: 'user' as const,
  },
} as const;
```

---

#### Paso 2: Aplicar rate limiting en checkout
**Archivo:** `src/app/api/checkout/mercadopago/route.ts`

```typescript
// Agregar al inicio del archivo
import { rateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // ... código existente para obtener usuario ...
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  // NUEVO: Aplicar rate limiting
  const rateLimitResult = await rateLimit(
    request as NextRequest,
    RATE_LIMITS.PAYMENT,
    user?.id
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.resetAt);
  }

  // ... resto del código existente ...
}
```

---

#### Paso 3: Aplicar en otros endpoints críticos
Similar al paso anterior, agregar rate limiting en:
- `src/app/api/agents/route.ts` (RATE_LIMITS.AGENTS)
- `src/app/api/chat/route.ts` (RATE_LIMITS.CHAT)

---

#### Testing
```typescript
// Probar con múltiples requests rápidos
for (let i = 0; i < 10; i++) {
  await fetch('/api/checkout/mercadopago', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landingId: 'test' }),
  });
}
// El 6to request debe retornar 429
```

---

#### Checklist
- [ ] Archivo rate-limit.ts creado
- [ ] Rate limiting aplicado en checkout
- [ ] Rate limiting aplicado en agents
- [ ] Rate limiting aplicado en chat
- [ ] Probado localmente
- [ ] Commit y PR

---

### ✅ TAREA 1.3: Sistema de Auditoría
**Prioridad:** 🔴 ALTA  
**Tiempo:** 2-3 horas  
**Branch:** `feature/audit-logs`

#### Ver detalles en DIAGNOSTICO_TECNICO.md sección 5.1.3

---

### ✅ TAREA 1.4: Caché de Tokens MercadoPago
**Prioridad:** 🟠 MEDIA  
**Tiempo:** 1 hora  
**Branch:** `feature/token-cache`

#### Ver detalles en DIAGNOSTICO_TECNICO.md sección 5.1.4

---

## 🟠 FASE 2: BASE DE DATOS
**Prioridad:** ALTA  
**Tiempo estimado:** 7-9 horas

### ✅ TAREA 2.1: Índices de Base de Datos
**Ver detalles en DIAGNOSTICO_TECNICO.md sección 5.2.1**

### ✅ TAREA 2.2: Paginación
**Ver detalles en DIAGNOSTICO_TECNICO.md sección 5.2.2**

### ✅ TAREA 2.3: Soft Deletes
**Ver detalles en DIAGNOSTICO_TECNICO.md sección 5.2.3**

---

## 🟡 FASE 3: UX/UI
**Prioridad:** MEDIA  
**Tiempo estimado:** 10-13 horas

### ✅ TAREA 3.1: Skeleton Loaders
### ✅ TAREA 3.2: Validación de Formularios
### ✅ TAREA 3.3: Loading States

---

## 🟢 FASE 4: ESCALABILIDAD
**Prioridad:** BAJA  
**Tiempo estimado:** 12-16 horas

### ✅ TAREA 4.1: Caché en Landing Pages
### ✅ TAREA 4.2: Colas para IA
### ✅ TAREA 4.3: Monitoreo

---

## 📊 ESTADO ACTUAL DE PRODUCCIÓN

### 🎯 NIVEL DE COMPLETITUD: **65%**

La aplicación está **funcional** pero con **vulnerabilidades críticas**. Se requiere completar las tareas de seguridad para llegar al 100%.

#### Desglose por área:
- ✅ **Funcionalidad Core**: 90% - Sistema funciona correctamente
- ⚠️ **Seguridad**: 40% - Vulnerabilidades críticas pendientes
- ✅ **Performance Base**: 70% - Funcionando pero sin optimizar
- 🟡 **UX/UI**: 60% - Funcional pero mejorable
- 🟡 **Escalabilidad**: 50% - Preparado para escala básica

---

## 📋 CHECKLIST GENERAL DE TAREAS

### 🔴 FASE 1: SEGURIDAD CRÍTICA (Peso: 30%)
**Estado actual: 0% completado | 0 de 4 tareas**

- [ ] **Tarea 1.1: Webhooks MercadoPago** [CRÍTICO]
  - [ ] Crear migración payment_logs
  - [ ] Crear validador de webhooks
  - [ ] Crear endpoint /api/webhooks/mercadopago
  - [ ] Configurar en panel MercadoPago
  - [ ] Testing completo
  - **Impacto**: +10% → 75%

- [ ] **Tarea 1.2: Rate Limiting** [CRÍTICO]
  - [ ] Crear lib/rate-limit.ts
  - [ ] Aplicar en checkout API
  - [ ] Aplicar en agents API
  - [ ] Aplicar en chat API
  - [ ] Testing con múltiples requests
  - **Impacto**: +10% → 85%

- [ ] **Tarea 1.3: Sistema de Auditoría** [ALTA]
  - [ ] Crear migración audit_logs
  - [ ] Crear audit-logger.ts
  - [ ] Integrar en acciones críticas
  - [ ] Verificar logs en Supabase
  - **Impacto**: +5% → 90%

- [ ] **Tarea 1.4: Caché de Tokens** [MEDIA]
  - [ ] Crear token-cache.ts
  - [ ] Integrar en checkout API
  - [ ] Testing de caché
  - **Impacto**: +5% → 95%

---

### 🟠 FASE 2: BASE DE DATOS (Peso: 15%)
**Estado actual: 0% completado | 0 de 3 tareas**

- [ ] **Tarea 2.1: Índices** [ALTA]
  - [ ] Crear migración con índices
  - [ ] Aplicar en Supabase
  - [ ] Verificar performance
  - **Impacto**: +2% → 97%

- [ ] **Tarea 2.2: Paginación** [ALTA]
  - [ ] Implementar en landing-pages
  - [ ] Implementar en stores
  - [ ] Implementar en research-sessions
  - [ ] Actualizar componentes UI
  - **Impacto**: +2% → 99%

- [ ] **Tarea 2.3: Soft Deletes** [MEDIA]
  - [ ] Crear migración deleted_at
  - [ ] Actualizar Server Actions
  - [ ] Testing de recuperación
  - **Impacto**: +1% → 100%

---

### 🟡 FASE 3: UX/UI (Peso: Mejoras continuas)
**Estado actual: 0% completado | 0 de 3 tareas**

- [ ] **Tarea 3.1: Skeleton Loaders**
  - [ ] Crear componente Skeleton
  - [ ] Aplicar en listas
  - **Mejora**: Experiencia de usuario

- [ ] **Tarea 3.2: Validación de Formularios**
  - [ ] Implementar Zod
  - [ ] Mensajes inline
  - **Mejora**: Reducción de errores

- [ ] **Tarea 3.3: Loading States**
  - [ ] Spinners en botones
  - [ ] Progress bars
  - **Mejora**: Feedback visual

---

### 🟢 FASE 4: ESCALABILIDAD (Peso: Preparación futura)
**Estado actual: 0% completado | 0 de 3 tareas**

- [ ] **Tarea 4.1: Caché en Landing Pages**
  - [ ] Implementar ISR
  - **Mejora**: Performance

- [ ] **Tarea 4.2: Colas para IA**
  - [ ] Implementar queue system
  - **Mejora**: Procesos largos

- [ ] **Tarea 4.3: Monitoreo**
  - [ ] Integrar Sentry
  - **Mejora**: Observabilidad

---

## 📈 PROGRESO POR FASE

```
FASE 1 (Seguridad):     [░░░░░░░░░░░░░░░░░░░░] 0%  (0/4 tareas)
FASE 2 (Base Datos):    [░░░░░░░░░░░░░░░░░░░░] 0%  (0/3 tareas)
FASE 3 (UX/UI):         [░░░░░░░░░░░░░░░░░░░░] 0%  (0/3 tareas)
FASE 4 (Escalabilidad): [░░░░░░░░░░░░░░░░░░░░] 0%  (0/3 tareas)

PROGRESO TOTAL:         [█████████████░░░░░░░] 65% → 100%
```

---

## 🎯 ROADMAP PARA LLEGAR AL 100%

### Prioridad Máxima (Completar hoy/mañana)
1. ✅ Tarea 1.1: Webhooks MercadoPago → 75%
2. ✅ Tarea 1.2: Rate Limiting → 85%

### Prioridad Alta (Esta semana)
3. ✅ Tarea 1.3: Auditoría → 90%
4. ✅ Tarea 1.4: Caché Tokens → 95%
5. ✅ Tarea 2.1: Índices → 97%

### Prioridad Media (Próxima semana)
6. ✅ Tarea 2.2: Paginación → 99%
7. ✅ Tarea 2.3: Soft Deletes → 100%

### Mejoras Continuas (Después del 100%)
- Tareas de Fase 3 y 4

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

**AHORA MISMO:**
1. ✅ Crear migración de payment_logs
2. ✅ Crear validador de webhooks
3. ✅ Crear endpoint de webhook
4. ✅ Testing local

**HOY:**
5. ✅ Aplicar rate limiting
6. ✅ Testing de límites
7. ✅ Deploy a producción

---

## 📝 NOTAS DE IMPLEMENTACIÓN

- **Última actualización**: 16/02/2026 13:56
- **Próxima revisión**: Después de cada tarea completada
- **Responsable**: Equipo de desarrollo
- **Meta**: Llegar a 100% en 5-7 días

---

**Última actualización:** 16 de febrero, 2026  
**Próxima revisión:** Después de completar Fase 1
