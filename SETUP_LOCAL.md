# 🎨 Setup Local - Prueba Visual de Landings

Esta guía te ayudará a configurar el proyecto localmente para ver las landing pages y tiendas en acción en el navegador.

## 📋 Requisitos previos

- Node.js 18+ y npm/yarn instalados
- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- Opcional: Groq API key (para tests de chat)

## 🔧 Pasos de configuración

### 1. Clonar y preparar el proyecto

```bash
cd /workspaces/ecomia-app
npm ci
```

### 2. Configurar Supabase

#### a) Crear proyecto en Supabase
- Ve a [Supabase Dashboard](https://supabase.com)
- Crea un nuevo proyecto
- Copia las URLs y keys desde **Settings → API**

#### b) Ejecutar migrations
- Ve a **SQL Editor** en Supabase
- Copia todo el contenido de [`DATABASE_CONSTRAINTS.sql`](./DATABASE_CONSTRAINTS.sql)
- Ejecuta en el editor (Supabase ejecutará la mayoría de los comandos)

### 3. Crear archivo `.env.local`

```bash
cp .env.example .env.local
```

Completa con tus valores reales:

```env
# Obligatorio: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Opcional: Chat y IA
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
```

Donde:
- `NEXT_PUBLIC_SUPABASE_URL` → De **Settings → API → Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → De **Settings → API → anon public**
- `SUPABASE_SERVICE_ROLE_KEY` → De **Settings → API → service_role secret** (⚠️ No publiques esto)

### 4. Popular base de datos con datos de ejemplo

```bash
npm run seed
```

Este comando:
- ✅ Crea una tienda con slug `mi-tienda-ejemplo`
- ✅ Crea una landing con slug `mi-primer-landing`
- ✅ Muestra URLs de acceso

**Salida esperada:**
```
🎯 URLs para acceder:

📍 Landing Page: http://localhost:3000/l/mi-primer-landing
🏪 Tienda: http://localhost:3000/s/mi-tienda-ejemplo
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre en tu navegador:
- **Landing:** http://localhost:3000/l/mi-primer-landing
- **Tienda:** http://localhost:3000/s/mi-tienda-ejemplo

---

## 🎯 Qué ver en cada página

### Landing Page (`/l/[slug]`)
- **Título hero:** "¡Bienvenido a EcomIA!"
- **Imagen de fondo:** Unsplash (ejemplo)
- **Puntos destacados:** Características principales
- **CTA:** Botón "Comenzar ahora"
- **Footer legal:** Contacto y enlaces

### Store Page (`/s/[slug]`)
- **Nombre de tienda:** "Mi Tienda Ejemplo"
- **Tagline/Descripción**
- **Información de soporte:** WhatsApp, envíos
- **Landings vinculadas:** Lista de landings de esa tienda
- **CTA:** Botones de acción

---

## 🔐 Crear datos personalizados

Si quieres crear más landings o tiendas directamente en Supabase:

### Insertar Landing manualmente en Supabase SQL:

```sql
insert into landing_pages (
  user_id, 
  store_id, 
  title, 
  slug, 
  status, 
  content
) values (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  NULL,
  'Mi Segunda Landing',
  'mi-segunda-landing',
  'published',
  jsonb_build_object(
    'hero', jsonb_build_object(
      'title', 'Otro ejemplo',
      'subtitle', 'Contenido personalizado'
    ),
    'theme', jsonb_build_object(
      'accent', '#3b82f6'
    )
  )
);
```

### Insertar Store manualmente:

```sql
insert into stores (
  user_id, 
  name, 
  slug, 
  status,
  meta
) values (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Mi Otra Tienda',
  'mi-otra-tienda',
  'active',
  jsonb_build_object(
    'tagline', 'Nueva tienda',
    'checkout', jsonb_build_object('enabled', false)
  )
);
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Cannot find module '@supabase/supabase-js'" | Ejecuta `npm ci` nuevamente |
| "notFound()" en landing/tienda | Verifica que el `slug` existe en BD y `status='published'` |
| Variables env no se cargan | Reinicia con `npm run dev` después de crear `.env.local` |
| Error de autenticación Supabase | Checkea que `SUPABASE_SERVICE_ROLE_KEY` es correcto |

---

## 📖 Documentación adicional

- [README.md](./README.md) — Overview del proyecto
- [QUICK_START_TESTING.md](./QUICK_START_TESTING.md) — Tests automáticos
- [DATABASE_CONSTRAINTS.sql](./DATABASE_CONSTRAINTS.sql) — Schema y RLS

¡Diviértete probando EcomIA! 🚀
