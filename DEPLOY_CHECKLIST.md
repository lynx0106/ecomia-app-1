# ⚡ CHECKLIST RÁPIDO - Antes & Después de Deployar

**Uso:** Antes de hacer commit y después de verlo en ecom-ia.online

---

## 🔴 PRE-DEPLOYMENT (Antes de hacer commit)

### **1. Código Funciona Localmente**
```bash
npm run dev
```
- [ ] Servidor corriendo en localhost:3000
- [ ] Sin errores en terminal
- [ ] Sin errores rojos en DevTools (F12)
- [ ] Cambios visibles cuando recargas

### **2. Build Exitoso**
```bash
npm run build
```
- [ ] Compilación completa del proyecto
- [ ] ✅ Compiled successfully
- [ ] Sin errores TypeScript

### **3. Tests Pasan**
```bash
npm test
```
- [ ] Todos los tests pasan (13/13)
- [ ] 0 fallos

### **4. Linter Limpio**
```bash
npm run lint
```
- [ ] 0 errores críticos
- [ ] Código está limpio

---

## 🟢 POST-COMMIT (Después de hacer git commit)

### **5. Git Commit Creado**
```bash
git log --oneline -1
```
- [ ] Ves tu commit más reciente
- [ ] Mensaje descriptivo

### **6. Push a Origin**
```bash
git push origin main
```
- [ ] Terminal muestra: "updating local tracking ref"
- [ ] Sin errores de autenticación

### **7. GitHub Actualizado**
```bash
# Verifica en GitHub.com
```
- [ ] Ve a: https://github.com/lynx0106/ecomia-app-1
- [ ] Click en "main" branch
- [ ] Tu commit aparece en la lista (arriba)
- [ ] Mensaje del commit es visible

---

## 🟠 DEPLOYMENT (Vercel automático)

### **⏱️ ESPERA 2-5 MINUTOS**

### **8. Vercel Detecta Cambio**
```bash
# En https://vercel.com/dashboard
```
- [ ] Ve proyecto "ecomia-app"
- [ ] En "Deployments": nuevo deployment en progreso (animated)
- [ ] Estado: "Building..." → "Deploying..." → "Ready"

### **9. Build Exitoso**
- [ ] Deployment status: ✅ "Ready"
- [ ] Tiempo de build: ~30-60 segundos
- [ ] Sin errores en logs

### **10. Sitio Web Actualizado**
```
https://ecom-ia.online
```
- [ ] Abre el sitio
- [ ] Cambios visibles
- [ ] **Fuerza recarga:** Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
- [ ] Sin errores en DevTools (F12 → Console)

---

## ❌ SI ALGO FALLA

### **Si Build Falla en Vercel:**

1. **Ve a Vercel Dashboard** → Deployments → Click en deployment fallido
2. **Lee el error en "Logs"**
3. **Ejemplo de errores comunes:**
   - TypeScript error → Fijar tipos en archivo `.ts`
   - Missing import → Agregar import faltante
   - Env var not defined → Agregar a Vercel Settings

4. **Fijar localmente:**
   ```bash
   # Edita el archivo que tiene error
   # Compila localmente:
   npm run build
   ```

5. **Hacer nuevo commit:**
   ```bash
   git add .
   git commit -m "fix: error message"
   git push origin main
   ```

6. **Vercel redeploya automáticamente**

---

### **Si Cambios No se Ven en Producción:**

**Paso 1: Verifica que Vercel está conectado correctamente**
```bash
# En Vercel Dashboard → Settings → Git
# Debe decir:
✅ Connected Repository: lynx0106/ecomia-app-1
✅ Branch: main
```

**Si está mal:** Desconecta y reconecta

**Paso 2: Limpia cache**
```bash
# En Vercel Dashboard → Settings → Data Cache
# Click: "Purge All"
# Espera 1-2 minutos
```

**Paso 3: Recarga sin cache el navegador**
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

**Paso 4: Si sigue igual, revisa git status:**
```bash
git status
# Debe mostrar: "working tree clean"

git log origin/main -1
# Debe mostrar tu commit más reciente
```

---

## 📊 RESUMEN VISUAL

```
┌──────────────────────────┐
│  CÓDIGO LOCAL            │ ← Editas archivos
│  (tu máquina)            │
└──────────────┬───────────┘
               │
               ↓ git add . && git commit
┌──────────────────────────┐
│  COMMIT CREADO           │ ✓ Verificar: git log
│  (local)                 │
└──────────────┬───────────┘
               │
               ↓ git push origin main
┌──────────────────────────┐
│  GITHUB PUSHED           │ ✓ Verificar: GitHub.com
│  (lynx0106/ecomia...)    │
└──────────────┬───────────┘
               │
               ↓ Webhook automático
┌──────────────────────────┐
│  VERCEL BUILD            │ ✓ Verificar: Vercel Dashboard
│  (en progreso)           │              (2-5 min)
└──────────────┬───────────┘
               │
               ↓ npm run build + npm test + deploy
┌──────────────────────────┐
│  VERCEL READY ✅         │ ✓ Verificar: Deployment "Ready"
│  (build exitoso)         │
└──────────────┬───────────┘
               │
               ↓ Cambios en vivo
┌──────────────────────────┐
│  ecom-ia.online VIVO     │ ✓ Verificar: sitio en navegador
│  (producción)            │              (con F5 forzado)
└──────────────────────────┘
```

---

## ✅ CONFIRMACIÓN FINAL

Cuando hayas completado todos los pasos, verifica:

```bash
# 1. Git status limpio
git status
# Output: working tree clean

# 2. Commit en origin
git log origin/main -1
# Output: tu commit más reciente

# 3. Vercel status
# URL: https://vercel.com/dashboard
# Status: ✅ Deployment ready

# 4. Sitio web
# URL: https://ecom-ia.online
# Verifica: cambios visibles sin errores
```

---

## 🎯 TIPS PRO

1. **Commit messages claros**
   ```bash
   ❌ git commit -m "fixes"
   ✅ git commit -m "fix: onboarding tour flickering on next button"
   ```

2. **Push frecuente** (cada 30-60 min de trabajo)
   ```bash
   # Evita perder cambios si hay un problema
   git push origin main
   ```

3. **Verifica Vercel cada vez que pushes**
   ```
   https://vercel.com/dashboard → Deployments
   Busca tu commit en la lista
   ```

4. **Notificaciones de Vercel**
   - Vercel puede enviar notificaciones por email si el build falla
   - Mantén las notificaciones activadas

---

## 📱 MOBILE TESTING

Cuando hagas cambios, prueba también en móvil:

```bash
# En local (dev):
# Accede desde otro dispositivo en la RED LOCAL
192.168.X.X:3000

# En producción:
# Abre en móvil: https://ecom-ia.online
# F12 DevTools → Emular móvil
```

---

**Última actualización:** 2026-02-12  
**Mantenido por:** GitHub Copilot + Manual
