# 🔧 CONFIGURACIÓN TÉCNICA DE VERCEL - Detalles de Implementación

**Fecha:** Febrero 12, 2026  
**Responsable:** GitHub Copilot  
**Clasificación:** Técnico / Administración

---

## 📋 ESTADO ACTUAL DE LA CONFIGURACIÓN

### **Repositorios Git Configurados**

```
Remote Name    | URL                                      | Uso
---------------|---------------------------------------------|---------------------------
origin         | https://github.com/lynx0106/ecomia-app-1 | Tu repo principal
upstream       | https://github.com/lynxia25-hub/ecomia-app| Repo original (histórico)
```

**Verificar localmente:**
```bash
git remote -v
```

---

## ✅ VERCEL SINCRONIZACIÓN (CONFIGURACIÓN RECOMENDADA)

### **Conectar Vercel a `origin` (TU REPOSITORIO)**

**Pasos:**

1. **Ve al dashboard de Vercel:**
   ```
   https://vercel.com/dashboard
   ```

2. **Selecciona proyecto "ecomia-app"**

3. **Settings → Git Connections**
   - Busca: "Connected Repository"
   - Debe mostrar: `lynx0106/ecomia-app-1` (origin)

4. **Si muestra otro repositorio:**
   - Click: "Disconnect"
   - Click: "Connect Repository"
   - Busca: `ecomia-app-1`
   - Selecciona: `lynx0106/ecomia-app-1`
   - Branch: `main`
   - Click: "Deploy"

5. **Espera a que Vercel haga un nuevo deployment**
   - Puede tomar 3-5 minutos
   - Status pasará de "Analyzing" → "Building" → "Ready"

---

## 🔄 WEBHOOK DE VERCEL

Una vez conectado a `origin`, Vercel escucha cambios automáticamente:

```
Tu código → git push origin main
              ↓
            GitHub
              ↓
            GitHub Webhook
              ↓
            Vercel (automático)
              ↓
            Build + Deploy
              ↓
            ecom-ia.online (actualizado)
```

**Tiempo total:** 2-5 minutos desde push a producción actualizada

---

## 🤖 GITHUB ACTIONS CI/CD

Archivo de configuración:
```
.github/workflows/deploy-vercel.yml
```

**Qué hace:**
1. Cuando haces `git push origin main`
2. GitHub Actions se dispara
3. Ejecuta:
   - Linting (ESLint)
   - TypeScript type-check
   - Tests (`npm test`)
   - Build (`npm run build`)
4. Si TODO pasa ✅:
   - Vercel recibe webhook
   - Despliega automáticamente
5. Si algo falla ❌:
   - GitHub muestra error
   - Vercel NO despliega
   - Recibes notificación

**Ver status:** 
- Ve a GitHub → Tu repositorio
- Click en commit
- Ve "Checks" para ver el status de GitHub Actions

---

## 🔐 VARIABLES DE ENTORNO

### **En Local (.env.local)**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
GROQ_API_KEY=xxxxx
TAVILY_API_KEY=xxxxx
```

**Importante:** NO commitas `.env.local`
```
# Verificar que .gitignore contiene:
.env.local
```

### **En Vercel (Secrets)**

**Cómo agregar:**

1. Ve a: `https://vercel.com/ecomia-app/settings/environment-variables`
2. Click: "Add Environment Variable"
3. Name: `GROQ_API_KEY`
4. Value: `xxxxx` (tu API key)
5. Environments: Production, Preview, Development
6. Click: "Save"
7. Vercel **automáticamente redeploya** con la nueva variable

**Variables de Vercel que necesitas:**

| Variable | Valor | Requerida |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública | ✅ |
| `GROQ_API_KEY` | API key de Groq | ✅ |
| `TAVILY_API_KEY` | API key de Tavily | ✅ |

---

## 📊 MONITOREO DE DEPLOYMENTS

### **Vercel Dashboard**

```
https://vercel.com/dashboard
```

**Información útil:**

1. **Deployments** (lista de todos los deployments)
   - Commit hash
   - Branch
   - Status (Building/Ready/Error)
   - Tiempo de build
   - Timestamp

2. **Analytics**
   - Requests/segundo
   - Response time
   - Errores

3. **Functions** (logs de API routes)
   - Ver logs en tiempo real
   - Errors
   - Performance

4. **Edge Network**
   - Requests, cache hits
   - Geographic distribution

---

## 🔍 DIAGNÓSTICO - Verificar Status

### **Verificación 1: ¿Vercel escucha los cambios?**

```bash
# Haz un cambio pequeño en src/app/page.tsx
# Safeguard: cambio visual solo (texto, color, etc)

git add .
git commit -m "test: small visual change to verify Vercel sync"
git push origin main

# Ve a Vercel dashboard
# Deberías ver un nuevo deployment iniciándose
# dentro de 10-30 segundos
```

**Si NO ves deployment:**
1. Vercel NO está conectado correctamente a origin
2. Reconecta (ver sección anterior)

**Si SÍ ves deployment:**
1. Espera a que termine (status "Ready")
2. Recarga ecom-ia.online
3. Verifica que el cambio está visible
4. Revert del cambio (para dejar código limpio)

### **Verificación 2: ¿Variables de entorno están presentes?**

```bash
# En Vercel, abre un deployment
# Ve a "Functions" 
# Abre logs en Deploy terminal
# Busca: "Variables cargadas"
# O haz un test con: https://ecom-ia.online/api/test
```

### **Verificación 3: ¿Build es reproducible?**

```bash
# Local:
npm run build

# Si funciona localmente pero falla en Vercel:
# 1. Verifica Node.js version
# 2. Borra node_modules local y reinstala
rm -rf node_modules package-lock.json
npm ci
npm run build

# 3. Si sigue fallando, revisa logs de Vercel
```

---

## 🚨 PROBLEMAS COMUNES & SOLUCIONES TÉCNICAS

### **Problema: "Build failed on Vercel but works locally"**

**Causas posibles:**

1. **Node.js version mismatch**
   ```
   Local: v18.x.x
   Vercel: v16.x.x (older)
   Solución: Especificar en vercel.json
   ```

   ```json
   {
     "buildCommand": "npm run build",
     "env": {
       "NODE_VERSION": "20.x"
     }
   }
   ```

2. **Missing environment variables**
   ```bash
   # Error: GROQ_API_KEY is undefined
   # Solución: agregar en Vercel Settings → Environment Variables
   ```

3. **Git history issues**
   ```bash
   # Si Vercel no ve tus commits
   git log origin/main -1  # Verifica que está ahí
   git push origin main --force-with-lease  # Re-push si needed
   ```

---

### **Problema: "Changed code but Vercel shows old version"**

**Debug steps:**

1. **Verifica que commit llegó a GitHub:**
   ```bash
   git log origin/main -5
   # Tu commit debe aparecer aquí
   ```

2. **Verifica que Vercel detectó:**
   - Vercel Dashboard → Deployments
   - Busca tu commit hash
   - Si no está, Vercel NO detectó el cambio

3. **Soluciones:**
   - Reconectar Vercel a origin (si está conectado a upstream)
   - Vercel → Settings → Git → "Disconnect" → "Connect"
   - Purge Data Cache en Vercel

4. **Ultimo recurso:**
   ```bash
   git push origin main --force-with-lease
   # Espera 30 segundos
   # Ve a Vercel dashboard
   # Debe iniciar nuevo deployment
   ```

---

### **Problema: "Vercel deployment succeeds but shows errors in browser"**

**Pasos de diagnosis:**

1. **Abre DevTools en el navegador (F12)**
   - Console: busca errores rojos
   - Network: busca requests fallidas
   - Performance: slow loads?

2. **Ejemplo de errores comunes:**
   ```javascript
   // Error: NEXT_PUBLIC_SUPABASE_URL is not defined
   // Causa: variable de entorno no en Vercel
   // Solución: agregar a Vercel Settings
   ```

3. **Si es un error de aplicación:**
   ```bash
   # Vercel → Deployments → click en "Functions"
   # Ver logs en tiempo real mientras usas la app
   ```

---

## 📈 PERFORMANCE & SCALING

### **Vercel Edge Network**

Vercel automáticamente:
- Sirve desde servidores edge más cercanos
- Cachea assets estáticos
- Comprime respuestas
- Usa HTTP/2 y HTTP/3

**Para optimizar:**
1. Imágenes: usar Next.js `<Image>` component
2. CSS: Tailwind CSS (ya configurado)
3. JS: Code splitting (Next.js automático)

---

## 🔒 SEGURIDAD

### **Tokens & Secrets**

✅ **Correcto:**
- Secrets en Vercel Settings
- `.env.local` en .gitignore
- API keys no commiteadas

❌ **NUNCA HAGAS:**
- Commitar API keys
- Exponer secrets en código
- Usar keys públicas en backend

### **CORS & Headers**

```javascript
// next.config.ts - ya configurado
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
      ],
    },
  ];
}
```

---

## 📞 SOPORTE VERCEL

### **Recursos oficiales:**
- Docs: https://vercel.com/docs
- Status: https://www.vercelstatus.com/
- Support: https://vercel.com/support

### **Contacto:**
- Si tu proyecto está en plan Pro/Enterprise
- Chat en dashboard
- Email: support@vercel.com

---

## 🔄 WORKFLOW RESUMIDO

```bash
# 1. Edita código localmente
vim src/app/page.tsx

# 2. Comprueba que funciona
npm run dev
# Levanta localhost:3000

# 3. Build local (validación)
npm run build

# 4. Commit
git commit -am "fix: algo importante"

# 5. Push a origin
git push origin main

# 6. Vercel automáticamente detecta y despliega
# (Espera 2-5 minutos)

# 7. Verifica en Vercel dashboard que "Ready"
# https://vercel.com/dashboard

# 8. Recarga producción
# https://ecom-ia.online
# (Ctrl+Shift+R para forzar sin cache)

# 9. Done! 🎉
```

---

## 📋 MANTENIMIENTO

### **Semanal:**
- Revisar Vercel Analytics
- Chequear si hay errores en Functions logs
- Actualizar dependencias menores (`npm update`)

### **Mensual:**
- Revisar security advisories
- Actualizar dependencias mayores si needed
- Revisar performance metrics

### **Trimestral:**
- Auditar variables de entorno
- Revisar cost en Vercel
- Backup de datos críticos

---

**Documento creado:** 2026-02-12  
**Versión:** 1.0  
**Clasificación:** Técnica / Referencia  
**Status:** ✅ Production Ready
