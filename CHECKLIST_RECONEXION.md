# ✅ Checklist: Reconectar Vercel Paso a Paso

Usa esta guía como checklist mientras reconectas Vercel al repositorio correcto.

---

## 📋 Pre-Reconexión

Antes de empezar, asegúrate de:

- [ ] **Confirmar problema**
  - Vercel está conectado a: `lynxia25-hub/ecomia-app` ❌
  - Mi código está en: `lynx0106/ecomia-app-1` ✅
  - Por eso no se despliegan los cambios

- [ ] **Guardar Environment Variables**
  - Ve a Vercel → Settings → Environment Variables
  - Copia estos valores (guárdalos en un archivo temporal):
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `GROQ_API_KEY`
    - `TAVILY_API_KEY`

- [ ] **Tener acceso a Vercel**
  - Usuario: Tu cuenta de Vercel
  - Proyecto: El que tiene ecom-ia.online

---

## 🔧 Proceso de Reconexión

### Paso 1: Acceder a Vercel

- [ ] Abre https://vercel.com/dashboard
- [ ] Login si es necesario
- [ ] Localiza tu proyecto (el de ecom-ia.online)

### Paso 2: Ir a Settings

- [ ] Click en tu proyecto
- [ ] Click en "Settings" en el menú
- [ ] Estás en la página de configuración

### Paso 3: Configuración Git

- [ ] Click en la pestaña "Git"
- [ ] Verás: "Connected Git Repository"
- [ ] Confirma que dice: `lynxia25-hub/...` ← Problema identificado

### Paso 4: Desconectar Repo Viejo

- [ ] Busca botón "Disconnect" o similar
- [ ] Click en "Disconnect"
- [ ] Confirma la acción si te lo pide
- [ ] Espera confirmación

### Paso 5: Conectar Repo Nuevo

- [ ] Click "Connect Git Repository"
- [ ] Selecciona GitHub como proveedor
- [ ] Busca: `lynx0106/ecomia-app-1`
- [ ] Click en el repositorio
- [ ] Autoriza acceso si GitHub te lo pide
- [ ] Espera confirmación de conexión

### Paso 6: Verificar Conexión

- [ ] La página debe mostrar: "Connected to lynx0106/ecomia-app-1" ✅
- [ ] Si dice otra cosa, intenta de nuevo

### Paso 7: Configurar Environment Variables

- [ ] Ve a Settings → Environment Variables
- [ ] Verifica que estén todas:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `GROQ_API_KEY`
  - [ ] `TAVILY_API_KEY`
- [ ] Si falta alguna, agrégala con los valores que guardaste

### Paso 8: Trigger Deploy

- [ ] Ve a "Deployments"
- [ ] Click en "Redeploy" del último deployment
- [ ] O espera auto-deploy (si hiciste push recientemente)
- [ ] Verás "Building..." en el status

---

## ⏱️ Durante el Deploy

- [ ] **T+0:** Deploy iniciado
- [ ] **T+1min:** Build en progreso (puedes ver logs)
- [ ] **T+2min:** Build completándose
- [ ] **T+3min:** Status cambia a "Ready" ✅

**Mientras esperas:** Ve por un café ☕ (3-5 minutos)

---

## ✅ Post-Reconexión

### Verificación en Vercel

- [ ] **Settings → Git**
  - Muestra: `lynx0106/ecomia-app-1` ✅

- [ ] **Deployments**
  - Último deployment: Status "Ready" ✅
  - Branch: `main`
  - Commit: De lynx0106 (no lynxia25-hub)

- [ ] **Environment Variables**
  - Todas configuradas ✅
  - 4 variables presentes

### Verificación en el Sitio

- [ ] **Abrir sitio**
  - URL: https://ecom-ia.online
  - Carga correctamente ✅

- [ ] **Hard Refresh**
  - Windows/Linux: `Ctrl + Shift + R`
  - Mac: `Cmd + Shift + R`
  - Limpia el caché

- [ ] **Probar Onboarding**
  - Crea cuenta de prueba o inicia sesión
  - Aparece tutorial guiado
  - Click "Siguiente" → Avanza al siguiente paso ✅
  - Si no avanza = aún hay problema ❌

- [ ] **Probar Chat**
  - Ve a la sección de chat
  - Envía mensaje: "Hola"
  - Recibe respuesta (no "Error en el chat") ✅
  - Si hay error = revisar API keys

- [ ] **Verificar Console del Navegador**
  - F12 → Console
  - ¿Hay errores de la app? (no de extensiones)
  - Errores de `background.js` = extensión, ignorar
  - Errores de tu dominio = reportar

---

## 🎉 Confirmación Final

Si todos estos están ✅, entonces:

- [ ] **Vercel correctamente conectado**
  - Repo: lynx0106/ecomia-app-1 ✅

- [ ] **Deployment exitoso**
  - Status: Ready ✅
  - Sin errores de build ✅

- [ ] **Sitio funcional**
  - Carga correctamente ✅
  - Onboarding funciona ✅
  - Chat funciona ✅

- [ ] **Auto-deploy configurado**
  - Push a main → auto deploy ✅
  - Merge PR → auto deploy ✅

**¡ÉXITO! Todo está funcionando correctamente.** 🎊

---

## ❌ Si Algo No Funciona

### Onboarding no avanza

- [ ] Esperaste al menos 5 minutos después del deploy
- [ ] Hiciste hard refresh (Ctrl+Shift+R)
- [ ] Verificaste que el deployment esté "Ready"
- [ ] Limpiaste cookies del sitio

**Si persiste:** Revisa logs de Vercel o repórtame.

### Chat da error

- [ ] Verificaste que `GROQ_API_KEY` esté configurada
- [ ] Verificaste que `TAVILY_API_KEY` esté configurada
- [ ] Las keys son válidas (no expiradas)
- [ ] Esperaste al menos 5 minutos

**Si persiste:** Verifica las keys en sus respectivas plataformas.

### Vercel no muestra lynx0106 en la lista

- [ ] Ve a Account Settings en Vercel
- [ ] "Connected Git Accounts"
- [ ] Click en GitHub
- [ ] "Configure GitHub App"
- [ ] Asegura acceso a lynx0106
- [ ] Intenta reconectar de nuevo

### Deploy falla (status: Error)

- [ ] Ve a Deployments
- [ ] Click en el deployment fallido
- [ ] Ve "Build Logs"
- [ ] Lee el error
- [ ] Busca "Error:" o "Failed:"
- [ ] Copia el mensaje de error
- [ ] Repórtame con ese detalle

---

## 📞 Cómo Reportar Problemas

Si algo no funciona después de seguir todos los pasos:

**Incluye esta información:**

1. **¿Qué paso no funcionó?**
   - Ejemplo: "No puedo desconectar el repo viejo"

2. **¿Qué mensaje de error ves?**
   - Screenshot si es posible

3. **Estado de Vercel:**
   - ¿Qué repo muestra en Settings → Git?
   - ¿Qué status tiene el último deployment?

4. **Estado del sitio:**
   - ¿Carga ecom-ia.online?
   - ¿Qué funciona y qué no?

5. **Checklist:**
   - ¿Qué items de arriba tienen ✅?
   - ¿Cuál es el primer item con ❌?

---

## 🚀 Después de Completar Todo

**Workflow normal:**

1. Haces cambios en el código
2. Commit y push a GitHub (lynx0106)
3. (Opcional) Abres PR y haces merge
4. **Vercel auto-deploya** ← Ahora funciona ✅
5. En 3 minutos está en producción
6. ¡Listo!

**Ya no necesitas:**
- ❌ Deploy manual
- ❌ Intervención especial
- ❌ Esperar que alguien despliegue
- ❌ Preocuparte por que no se vea

**Todo es automático ahora.** 🎉

---

**Tiempo estimado total: 10-15 minutos**

**Resultado: Sistema de deployment funcionando perfectamente.** ✅
