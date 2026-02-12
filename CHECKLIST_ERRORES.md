# ⚡ Checklist Rápido: ¿Qué Tipo de Error Es?

## 🤔 Pregunta: "Veo errores en la consola, ¿son de mi app?"

### ✅ USA ESTE CHECKLIST RÁPIDO:

---

## 1️⃣ Mira el Nombre del Archivo

```
❌ background.js          → EXTENSIÓN (ignora)
❌ content_script.js      → EXTENSIÓN (ignora)
❌ feature_collector.js   → EXTENSIÓN (ignora)
❌ chrome-extension://... → EXTENSIÓN (ignora)

✅ page.tsx               → TU APP (reporta)
✅ route.ts               → TU APP (reporta)
✅ ChatInterface.tsx      → TU APP (reporta)
✅ _next/static/...       → TU APP (reporta)
✅ ecom-ia.online/...     → TU APP (reporta)
```

---

## 2️⃣ Mira las Palabras Clave del Error

```
❌ "tabs.get"             → EXTENSIÓN (ignora)
❌ "runtime.lastError"    → EXTENSIÓN (ignora)
❌ "chrome.tabs"          → EXTENSIÓN (ignora)
❌ "No tab with id:"      → EXTENSIÓN (ignora)

✅ "fetch failed"         → TU APP (reporta)
✅ "API error"            → TU APP (reporta)
✅ "Cannot read user"     → TU APP (reporta)
✅ "Failed to load"       → TU APP (reporta)
```

---

## 3️⃣ Prueba en Modo Incógnito

```
Ctrl+Shift+N (Windows/Linux)
Cmd+Shift+N (Mac)

¿Los errores desaparecieron?
  → SÍ: Eran de extensión (ignora)
  → NO: Son de tu app (reporta)
```

---

## 4️⃣ Verifica Funcionalidad

```
¿Las funciones de tu app trabajan?

□ Puedes iniciar sesión
□ El onboarding avanza
□ El chat responde
□ Puedes navegar

TODO funciona + errores de extensión = IGNORA
Algo NO funciona = REPORTA (con detalles)
```

---

## 🎯 DECISIÓN RÁPIDA

### Caso A: Errores de Extensión

**Características:**
- Archivos: background.js, content_script.js
- Palabras: tabs, runtime, chrome.*
- Desaparecen en incógnito
- Todo funciona bien

**Acción:** ✅ IGNORA - No son de tu app

---

### Caso B: Errores de App

**Características:**
- Archivos: page.tsx, route.ts, tu dominio
- Palabras: fetch, API, componentes
- Persisten en incógnito
- Algo no funciona

**Acción:** 🚨 REPORTA - Usa TEMPLATES_REPORTE.md

---

## 📝 Ejemplo Visual

### ❌ IGNORAR (Extensión)

```
Console:
└─ background.js:23
   └─ Uncaught TypeError: Cannot read 'htiResults'
   └─ Source: chrome-extension://abc123/background.js

Acción: Ninguna ✅
```

### 🚨 REPORTAR (App)

```
Console:
└─ page.tsx:67
   └─ Error: Failed to fetch user data
   └─ Source: https://ecom-ia.online/_next/static/chunks/page.js

Acción: Reportar con template 🚨
```

---

## 💡 TIP PRO

**Filtro de Console:**

En Chrome DevTools:
1. Console tab
2. En el filtro escribe: `-extension -background -chrome`
3. Solo verás errores de tu app

---

## ⚡ RESUMEN DE 10 SEGUNDOS

```
background.js = extensión = ignora
page.tsx = tu app = reporta
```

**¿Funciona todo? → Ignora errores de extensión**  
**¿Algo no funciona? → Reporta con detalles**

---

**Guía completa:** TROUBLESHOOTING_CONSOLA.md
