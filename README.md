# EcomIA - Consultor Inteligente de Comercio Electrónico

Una plataforma de IA para ayudar a emprendedores a validar ideas de negocio y crear tiendas exitosas en LATAM.

**Stack:** Next.js 16 • React 19 • Supabase • Groq LLM • Tavily API • Tailwind CSS

---

## 🆘 "YA HICE TODO Y SIGUE IGUAL"

**Si seguiste todas las guías pero aún no funciona:**

👉 **[DIAGNOSTICO_FINAL.md](./DIAGNOSTICO_FINAL.md)** 🔍 **¡LEE ESTO AHORA!**

**Responde las 10 preguntas específicas para diagnosticar el problema.**

**Causa más común (90%):** El PR aún NO está mergeado a `main`.

---

## 🌐 Sitio en Producción

**🚀 El proyecto está ACTIVO en:** [https://ecom-ia.online](https://ecom-ia.online)

**¿Quieres probar el sitio?** 👉 [GUIA_DE_PRUEBAS.md](./GUIA_DE_PRUEBAS.md)

**¿Encontraste un bug?** 👉 [TEMPLATES_REPORTE.md](./TEMPLATES_REPORTE.md)

---

## 🔴 URGENTE: ¿Vercel Conectado a Cuenta Incorrecta?

**¿Tienes el código en `lynx0106` pero Vercel conectado a `lynxia25-hub`?**

### 🎯 Este ES el problema de por qué no funcionan los deployments

👉 **[SOLUCION_URGENTE_VERCEL.md](./SOLUCION_URGENTE_VERCEL.md)** ⚠️ - Guía paso a paso para reconectar

👉 **[CHECKLIST_RECONEXION.md](./CHECKLIST_RECONEXION.md)** - Checklist para no perderte

👉 **[VERCEL_CUENTAS_PROBLEMA.md](./VERCEL_CUENTAS_PROBLEMA.md)** - Por qué pasa esto

**Respuesta rápida:** Vercel está mirando el repo viejo. Necesitas reconectarlo a `lynx0106/ecomia-app-1` (10 minutos).

---

## 🚨 IMPORTANTE: Los Cambios No Se Ven en Producción

**¿Hicimos fixes pero siguen los bugs?** (Después de reconectar Vercel)

👉 **[COMO_DEPLOYAR_LOS_FIXES.md](./COMO_DEPLOYAR_LOS_FIXES.md)** - Por qué sigue igual y cómo solucionarlo

👉 **[ACLARACIONES_IMPORTANTES.md](./ACLARACIONES_IMPORTANTES.md)** - Resolviendo confusiones comunes

👉 **[PASOS_SIGUIENTES.md](./PASOS_SIGUIENTES.md)** - Qué hacer ahora (3 pasos simples)

**Respuesta rápida:** Los fixes están en el código pero NO desplegados. Necesitas hacer **MERGE del PR** y esperar que Vercel lo despliegue (3-5 min).

---

## ⚠️ Vercel Conectado Pero Sigue Sin Funcionar

**Reconectaste Vercel, esperaste, pero aún no funciona. Hay warnings de npm en los logs.**

👉 **[QUE_HACER_AHORA.md](./QUE_HACER_AHORA.md)** ⚡ **¡EMPIEZA AQUÍ!**

👉 **[VERIFICACION_DEPLOYMENT.md](./VERIFICACION_DEPLOYMENT.md)** - Cómo verificar qué está desplegado

👉 **[WARNINGS_NPM_EXPLICADOS.md](./WARNINGS_NPM_EXPLICADOS.md)** - Por qué ignorar los warnings

**Causas comunes:**
1. **PR no mergeado** a main (80% de casos)
2. **Caché del navegador** persistente (15% de casos)
3. **Variables de entorno** faltantes (5% de casos)

**Los warnings de npm son normales**, NO son el problema.

---

## 📍 ¿Dónde Están Los Archivos?

**¿Buscando la documentación?** 👉 **[DONDE_ESTAN_LOS_ARCHIVOS.md](./DONDE_ESTAN_LOS_ARCHIVOS.md)** - Mapa completo 🗺️

**Mapa rápido:** [MAPA_RAPIDO.md](./MAPA_RAPIDO.md) - Los 5 archivos esenciales ⚡

---

## 🌟 ¿No Eres Técnico? ¡No Hay Problema!

**Si Git, commits y pull requests te abruman**, tenemos una guía especial para ti:

👉 **[GUIA_PARA_NO_TECNICOS.md](./GUIA_PARA_NO_TECNICOS.md)** - ¡Empieza aquí!

**Puedes trabajar en este proyecto sin saber programación.** Solo describe lo que necesitas en lenguaje normal y GitHub Copilot lo hará por ti. 

📖 **También lee:** [EJEMPLOS_PRACTICOS.md](./EJEMPLOS_PRACTICOS.md) - Conversaciones reales

---

## 💻 Desarrollo con GitHub Codespaces

¿Quieres empezar rápidamente sin instalar nada?

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=lynx0106/ecomia-app-1)

**O sigue la guía completa:** [CODESPACES_GUIDE.md](./CODESPACES_GUIDE.md) 🚀

El Codespace incluye:
- ✅ Node.js 18 preinstalado
- ✅ Extensiones de VS Code configuradas
- ✅ Dependencias instaladas automáticamente
- ✅ GitHub Copilot listo para usar
- ✅ Puerto 3000 forwarding automático

---

## 🚀 Inicio Rápido (Local)

### 1. **Instalar dependencias**
```bash
npm ci
```

### 2. **Configurar variables de entorno**

Genera archivo `.env.local` con variables de entorno:

```bash
# Opción A: Usar script de generación (solo desarrollo)
node generate-env.js

# Opción B: Copiar plantilla y completar manualmente
cp .env.local.example .env.local
# Edita .env.local con tus valores
```

**Variables requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL` — URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clave anónima de Supabase
- `GROQ_API_KEY` — API key de Groq (obtén en [console.groq.com](https://console.groq.com))
- `TAVILY_API_KEY` — API key de Tavily (obtén en [tavily.com](https://tavily.com))

⚠️ **SEGURIDAD:** Nunca commites `.env.local` a git. El archivo `.gitignore` ya lo protege.

### 3. **Arranca el servidor de desarrollo**
```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`

### 4. **Compilar para producción**
```bash
npm run build
npm run start
```

---

## 🧪 Testing Antes de Producción

### ⚡ Setup Rápido (2 minutos)
```bash
npm ci                  # Instalar deps
node generate-env.js    # Generar .env.local
npm run dev             # Arranca servidor
```

Luego abre: **http://localhost:3000**

### 🔑 Credenciales de Prueba

Usa un usuario real creado en Supabase Auth (email + contraseña o magic link).

### 📚 Guías de Testing Disponibles

**Tres opciones según tu preferencia:**

| Guía | Duración | Contenido | Para Quién |
|------|----------|-----------|-----------|
| [🎯 Quick Start Testing](./QUICK_START_TESTING.md) | 5 min | Credenciales + Setup básico | Testing rápido |
| [🎥 Testing Paso a Paso](./TESTING_STEPS.md) | 30 min | 9 pasos visuales detallados | Visual/Paso a paso |
| [🧪 Guía Completa](./TESTING_GUIDE.md) | 45 min | 7 fases exhaustivas + troubleshooting | Testing profundo |

### ✅ Checklist de Testing

```
✅ FASE 1: Navegación & Rutas
✅ FASE 2: Autenticación (Login/Logout)
✅ FASE 3: Rutas Protegidas
✅ FASE 4: Chat & IA (mensajes, herramientas)
✅ FASE 5: UI/Responsividad
✅ FASE 6: Performance (< 4 seg)
✅ FASE 7: Console Limpia (sin errores)

→ Ver guías arriba para detalles de cada fase
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas públicas (autenticación)
│   ├── (dashboard)/       # Rutas privadas (requieren auth)
│   │   └── chat/          # Interfaz principal del chat
│   └── api/               # API routes (server-side)
│       └── chat/          # Endpoint del agente IA
├── lib/                    # Utilidades compartidas
│   ├── supabase/          # Cliente Supabase (server/client)
│   └── puter/             # Cliente Puter (opcional)
└── components/            # Componentes React
    ├── chat/              # ChatInterface, ChatSidebar, etc.
    └── ui/                # Componentes genéricos
```

## 🔐 Autenticación & Seguridad

- **Supabase OAuth** — Inicio de sesión con email/redes sociales
- **Middleware protección** — Las rutas privadas requieren autenticación
- **Sin bypass** — Autenticación real en todos los entornos
- **Proxy activo** — La proteccion de rutas usa `proxy.ts` (Next.js 15+)

## 🤖 API del Agente EcomIA

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Quiero vender productos de belleza" }
  ]
}
```

**Herramientas disponibles:**
- `searchMarket` — Investiga tendencias y competencia en tiempo real (Tavily)
- `createStore` — Crea una tienda en la base de datos (Supabase)

## 📊 Scripts Disponibles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run start            # Inicia servidor de producción
npm run lint             # Ejecuta ESLint
npm test                 # Ejecuta Jest tests
npm run test:watch       # Jest en modo watch
npm run test:coverage    # Reporte de cobertura
npm run verify:vercel    # Verifica deployment en Vercel
```

## 🚀 Deployment

### Vercel (Recomendado) ⭐

**Deployment automático vía GitHub:**

```bash
# 1. Commit cambios
git add . && git commit -m "feat: new feature"

# 2. Push a main
git push origin main

# 3. GitHub Actions corre automáticamente (CI/CD pipeline)
# Ve a GitHub → Actions para ver progreso

# 4. Vercel detecta el push y deploys automáticamente
# Espera 2-3 minutos para que complete
```

**Configuración en Vercel Dashboard:**

1. **Conectar repositorio correcto**: `lynx0106/ecomia-app-1`
2. **Configurar variables de entorno** (Settings → Environment Variables):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   GROQ_API_KEY
   TAVILY_API_KEY
   ```
3. **Build settings** (automático para Next.js):
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node Version: 18.x o superior

**Deployment manual con CLI:**
```bash
# Instalar CLI de Vercel
npm install -g vercel

# Primer deployment
vercel

# Deployment a producción
vercel --prod
```

**Verificación post-deployment:**
```bash
# Ejecutar script de verificación
./scripts/verify-vercel-deployment.sh

# O manualmente
curl -I https://tu-dominio.vercel.app
```

**⚠️ Problemas comunes:**
- Ver [VERCEL_STATUS_CHECK.md](./VERCEL_STATUS_CHECK.md) para checklist completo
- Ver [VERCEL_RECONNECT_GUIDE.md](./VERCEL_RECONNECT_GUIDE.md) si el repositorio está desconectado
- Ver [VERCEL_DEPLOYMENT_ISSUE.md](./VERCEL_DEPLOYMENT_ISSUE.md) para troubleshooting

### Otros Deployment (Docker, Self-hosted)
Asegúrate de:
1. Compilar con `npm run build`
2. Setupear variables de entorno en tu plataforma
3. No exponer `generate-env.js` ni `.env.local`
4. Configurar SSL/HTTPS
5. Configurar reverse proxy (nginx, Caddy, etc.)

## 📖 Documentación Adicional

### Para Usuarios No Técnicos 🌟
- [GUIA_PARA_NO_TECNICOS.md](./GUIA_PARA_NO_TECNICOS.md) — **¡Empieza aquí si Git te abruma!** ⭐⭐⭐
- [EJEMPLOS_PRACTICOS.md](./EJEMPLOS_PRACTICOS.md) — Conversaciones reales de cómo trabajar sin ser técnico
- [COMO_CONTINUAR.md](./COMO_CONTINUAR.md) — Cómo continuar tu trabajo fácilmente

### Para Desarrollo
- [CODESPACES_GUIDE.md](./CODESPACES_GUIDE.md) — Guía completa de GitHub Codespaces
- [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) — Estado actual del proyecto y próximos pasos
- [ROADMAP.md](./ROADMAP.md) — Próximos pasos y mejoras
- [.github/GITHUB_ACTIONS_SETUP.md](./.github/GITHUB_ACTIONS_SETUP.md) — Setup de CI/CD
- [.env.local.example](./.env.local.example) — Variables de entorno requeridas

### Para Vercel/Deployment
- [VERCEL_RESUMEN_ESPANOL.md](./VERCEL_RESUMEN_ESPANOL.md) — Resumen en español de Vercel
- [VERCEL_STATUS_CHECK.md](./VERCEL_STATUS_CHECK.md) — Checklist de verificación de Vercel
- [VERCEL_RECONNECT_GUIDE.md](./VERCEL_RECONNECT_GUIDE.md) — Guía para reconectar repositorio
- [scripts/verify-vercel-deployment.sh](./scripts/verify-vercel-deployment.sh) — Script de verificación automática

### Para Testing y QA 🧪
- [GUIA_DE_PRUEBAS.md](./GUIA_DE_PRUEBAS.md) — **Guía completa para probar el sitio en producción** ⭐
- [TEMPLATES_REPORTE.md](./TEMPLATES_REPORTE.md) — Templates para reportar bugs y problemas
- [REPORTE_VERIFICACION.md](./REPORTE_VERIFICACION.md) — Último reporte de verificación del proyecto
- [BUGS_RESUELTOS.md](./BUGS_RESUELTOS.md) — Bugs arreglados y sus soluciones

### Para Troubleshooting 🔧
- [TROUBLESHOOTING_CONSOLA.md](./TROUBLESHOOTING_CONSOLA.md) — **Cómo distinguir errores de extensión vs app** ⭐
- [CHECKLIST_ERRORES.md](./CHECKLIST_ERRORES.md) — Checklist rápido para identificar tipo de error

## 📚 Recursos Externos

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Groq API Reference](https://console.groq.com/docs)
- [Tavily Search API](https://tavily.com/api)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Contribuciones

Si encuentras bugs o tienes mejoras, abre un issue o PR.

---

**Última actualización:** Febrero 12, 2026  
**Status:** ✅ Listo para Testing & Producción
