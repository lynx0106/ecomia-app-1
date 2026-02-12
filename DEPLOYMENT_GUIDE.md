# 🚀 GUÍA COMPLETA DE DEPLOYMENT

**Última actualización:** Febrero 12, 2026  
**Estado:** ✅ Production-Ready

---

## 📋 TABLA DE CONTENIDOS

1. [Flujo Standard](#flujo-standard)
2. [3 Pasos para Deployar](#3-pasos-para-deployar)
3. [Checklist Pre & Post](#checklist-pre--post-deployment)
4. [Archivos Consolidados](#archivos-key-info)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## 🔄 FLUJO STANDARD

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  TU CÓDIGO LOCAL (editas archivos)                              │
│       ↓        git add . && git commit                           │
│  GITHUB ORIGIN (lynx0106/ecomia-app-1)                          │
│       ↓        git push origin main                             │
│  VERCEL DETECTA → BUILDS → DEPLOYS (2-5 min)                   │
│       ↓                                                           │
│  ecom-ia.online ✅ UPDATED                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3 PASOS PARA DEPLOYAR

### **Paso 1: Commit Local**
```bash
git add .
git commit -m "fix: descripción clara del cambio"
```

### **Paso 2: Push a GitHub**
```bash
git push origin main
```
**Nota:** NO pushees a `upstream`. Solo a `origin` (tu repositorio)

### **Paso 3: Vercel Despliega (Automático)**
```
⏱️  30-60 seg: Vercel detecta cambios en origin/main
🏗️  2-5 min: Build + Tests + Deployment
✅ ecom-ia.online está actualizado
```

---

## ✅ CHECKLIST PRE & POST DEPLOYMENT

### **ANTES DE HACER COMMIT**

- [ ] Código compila sin errores
  ```bash
  npm run build
  ```

- [ ] Tests pasan
  ```bash
  npm test
  ```

- [ ] Sin errores TypeScript
  ```bash
  npx tsc --noEmit
  ```

- [ ] ESLint limpio
  ```bash
  npm run lint
  ```

- [ ] Cambios visibles en `npm run dev` (localhost:3000)

### **DESPUÉS DE HACER PUSH (Espera 2-5 min)**

- [ ] Vercel Dashboard muestra nuevo deployment
  ```
  https://vercel.com/dashboard
  → Estado: "Building..." → "Ready"
  ```

- [ ] Build completó exitosamente (sin errores rojos)

- [ ] Website actualizado
  ```
  https://ecom-ia.online
  → Fuerza recarga: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
  → Cambios son visibles
  ```

- [ ] Console limpia (F12 → Console)
  ```
  ✅ Sin errores rojos
  ✅ Warnings normales OK
  ```

---

## 📂 ARCHIVOS KEY INFO

### **Configuración Vercel**
- Repository: `https://github.com/lynx0106/ecomia-app-1` (origin - tu repo)
- Branch: `main`
- Auto-deploy: ✅ ACTIVO
- Node version: 20.x (recomendado)

### **Verificar Configuración**
```bash
git remote -v
# Output ESPERADO:
# origin   https://github.com/lynx0106/ecomia-app-1 (fetch)
# origin   https://github.com/lynx0106/ecomia-app-1 (push)
# upstream https://github.com/lynxia25-hub/ecomia-app (fetch)
# upstream https://github.com/lynxia25-hub/ecomia-app (push)
```

### **Variables de Entorno**
En Vercel Settings → Environment Variables:
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ GROQ_API_KEY
✅ TAVILY_API_KEY
```

---

## 🚨 TROUBLESHOOTING

### **Problema: Build falla en Vercel**

**Solución:**
1. Ve a https://vercel.com/dashboard → Deployments
2. Click en deployment fallido
3. Ver logs para entender el error
4. Fijar localmente (`npm run build`)
5. Hacer nuevo commit + push
6. Vercel redeploya automáticamente

### **Problema: Cambios no se ven en producción**

**Verificar:**
1. ¿Git status limpio?
   ```bash
   git status  # debe decir "working tree clean"
   ```

2. ¿Commit llegó a GitHub?
   ```bash
   git log origin/main -1  # ve tu commit más reciente
   ```

3. ¿Vercel detectó?
   - Vercel Dashboard → Deployments
   - Tu commit debe estar en la lista

4. **Si nada pasa:**
   - Recarga navegador sin cache: Ctrl+Shift+R
   - Purga cache Vercel: Settings → Data Cache → "Purge All"
   - Espera 5-10 minutos

5. **Si sigue igual:**
   ```bash
   git push origin main --force-with-lease
   # Espera 30 sec, verifica Vercel dashboard
   ```

### **Problema: TypeScript error solo en Vercel**

**Causas:**
- Versión de Node diferente
- Archivo olvidado en .gitignore

**Solución:**
```bash
# Limpia local y recompila
rm -rf node_modules package-lock.json
npm ci
npm run build

# Si funciona local pero falla Vercel:
# Vercel puede tener versión vieja, reconectar repo
```

### **Problema: Variables de entorno no están**

**Error típico:**
```
Error: GROQ_API_KEY is not defined
```

**Solución:**
1. Ve a Vercel → Project Settings → Environment Variables
2. Verifica que GROQ_API_KEY existe
3. Si no está, agrégalo
4. Vercel automáticamente redeploya

---

## 📊 VERIFICACIÓN FINAL

Cuando completes deployment, verifica:

```bash
# 1. Git limpio
git status  
# Output: working tree clean

# 2. Commits en origin
git log origin/main -1
# Output: tu commit más reciente

# 3. Vercel status
# https://vercel.com/dashboard
# Status: ✅ Ready

# 4. Website
# https://ecom-ia.online
# Cambios visibles sin errores
```

---

## 🎯 FLUJO RESUMIDO

```
┌──────────────────────┐
│  EDITA CÓDIGO        │
│  (local)             │
└──────────────┬───────┘
               │
               ↓ npm run build (verifica local)
┌──────────────────────┐
│  GIT COMMIT          │
│  (git add .)         │
└──────────────┬───────┘
               │
               ↓ git commit -m "fix: msg"
┌──────────────────────┐
│  GIT PUSH            │
│  (a origin/main)     │
└──────────────┬───────┘
               │
               ↓ git push origin main
┌──────────────────────────────┐
│  GITHUB RECIBE CAMBIOS       │
│  (instantáneo)               │
└──────────────┬───────────────┘
               │
               ↓ Webhook automático
┌──────────────────────────────┐
│  VERCEL: BUILD + TESTS       │
│  (2-5 minutos)               │
└──────────────┬───────────────┘
               │
               ↓ npm run build + npm test
┌──────────────────────────────┐
│  VERCEL: DEPLOY              │
│  (si todo pasa)              │
└──────────────┬───────────────┘
               │
               ↓ npm start
┌──────────────────────────────┐
│  ecom-ia.online ✅ UPDATED   │
│  Cambios visibles            │
└──────────────────────────────┘
```

---

## 📱 TESTING EN PRODUCCIÓN

Después de deployar:

### En Desktop (1024px+)
- [ ] Interfaz se ve correcta
- [ ] Chat funciona
- [ ] Sidebar responde

### En Tablet (768px)
- [ ] Layout responsive
- [ ] Botones accesibles
- [ ] Scroll fluido

### En Mobile (375px)
- [ ] Menu hamburguesa funciona
- [ ] Chat legible
- [ ] Sin elementos rotos

---

## 🔐 SEGURIDAD

### ✅ HACER
- Store secrets en Vercel Settings
- Keep `.env.local` en .gitignore
- API keys nunca commiteadas
- Use tokens OAuth

### ❌ NUNCA HACER
- Commitar API keys
- Poner secrets en código
- Exponer tokens de backend

---

## ⏱️ TIMING

| Fase | Tiempo | Qué Esperar |
|------|--------|------------|
| Local build | 30s | "Compiled successfully" |
| Git push | 5s | Status en terminal |
| Vercel detect | 30-60s | Dashboard actualiza |
| Vercel build | 1-3 min | logs de build |
| Deploy | 1-2 min | Status "Ready" |
| **Total** | **2-5 min** | Cambios en vivo |

---

## 📞 FAQ

**P: ¿Cuánto tarda en verse el cambio?**
R: 2-5 minutos desde que haces `git push origin main`

**P: ¿Qué pasa si hay error?**
R: Vercel NO despliega. Recibirás notificación. Fijar local y re-push.

**P: ¿Puedo ver el progreso?**
R: Sí, en https://vercel.com/dashboard → Deployments

**P: ¿Y si cambio no se ve después de 10 min?**
R: Ver sección Troubleshooting arriba.

**P: ¿Me avisa Vercel si algo falla?**
R: Sí, por email si tienes notificaciones activas.

**P: ¿Puedo hacer rollback?**
R: Sí, `git revert <commit-hash>` o `git reset --hard HEAD~1` + push

---

## 🎓 PRÓXIMOS PASOS

1. **Haz un cambio pequeño** (color, texto)
2. **Test en local:** `npm run build`
3. **Commit:** `git commit -m "test: pequeño cambio"`
4. **Push:** `git push origin main`
5. **Verifica:** Vercel dashboard + ecom-ia.online
6. **Revert:** `git revert HEAD` (para dejar limpio)

---

## 📖 REFERENCIAS

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Build:** https://nextjs.org/docs/app/building-your-application/deploying
- **GitHub Webhooks:** https://docs.github.com/en/webhooks
- **Troubleshooting:** https://vercel.com/support

---

**Última revisión:** 2026-02-12  
**Mantenedor:** GitHub Copilot  
**Estado:** ✅ Production Ready
