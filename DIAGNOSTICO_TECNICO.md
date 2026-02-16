# 📋 DIAGNÓSTICO TÉCNICO COMPLETO - ECOMIA APP
**Análisis CTO/Engineering - Estado Actual del Proyecto**

**Fecha:** 16 de febrero, 2026  
**Dominio:** ecomia-app.online  
**Despliegue:** Vercel  
**Base de Datos:** Supabase (PostgreSQL)

---

## 📊 1. RESUMEN EJECUTIVO

Ecomia es una plataforma de e-commerce potenciada por IA con un sistema multi-agente para investigación de productos, creación de landing pages, generación de contenido y soporte. El proyecto está desplegado en Vercel con un dominio personalizado y utiliza Supabase como backend.

### Estado General
- ✅ **Funcional**: La aplicación está operativa en producción
- ⚠️ **Riesgos de seguridad**: Vulnerabilidades críticas en pagos
- ⚠️ **Optimización necesaria**: Mejoras en rendimiento y UX
- ✅ **Arquitectura sólida**: Base técnica moderna y escalable

---

## 🛠️ 2. STACK TECNOLÓGICO ACTUAL

### Frontend
| Tecnología | Versión | Estado |
|------------|---------|--------|
| Next.js | 16.1.6 | ✅ Última versión estable |
| React | 19.2.3 | ✅ Última versión |
| TypeScript | 5.x | ✅ Configurado |
| Tailwind CSS | 4.x | ✅ Última versión |
| Framer Motion | 12.31.0 | ✅ Para animaciones |

### Backend
| Componente | Tecnología | Estado |
|------------|------------|--------|
| Runtime | Next.js Server Components | ✅ Bien implementado |
| API Routes | Next.js 16 App Router | ✅ Estructura clara |
| Server Actions | React Server Actions | ✅ Uso correcto |
| Base de Datos | Supabase (PostgreSQL) | ✅ Operativa |
| Autenticación | Supabase Auth + Middleware | ✅ Con refresh tokens |

### IA y Servicios Externos
| Servicio | Propósito | Estado |
|----------|-----------|--------|
| AI SDK | Framework de IA (Vercel) | ✅ Integrado |
| OpenAI | Modelos GPT | ✅ Configurado |
| X.AI | Grok models | ✅ Configurado |
| Tavily | Web search para research | ✅ Integrado |
| MercadoPago | Procesamiento de pagos | ⚠️ Sin validación de webhooks |

### Despliegue
- **Hosting**: Vercel
- **Dominio**: ecomia-app.online
- **CI/CD**: Automático desde GitHub
- **SSL**: ✅ Configurado

---

## ✅ 3. FORTALEZAS IDENTIFICADAS

### 3.1 Arquitectura y Código
1. **Next.js App Router bien implementado**
   - Server Components utilizados correctamente
   - Separación clara entre client/server
   - Route groups organizados: `(auth)`, `(dashboard)`
   - Server Actions para mutaciones de datos

2. **Estructura de proyecto limpia**
   ```
   src/
   ├── app/           # Routes y layouts
   ├── components/    # Componentes reutilizables
   ├── lib/           # Lógica de negocio
   ├── hooks/         # Custom hooks
   └── types/         # TypeScript types
   ```

3. **Sistema de agentes IA robusto**
   - 6 agentes especializados:
     - Orchestrator (routing inteligente)
     - Sourcing Agent (investigación de productos)
     - Landing Builder (creación de páginas)
     - Copy Social (contenido para redes)
     - Media Creator (estrategia visual)
     - Support Agent (atención al cliente)
   - Configuración dinámica desde base de datos
   - Prompts versionados y editables

### 3.2 Seguridad Base
1. **Autenticación robusta**
   - Middleware con refresh automático de sesiones
   - Protección de rutas automática
   - Redirección a login para usuarios no autenticados

2. **Encriptación de datos sensibles**
   ```typescript
   // src/lib/crypto.ts
   - Algoritmo: AES-256-GCM
   - IV único por encriptación
   - Auth tags para integridad
   - Tokens de MercadoPago encriptados en DB
   ```

3. **Row Level Security (RLS) en Supabase**
   - Políticas configuradas por tabla
   - Separación admin/user
   - Validación de propiedad de recursos

### 3.3 Funcionalidades Implementadas
1. **Sistema de landing pages**
   - Creación dinámica
   - Preview en tiempo real
   - Publicación con slug personalizado
   - Checkout embebido con MercadoPago

2. **Sistema de tiendas**
   - Multi-tienda por usuario
   - Configuración de dominio
   - Configuración de pagos
   - Checkout independiente

3. **Onboarding**
   - Modal interactivo
   - Tracking en base de datos
   - First login detection

4. **Sistema de tickets**
   - Soporte para usuarios
   - Panel admin para gestión

---

## 🚨 4. PROBLEMAS CRÍTICOS ENCONTRADOS

### 4.1 SEGURIDAD (Prioridad: CRÍTICA)

#### ❌ Problema 1: Sin validación de webhooks de MercadoPago
**Archivo:** `src/app/api/checkout/mercadopago/route.ts`

**Riesgo:** Un atacante puede simular pagos exitosos sin pagar

**Descripción:**
```typescript
// Actualmente solo se crea la preferencia de pago
// pero NO hay endpoint para recibir y validar webhooks
export async function POST(request: Request) {
  // ... crea preferencia ...
  return NextResponse.json({ init_point: mpPayload?.init_point });
}
```

**Impacto:**
- 🔴 Fraude en pagos
- 🔴 Pérdidas económicas
- 🔴 Incumplimiento de PCI DSS

**Solución requerida:**
1. Crear endpoint `/api/webhooks/mercadopago`
2. Validar signature con `x-signature` header
3. Verificar estado del pago en API de MercadoPago
4. Actualizar estado en base de datos

---

#### ❌ Problema 2: Sin rate limiting en APIs críticas
**Archivos afectados:**
- `src/app/api/checkout/mercadopago/route.ts`
- `src/app/api/agents/route.ts`
- `src/app/api/chat/**`

**Riesgo:** Ataques de denegación de servicio (DoS) y abuso

**Descripción:**
No hay limitación de requests por usuario/IP en endpoints sensibles

**Impacto:**
- 🔴 Costos elevados en APIs de IA
- 🔴 Abuso de MercadoPago API
- 🟠 Degradación del servicio

**Solución requerida:**
1. Implementar rate limiting por usuario
2. Rate limiting por IP para endpoints públicos
3. Rate limiting más estricto para APIs de pago

---

#### ⚠️ Problema 3: Token de MercadoPago desencriptado múltiples veces
**Archivo:** `src/app/api/checkout/mercadopago/route.ts`

```typescript
// Se desencripta en cada request de checkout
let token = '';
try {
  token = decryptString(accessTokenEnc);
} catch (error) {
  return NextResponse.json({ error: 'No se pudo descifrar el token' }, { status: 500 });
}
```

**Impacto:**
- 🟠 Mayor superficie de ataque
- 🟠 Performance degradado

**Solución requerida:**
1. Implementar caché en memoria con TTL
2. Usar variable de entorno para token en desarrollo

---

#### ⚠️ Problema 4: Sin protección CSRF
**Descripción:**
Los endpoints POST no validan CSRF tokens

**Impacto:**
- 🟠 Vulnerable a Cross-Site Request Forgery

**Solución requerida:**
1. Implementar CSRF tokens en formularios
2. Validar tokens en Server Actions

---

### 4.2 BASE DE DATOS (Prioridad: ALTA)

#### ⚠️ Problema 1: Falta índice en `landing_pages.slug`
**Tabla:** `landing_pages`

**Descripción:**
Las landing pages públicas se consultan por slug sin índice:
```sql
SELECT * FROM landing_pages WHERE slug = 'mi-landing';
-- Sin índice = O(n) en lugar de O(log n)
```

**Impacto:**
- 🟠 Queries lentos en producción con muchos registros
- 🟠 Timeout en Vercel (10s límit)

**Solución:**
```sql
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```

---

#### ⚠️ Problema 2: Sin paginación en listados
**Archivos afectados:**
- `src/app/actions/landing-pages.ts`
- `src/app/actions/stores.ts`
- `src/app/actions/research-sessions.ts`

**Descripción:**
Todos los listados cargan TODOS los registros:
```typescript
const { data } = await supabase
  .from('landing_pages')
  .select('*')
  .eq('user_id', user.id); // Sin LIMIT ni OFFSET
```

**Impacto:**
- 🟠 Performance pobre con muchos datos
- 🟠 Alto uso de memoria
- 🟠 Timeout en Vercel

**Solución requerida:**
1. Implementar paginación con `limit` y `offset`
2. Agregar cursor-based pagination para mejor UX

---

#### ⚠️ Problema 3: Sin soft deletes
**Descripción:**
Las eliminaciones son permanentes (`DELETE FROM`)

**Impacto:**
- 🟡 Imposible recuperar datos borrados por error
- 🟡 Sin auditoría de eliminaciones

**Solución requerida:**
1. Agregar columna `deleted_at` a tablas críticas
2. Modificar queries para filtrar registros eliminados

---

#### ⚠️ Problema 4: Sin tablas de auditoría
**Descripción:**
No hay logs de cambios en datos críticos

**Impacto:**
- 🟡 Sin trazabilidad de cambios
- 🟡 Dificulta debugging de problemas

**Solución requerida:**
1. Crear tabla `audit_logs`
2. Triggers para cambios importantes

---

### 4.3 PERFORMANCE (Prioridad: MEDIA)

#### ⚠️ Problema 1: Landing pages sin caché
**Archivo:** `src/app/l/[slug]/page.tsx`

```typescript
export default async function PublicLandingPage({ params }: { params: { slug: string }}) {
  // Se ejecuta en CADA request
  const supabase = createServiceClient();
  const { data: landing } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  // ...
}
```

**Impacto:**
- 🟠 Query a Supabase en cada visita
- 🟠 Costos de Supabase más altos
- 🟠 Latencia elevada

**Solución requerida:**
1. Implementar ISR (Incremental Static Regeneration)
2. Usar `revalidate` en Server Component
3. O implementar cache con Redis/Vercel KV

---

#### ⚠️ Problema 2: Imágenes sin optimización
**Descripción:**
Se usan `<div>` con background-image en lugar de `next/image`

```typescript
<div
  className="h-56 w-full rounded-2xl bg-cover bg-center"
  style={{ backgroundImage: `url(${heroImage})` }}
/>
```

**Impacto:**
- 🟡 Imágenes sin lazy loading
- 🟡 Sin optimización automática
- 🟡 Peor Core Web Vitals

**Solución:**
Usar `<Image>` de Next.js para todas las imágenes

---

#### ⚠️ Problema 3: Sin streaming de respuestas IA
**Descripción:**
Las respuestas de IA se esperan completas antes de mostrar

**Impacto:**
- 🟡 UX pobre con respuestas largas
- 🟡 Percepción de lentitud

**Solución:**
Implementar streaming con `useChat` de AI SDK

---

### 4.4 UX/UI (Prioridad: MEDIA)

#### ⚠️ Problema 1: Sin skeleton loaders
**Descripción:**
Ausencia de loading skeletons en la mayoría de vistas

**Impacto:**
- 🟡 UX pobre durante carga
- 🟡 Layout shifts

**Solución:**
Agregar Skeleton components con Tailwind

---

#### ⚠️ Problema 2: Validación de formularios mejorable
**Descripción:**
Validación básica sin feedback visual claro

**Impacto:**
- 🟡 Usuarios no entienden errores
- 🟡 Más tickets de soporte

**Solución:**
1. Usar Zod para validación
2. Mostrar errores inline en formularios

---

#### ⚠️ Problema 3: Sin indicadores de progreso en procesos largos
**Descripción:**
Procesos de IA largos sin feedback

**Impacto:**
- 🟡 Usuarios piensan que se "trabó"
- 🟡 Abandonan el proceso

**Solución:**
Agregar progress bars con estado en tiempo real

---

### 4.5 ESCALABILIDAD (Prioridad: BAJA)

#### 🟢 Problema 1: Sin colas para procesos largos
**Descripción:**
Procesos de IA se ejecutan síncronamente

**Impacto:**
- 🟢 Timeouts en Vercel (10s)
- 🟢 No se pueden ejecutar tareas >10s

**Solución:**
1. Implementar queue con Vercel Queue
2. O usar workers externos (Inngest, Trigger.dev)

---

#### 🟢 Problema 2: Sin monitoreo
**Descripción:**
No hay métricas ni alertas

**Impacto:**
- 🟢 No se detectan problemas temprano
- 🟢 Sin visibilidad de errores en producción

**Solución:**
1. Implementar Sentry para error tracking
2. Vercel Analytics para métricas
3. Logs estructurados con Winston/Pino

---

## 📋 5. PLAN DE IMPLEMENTACIÓN PRIORIZADO

### 🔴 FASE 1: SEGURIDAD CRÍTICA (Semana 1)
**Objetivo:** Eliminar vulnerabilidades de fraude y ataques

#### Tarea 1.1: Implementar validación de webhooks MercadoPago
**Archivos a crear/modificar:**
- ✅ `src/app/api/webhooks/mercadopago/route.ts` (nuevo)
- ✅ `src/lib/mercadopago/webhook-validator.ts` (nuevo)
- ✅ `database/migrations/20260216_add_payment_logs.sql` (nuevo)

**Pasos:**
1. Crear endpoint `/api/webhooks/mercadopago` POST
2. Validar signature con secret de MercadoPago
3. Verificar pago en API de MercadoPago
4. Actualizar estado en `landing_pages` o `stores`
5. Crear tabla `payment_logs` para auditoría

**Tiempo estimado:** 4-6 horas

---

#### Tarea 1.2: Implementar rate limiting
**Archivos a crear/modificar:**
- ✅ `src/lib/rate-limit.ts` (nuevo)
- ✅ `src/app/api/checkout/mercadopago/route.ts`
- ✅ `src/app/api/agents/route.ts`
- ✅ `src/app/api/chat/**/route.ts`

**Configuración sugerida:**
```typescript
// Endpoints de pago: 5 requests/minuto por usuario
// APIs de chat: 20 requests/minuto por usuario
// Endpoints públicos: 100 requests/minuto por IP
```

**Tiempo estimado:** 3-4 horas

---

#### Tarea 1.3: Crear sistema de auditoría
**Archivos a crear:**
- ✅ `database/migrations/20260216_create_audit_logs.sql`
- ✅ `src/lib/audit-logger.ts`

**Tabla `audit_logs`:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Eventos a auditar:**
- Cambios en configuración de pagos
- Publicación de landing pages
- Creación/eliminación de tiendas
- Cambios en agentes (admin)

**Tiempo estimado:** 2-3 horas

---

#### Tarea 1.4: Agregar caché para tokens de MercadoPago
**Archivos a modificar:**
- ✅ `src/lib/mercadopago/token-cache.ts` (nuevo)
- ✅ `src/app/api/checkout/mercadopago/route.ts`

**Implementación:**
```typescript
const tokenCache = new Map<string, { token: string; expires: number }>();

function getCachedToken(encryptedToken: string): string | null {
  const cached = tokenCache.get(encryptedToken);
  if (cached && cached.expires > Date.now()) {
    return cached.token;
  }
  return null;
}
```

**Tiempo estimado:** 1 hora

---

**Total Fase 1:** 10-14 horas

---

### 🟠 FASE 2: RENDIMIENTO DE BASE DE DATOS (Semana 2)
**Objetivo:** Optimizar queries y preparar para escala

#### Tarea 2.1: Agregar índices faltantes
**Archivo a crear:**
- ✅ `database/migrations/20260217_add_indexes.sql`

**Índices a crear:**
```sql
-- Landing pages
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_user_status ON landing_pages(user_id, status);

-- Stores
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_user_status ON stores(user_id, status);

-- Research sessions
CREATE INDEX idx_research_sessions_user_created ON research_sessions(user_id, created_at DESC);

-- Agent results
CREATE INDEX idx_agent_results_session ON agent_results(session_id, created_at DESC);
```

**Tiempo estimado:** 1 hora

---

#### Tarea 2.2: Implementar paginación
**Archivos a modificar:**
- ✅ `src/app/actions/landing-pages.ts`
- ✅ `src/app/actions/stores.ts`
- ✅ `src/app/actions/research-sessions.ts`
- ✅ Componentes de lista correspondientes

**Patrón a implementar:**
```typescript
export async function getLandingPages(page = 1, perPage = 10) {
  const start = (page - 1) * perPage;
  const end = start + perPage - 1;
  
  const { data, count } = await supabase
    .from('landing_pages')
    .select('*', { count: 'exact' })
    .range(start, end)
    .order('created_at', { ascending: false });
    
  return {
    data,
    page,
    perPage,
    total: count,
    totalPages: Math.ceil((count || 0) / perPage),
  };
}
```

**Tiempo estimado:** 4-5 horas

---

#### Tarea 2.3: Implementar soft deletes
**Archivos a crear/modificar:**
- ✅ `database/migrations/20260217_add_soft_deletes.sql`
- ✅ Todos los Server Actions de eliminación

**Migración:**
```sql
ALTER TABLE landing_pages ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE research_sessions ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_landing_pages_deleted ON landing_pages(deleted_at) WHERE deleted_at IS NULL;
```

**Tiempo estimado:** 2-3 horas

---

**Total Fase 2:** 7-9 horas

---

### 🟡 FASE 3: MEJORAS UX/UI (Semana 3)
**Objetivo:** Mejorar experiencia de usuario

#### Tarea 3.1: Implementar skeleton loaders
**Archivos a crear/modificar:**
- ✅ `src/components/ui/Skeleton.tsx` (nuevo)
- ✅ Componentes de lista: LandingCard, StoreCard, etc.

**Patrón:**
```typescript
export function LandingCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
      <div className="h-3 bg-slate-700 rounded w-1/2" />
    </div>
  );
}
```

**Tiempo estimado:** 3-4 horas

---

#### Tarea 3.2: Mejorar validación de formularios
**Archivos a modificar:**
- ✅ `src/components/landing/LandingCreateForm.tsx`
- ✅ `src/components/stores/StoreCreateForm.tsx`
- ✅ Otros formularios

**Implementar:**
1. Validación con Zod
2. Mensajes de error inline
3. Estados de validación visual (rojo/verde)

**Tiempo estimado:** 4-5 horas

---

#### Tarea 3.3: Agregar loading states
**Archivos a modificar:**
- ✅ `src/components/chat/ChatInterface.tsx`
- ✅ `src/components/landing/PuterLandingGenerator.tsx`
- ✅ Botones de acción

**Implementar:**
1. Spinners en botones durante acciones
2. Progress bars para procesos largos
3. Toasts de confirmación

**Tiempo estimado:** 3-4 horas

---

**Total Fase 3:** 10-13 horas

---

### 🟢 FASE 4: ESCALABILIDAD (Semana 4)
**Objetivo:** Preparar para crecimiento

#### Tarea 4.1: Implementar caché en landing pages
**Archivos a modificar:**
- ✅ `src/app/l/[slug]/page.tsx`
- ✅ `src/app/s/[slug]/page.tsx`

**Implementar ISR:**
```typescript
export const revalidate = 300; // Revalidar cada 5 minutos

export default async function PublicLandingPage({ params }) {
  // Next.js automáticamente cachea el resultado
  const landing = await getLanding(params.slug);
  return <LandingView landing={landing} />;
}
```

**Tiempo estimado:** 2-3 horas

---

#### Tarea 4.2: Implementar colas para IA
**Archivos a crear:**
- ✅ `src/lib/queue/ai-queue.ts` (nuevo)
- ✅ `src/app/api/queue/ai-job/route.ts` (nuevo)

**Opciones:**
1. Vercel Queue (recomendado, integrado)
2. Inngest (más features)
3. Bull/BullMQ con Redis

**Tiempo estimado:** 6-8 horas

---

#### Tarea 4.3: Implementar monitoreo
**Implementar:**
1. Sentry para error tracking
2. Vercel Analytics
3. Logs estructurados

**Tiempo estimado:** 4-5 horas

---

**Total Fase 4:** 12-16 horas

---

## 📈 6. MÉTRICAS DE ÉXITO

### 6.1 Seguridad
- ✅ 0 transacciones fraudulentas detectadas
- ✅ 100% de webhooks validados
- ✅ Rate limiting activo en todas las APIs críticas
- ✅ Auditoría de todas las acciones sensibles

### 6.2 Performance
- ✅ Tiempo de respuesta < 200ms en landing pages (p95)
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Todos los queries < 100ms con índices

### 6.3 UX
- ✅ Skeleton loaders en todas las listas
- ✅ Feedback visual en todos los formularios
- ✅ Progress indicators en procesos > 2s
- ✅ 0 errores sin mensaje claro

### 6.4 Escalabilidad
- ✅ Soporte para 10,000+ landings sin degradación
- ✅ Soporte para 1,000+ usuarios concurrentes
- ✅ Procesos de IA en background
- ✅ Monitoreo 24/7 con alertas

---

## 🔧 7. RECOMENDACIONES ADICIONALES

### 7.1 Seguridad Adicional
1. **Implementar 2FA** para admins
2. **Rotación de API keys** automática
3. **Límites de intentos de login** (brute force protection)
4. **CSP headers** más restrictivos
5. **HSTS** y security headers en Vercel

### 7.2 Performance
1. **CDN** para assets estáticos
2. **Edge functions** para geolocalización
3. **Database connection pooling**
4. **Query optimization** con EXPLAIN ANALYZE

### 7.3 Observabilidad
1. **Dashboards** en Grafana/Datadog
2. **Alertas proactivas** por Slack/email
3. **A/B testing** con feature flags
4. **User session recording** (Hotjar/LogRocket)

### 7.4 DevOps
1. **Staging environment** separado
2. **Preview deployments** por PR
3. **Automated testing** (Jest + Playwright)
4. **Database backup** automatizado

---

## 📝 8. CONCLUSIONES

### Estado Actual
Ecomia es una aplicación **funcional** con una base técnica **sólida**, pero con **vulnerabilidades críticas de seguridad** que deben resolverse antes de escalar. La arquitectura es moderna y escalable, pero requiere optimizaciones en performance y UX.

### Prioridades Inmediatas
1. 🔴 **CRÍTICO**: Implementar validación de webhooks de MercadoPago
2. 🔴 **CRÍTICO**: Agregar rate limiting en APIs de pago
3. 🟠 **ALTO**: Optimizar queries con índices
4. 🟠 **ALTO**: Implementar paginación

### Visión a Largo Plazo
Con las implementaciones propuestas, Ecomia estará lista para:
- ✅ Manejar 10,000+ usuarios activos
- ✅ Procesar miles de transacciones diarias de forma segura
- ✅ Escalar horizontalmente sin refactoring mayor
- ✅ Cumplir con estándares de seguridad (PCI DSS)

### Tiempo Total Estimado
- **Fase 1 (Crítica)**: 10-14 horas
- **Fase 2 (Alta)**: 7-9 horas
- **Fase 3 (Media)**: 10-13 horas
- **Fase 4 (Baja)**: 12-16 horas

**Total: 39-52 horas** (aproximadamente 5-7 días de desarrollo)

---

## 📚 9. DOCUMENTACIÓN RELACIONADA

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guía de despliegue
- [DATABASE_CONSTRAINTS.sql](./DATABASE_CONSTRAINTS.sql) - Constraints de DB
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guía de testing
- [ROADMAP.md](./ROADMAP.md) - Roadmap del proyecto

---

**Documento creado por:** Análisis CTO/Engineering  
**Última actualización:** 16 de febrero, 2026  
**Próxima revisión:** Después de implementar Fase 1
