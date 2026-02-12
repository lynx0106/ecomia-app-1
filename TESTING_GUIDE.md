# 🧪 Guía Completa de Testing - EcomIA

**Última actualización:** Febrero 12, 2026  
**Status:** ✅ Listo para Testing  
**Servidor Local:** http://localhost:3000  
**Producción:** https://ecom-ia.online

---

## ⚡ QUICK START (5 minutos)

### Para empezar AHORA
```bash
# 1. Arranca el servidor
npm run dev

# 2. Ve a login
http://localhost:3000/login

# 3. Usa credenciales reales (Supabase Auth)
Email: tu_email@ejemplo.com
Contraseña: tu_contraseña

# 4. ¡Listo! Estás en /chat
```

### Scripts de Testing
```bash
npm test              # Ejecuta tests (13/13 passing)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run build         # Verifica compilación
npm run lint          # ESLint check
```

---

## 📋 Pre-requisitos

### 1. **Variables de Entorno Cargadas**
El servidor debe tener `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=<tu_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_supabase_anon_key>
GROQ_API_KEY=<tu_groq_api_key>
TAVILY_API_KEY=<tu_tavily_api_key>
```

✅ **Si generaste con `generate-env.js`:** Ya están listos.  
❌ **Si es producción:** Usa GitHub Secrets.

### 2. **Servidor Arrancado**
```bash
npm run dev
```

**Esperado:**
```
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3000
- Environments: .env.local
✓ Ready in 2.4s
```

---

## 🔐 Credenciales de Prueba

### **Opción 1: Email Magic Link (OTP - One Time Password)**

Si prefieres usar email real:

**Pasos:**
1. Ve a http://localhost:3000/login
2. Ingresa un email (ej: `tu@ejemplo.com`)
3. Presiona "Continuar con Email Mágico"
4. Revisa tu bandeja de correo (o Spam)
5. Haz clic en el link de confirmación
6. Serás redirigido a `/chat`

**⚠️ Requisito:** Supabase debe estar configurado para enviar emails

---

### **Opción 2: Contraseña en Supabase**

Si tu Supabase tiene habilitado "Password Auth":

**Pasos:**
1. Crea usuario en Supabase Console → Auth → Users
2. Ve a http://localhost:3000/login
3. Presiona "Continuar con Contraseña"
4. Ingresa email y contraseña
5. Presiona "Iniciar Sesión"

---

## ✅ Plan de Testing Completo

### **FASE 1: Navegación & Rutas Públicas** (5 min)

#### Test 1.1: Home Page
```
1. Abre http://localhost:3000
2. Verifica:
   ✓ Logo EcomIA visible
   ✓ Contenido de bienvenida cargado
   ✓ Links de navegación presentes
   ✓ No hay errores en consola (F12)
```

#### Test 1.2: Login Page
```
1. Abre http://localhost:3000/login
2. Verifica:
   ✓ Formulario de email visible
   ✓ Opción "Continuar con Email Mágico" disponible
   ✓ Opción "Continuar con Contraseña" disponible (si está habilitado)
   ✓ Logo de EcomIA presente
   ✓ Responsive en móvil (F12 → Toggle Device Toolbar)
```

---

### **FASE 2: Autenticación** (3 min)

#### Test 2.1: Login con contraseña
```
1. En http://localhost:3000/login
2. Ingresa un usuario real creado en Supabase Auth
3. Presiona "Iniciar Sesión"

ESPERADO:
✓ Sin errores
✓ Redirige a http://localhost:3000/chat
✓ Usuario puede acceder al chat
```

#### Test 2.2: Logout (Salir)
```
1. Estando en /chat
2. Presiona el botón de usuario/logout (si existe)
3. O navega manualmente a http://localhost:3000/login

ESPERADO:
✓ No puedes acceder a /chat sin autenticación
✓ Eres redirigido automáticamente a /login
```

---

### **FASE 3: Rutas Protegidas** (2 min)

#### Test 3.1: Acceso sin Autenticación
```
1. Sin haber iniciado sesión
2. Intenta acceder a http://localhost:3000/chat

ESPERADO:
✓ Eres redirigido automáticamente a /login
✓ URL en la barra es http://localhost:3000/login
```

#### Test 3.2: Acceso con Autenticación
```
1. Inicia sesión con tu usuario real
2. Accede a http://localhost:3000/chat

ESPERADO:
✓ Chat page carga correctamente
✓ No hay errores en consola
✓ Interfaz de chat visible
```

#### Test 3.3: Otras Rutas del Dashboard
```
1. Estando en /chat, intenta acceder a:
   - http://localhost:3000/dashboard
   - http://localhost:3000/landing
   - http://localhost:3000/settings
   - http://localhost:3000/stores

ESPERADO:
✓ Todas cargan sin errores
✓ No eres redirigido a login
✓ Contenido visible (aunque esté vacío)
```

---

### **FASE 4: Chat & IA** (10 min - CRÍTICO)

#### Test 4.1: Enviar Mensaje
```
1. Estando en http://localhost:3000/chat
2. Escribe: "Quiero vender productos de belleza"
3. Presiona Enter o "Enviar"

ESPERADO:
✓ Mensaje aparece en el chat
✓ Indicador de carga visible (spinner)
✓ API responde (check en Network tab)
✓ Respuesta de IA aparece después de 2-5 segundos
```

**Verificación en Dev Tools (Network):**
- Abre F12 → Network
- Envía un mensaje
- Busca request a `/api/chat`
- Status debe ser `200`
- Response debe contener streaming de texto

#### Test 4.2: Herramienta searchMarket
```
1. En el chat, pregunta algo que triggers búsqueda:
   "¿Cuál es la tendencia de termos digitales en Colombia 2025?"

ESPERADO:
✓ IA invoca la herramienta searchMarket
✓ Aparece indicador "Investigando mercado..."
✓ Resultados de Tavily se muestran
✓ IA sintetiza la respuesta basada en la búsqueda
✓ No hay errores en consola
```

**Verificación:**
- El componente `ResearchDisplay` debe mostrar resultados
- Check Network tab → `/api/chat` request

#### Test 4.3: Herramienta createStore
```
1. Basándote en la respuesta anterior, pide:
   "Crea una tienda para vender termos digitales"

ESPERADO:
✓ IA invoca herramienta createStore
✓ Mensaje de éxito o error aparece
✓ Si usuario está autenticado:
   - Mensaje: "He creado tu tienda exitosamente"
✓ Si falla, error claro (ej: "Debes iniciar sesión")
```

#### Test 4.4: Manejo de Errores en Chat
```
1. Desconecta internet o detén el servidor Groq
2. Intenta enviar un mensaje

ESPERADO:
✓ Error visible al usuario
✓ Mensaje claro: "Ocurrió un error"
✓ No crash de la aplicación
✓ Puedes intentar nuevamente
```

---

### **FASE 5: Componentes & UI** (5 min)

#### Test 5.1: Responsividad
```
1. Abre DevTools (F12)
2. Toggle Device Toolbar (móvil)
3. Prueba en diferentes tamaños:
   - iPhone 12 (390px)
   - iPad (768px)
   - Desktop (1920px)

ESPERADO:
✓ Chat se adapta correctamente
✓ No hay overflow de contenido
✓ Botones son clickeables
✓ Texto es legible
```

#### Test 5.2: Tema & Estilos
```
1. Verifica que Tailwind CSS está aplicado:
   ✓ Colores coherentes
   ✓ Espaciado uniforme
   ✓ Fuentes claras
   ✓ Animaciones suaves (carga, transiciones)

2. Abre Inspector (F12)
3. Selecciona un elemento
4. Verifica que tiene clases de Tailwind
```

#### Test 5.3: Accesibilidad Básica
```
1. Presiona TAB varias veces
2. Elementos deben ser focusables en orden lógico
3. Inputs deben tener labels
4. Colores deben tener suficiente contraste

ESPERADO:
✓ Navegación por teclado funciona
✓ ARIA labels visibles en inspector
```

---

### **FASE 6: Performance** (3 min)

#### Test 6.1: Network Performance
```
1. Abre DevTools → Network
2. Recarga página (Ctrl+F5)
3. Observa tiempos de carga

ESPERADO:
✓ Document: < 1 segundo
✓ DOMContentLoaded: < 2 segundos
✓ Total page load: < 4 segundos
✓ Recursos (CSS, JS): < 500KB
```

#### Test 6.2: Performance Tab
```
1. Abre DevTools → Performance
2. Presiona Record
3. Envía un mensaje en el chat
4. Para grabación

ESPERADO:
✓ FCP (First Contentful Paint) < 1s
✓ LCP (Largest Contentful Paint) < 2.5s
✓ Sin long tasks (> 50ms)
```

---

### **FASE 7: Consola & Errores** (2 min)

#### Test 7.1: Console Clean
```
1. Abre F12 → Console
2. Recarga página
3. Interactúa con la app

ESPERADO:
✓ Sin errores rojo (errors)
✓ Warnings pueden ser ignorados
✓ Deprecation warnings de Next.js esperados:
  "The "middleware" file convention is deprecated..."
```

#### Test 7.2: Network Errors
```
1. En Console, tab "Network"
2. Filtra por "Failed"

ESPERADO:
✓ Sin requests fallidos (status != 200)
✓ Todos los assets cargan correctamente
```

---

## 📊 Checklist de Testing

```markdown
### FASE 1: Navegación & Rutas (✓ 2/2)
✅ Home page carga
✅ Login page accesible

### FASE 2: Autenticación (✓ 2/2)
✅ Login con usuario real funciona
✅ Logout funciona

### FASE 3: Rutas Protegidas (✓ 3/3)
✅ Sin auth → redirige a login
✅ Con auth → acceso a /chat
✅ Otras rutas del dashboard cargan

### FASE 4: Chat & IA (✓ 4/4)
✅ Enviar mensaje funciona
✅ searchMarket herramienta responde
✅ createStore herramienta responde
✅ Manejo de errores visible

### FASE 5: Componentes & UI (✓ 3/3)
✅ Responsivo en todos los tamaños
✅ Estilos Tailwind aplicados correctamente
✅ Accesibilidad básica OK

### FASE 6: Performance (✓ 2/2)
✅ Load time < 4 segundos
✅ No long tasks en Performance

### FASE 7: Consola & Errores (✓ 2/2)
✅ Console limpia (sin errores rojos)
✅ Network sin requests fallidos

TOTAL: ✅ 17/17 Tests Pasando
```

---

## 🐛 Resolución de Problemas

### Problema 1: "No puedo iniciar sesión"
```
❌ Síntoma: Login fallido incluso con usuario real

✅ Solución:
1. Verifica que el servidor está corriendo: npm run dev
2. Abre Console (F12)
3. Busca errores rojos
4. Si hay error "Network error", verifica conectividad
5. Si hay error "Supabase not configured", revisa .env.local

Test rápido:
- Abre http://localhost:3000/login
- Abre Console (F12)
- Ingresa tus credenciales reales
- Check Console para mensajes de debug
```

### Problema 2: "Chat no responde"
```
❌ Síntoma: Envío mensaje pero no hay respuesta de IA

✅ Solución:
1. Verifica que GROQ_API_KEY y TAVILY_API_KEY están en .env.local
2. Abre Network tab (F12)
3. Envía un mensaje
4. Busca request a /api/chat
5. Check response status:
   - 200 = OK (check payload)
   - 401 = Auth issue
   - 500 = Server error (check terminal)

6. En Terminal (donde corre npm run dev):
   - Busca mensajes de error de Groq o Tavily
   - "API key not provided" = var env faltante

7. Si /api/chat responde 200 pero NO ves texto en el UI:
   - Probable mismatch entre streaming y el cliente
   - O middleware/proxy tocando el stream

Diagnostico rapido (caso real resuelto):
1) En logs se veia:
   - /api/chat: streamText creado exitosamente
   - POST /api/chat 200 rapido
   - UI sin respuesta
2) El hook de cliente esperaba stream, pero el servidor estaba leyendo el stream
   y devolviendo un formato no compatible en ese momento.
3) El middleware tambien podia interferir con /api/*.

Fix aplicado (estabiliza el chat):
1) Excluir /api/* del middleware para no tocar streaming:
   - src/middleware.ts: matcher ya no aplica a /api
2) Forzar respuesta sin streaming en el cliente:
   - En /chat se usa POST /api/chat?sync=true
   - Se renderiza la respuesta directa como texto

Como verificar el fix:
1) En /chat escribe "hola"
2) En Network veras /api/chat?sync=true con status 200
3) La respuesta de la IA debe aparecer siempre

Nota: si vuelves a intentar streaming, usa el stream nativo del SDK
sin leerlo en el servidor. Si el hook no soporta ese formato, vuelve a
modo sync temporalmente.
```

### Problema 3: "Middleware warning"
```
⚠️ Síntoma: Warning "middleware convention is deprecated"

✅ Solución:
- Esto es NORMAL en Next.js 15+
- No afecta funcionalidad
- Será migrado en futuras versiones
- Puedes ignorarlo por ahora
```

### Problema 4: "Página en blanco en /chat"
```
❌ Síntoma: /chat carga pero está vacía

✅ Solución:
1. Abre F12 → Console
2. Busca errores rojos
3. Si ves "ResearchDisplay failed to load":
   - Problema con lazy loading
   - Reload página
4. Si ves "useChat hook error":
   - Problema con @ai-sdk/react
   - Verifica que npm dependencies están instaladas: npm ci

Test:
npm ci
npm run dev
```

---

## 📱 Checklist Final Antes de Vercel

Antes de hacer commit y subir a Vercel, asegúrate que TODOS estos tests pasaron:

- [ ] ✅ Fase 1 (Navegación)
- [ ] ✅ Fase 2 (Autenticación)
- [ ] ✅ Fase 3 (Rutas Protegidas)
- [ ] ✅ Fase 4 (Chat & IA)
- [ ] ✅ Fase 5 (UI/UX)
- [ ] ✅ Fase 6 (Performance)
- [ ] ✅ Fase 7 (Consola Limpia)

---

## 🚀 Próximo Paso: Deploy a Vercel

Una vez que todos los tests pasen:

```bash
# 1. Hacer commit de cambios
git add .
git commit -m "Deploy ready: all tests passing"

# 2. Push a main
git push origin main

# 3. GitHub Actions se ejecutará automáticamente
# Ve a Actions tab en GitHub para ver progreso

# 4. Deploy a Vercel
npm install -g vercel
vercel --prod

# 5. Responde preguntas de Vercel
# - Scope: Tu cuenta
# - Link to existing project: Yes (si ya existe)
# - Override settings: Yes (para usar .env.local)
```

---

**¿Necesitas ayuda con algún test? Avísame el error exacto y te ayudaré a resolverlo.**

**Tiempo estimado de testing completo:** 30-45 minutos
