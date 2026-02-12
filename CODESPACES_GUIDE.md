# 🚀 Guía: Trabajar con GitHub Codespaces en EcomIA

## ¿Qué es GitHub Codespaces?

GitHub Codespaces es un entorno de desarrollo completo en la nube que te permite:
- ✅ Trabajar desde cualquier navegador
- ✅ Tener un ambiente consistente y preconfigurado
- ✅ No necesitar instalar nada en tu máquina local
- ✅ Guardar tu progreso automáticamente

---

## 🎯 Cómo Iniciar un Codespace

### Opción 1: Desde GitHub Web

1. Ve al repositorio: https://github.com/lynx0106/ecomia-app-1
2. Click en el botón verde **"Code"**
3. Selecciona la pestaña **"Codespaces"**
4. Click en **"Create codespace on [branch]"**
5. Espera 1-2 minutos mientras se crea el ambiente

### Opción 2: Desde una Pull Request

1. Ve a tu Pull Request activo
2. Click en **"Code"** → **"Codespaces"**
3. Click en **"Create codespace on [branch]"**
4. El Codespace se creará con tu rama actual

### Opción 3: Desde VS Code Desktop

1. Instala la extensión "GitHub Codespaces"
2. Cmd/Ctrl + Shift + P → "Codespaces: Create New Codespace"
3. Selecciona el repositorio `lynx0106/ecomia-app-1`
4. Selecciona tu rama

---

## 📂 Tu Entorno de Trabajo

### Estructura del Codespace

Cuando abres un Codespace, tienes:

```
/workspaces/ecomia-app-1/  ← Tu repositorio
├── src/                    ← Código fuente
├── scripts/                ← Scripts de utilidad
├── .env.local.example      ← Variables de entorno
├── package.json            ← Dependencias
└── README.md              ← Documentación
```

### Primer Setup (Solo la primera vez)

```bash
# 1. Instalar dependencias
npm ci

# 2. Copiar variables de entorno
cp .env.local.example .env.local

# 3. Editar .env.local con tus valores
# (Puedes usar el editor integrado)

# 4. Verificar que todo funciona
npm run build
npm test
```

---

## 💻 Comandos Útiles en Codespaces

### Terminal Integrada

El Codespace incluye una terminal completa. Usa estos comandos:

```bash
# Desarrollo
npm run dev                  # Servidor de desarrollo (localhost:3000)
npm run build                # Build de producción
npm test                     # Ejecutar tests
npm run lint                 # Verificar código

# Git
git status                   # Ver estado de cambios
git add .                    # Agregar cambios
git commit -m "mensaje"      # Commit
git push origin [branch]     # Push a GitHub

# Verificación de Vercel
npm run verify:vercel        # Verificar deployment

# Limpieza
./scripts/cleanup-logs.sh    # Limpiar logs
```

### Atajos de Teclado

- **Cmd/Ctrl + J**: Abrir/cerrar terminal
- **Cmd/Ctrl + B**: Abrir/cerrar sidebar
- **Cmd/Ctrl + P**: Búsqueda rápida de archivos
- **Cmd/Ctrl + Shift + F**: Búsqueda en todos los archivos
- **Cmd/Ctrl + `**: Terminal rápida

---

## 🔄 Cómo Continuar Tu Trabajo

### Guardar Tu Progreso

**✅ Automático**: Codespaces guarda tus cambios automáticamente en el navegador

**✅ Manual (Recomendado)**:
```bash
# 1. Verificar cambios
git status

# 2. Agregar y commit
git add .
git commit -m "feat: descripción de cambios"

# 3. Push a tu rama
git push origin copilot/update-documentation-and-env-example
```

### Cerrar y Reabrir el Codespace

**Para cerrar:**
1. Simplemente cierra la pestaña del navegador
2. O: Click en tu nombre (abajo izquierda) → "Stop Current Codespace"

**Para reabrir:**
1. Ve a: https://github.com/codespaces
2. Verás tu lista de Codespaces
3. Click en el que quieres abrir
4. Todos tus archivos y cambios estarán ahí

### ⚠️ IMPORTANTE: Límites de Tiempo

GitHub Codespaces se detiene automáticamente después de:
- **30 minutos de inactividad** (sin escribir/ejecutar comandos)
- Puedes cambiar esto en Settings

**Antes de que se detenga:**
- ✅ Haz commit de tus cambios
- ✅ Push a GitHub
- ✅ Así no pierdes nada

---

## 🔗 Continuar Este Hilo de Conversación

### Contexto de Esta Sesión

**Trabajo Realizado Hasta Ahora:**
1. ✅ Phase 1 Setup completado
2. ✅ Documentación unificada (README)
3. ✅ `.env.local.example` creado
4. ✅ Script de limpieza de logs
5. ✅ Verificación de Vercel completa
6. ✅ Tests pasando (8/8)

**Branch Actual:** `copilot/update-documentation-and-env-example`

**Pull Request:** (Ver en GitHub para el número)

### Archivo de Contexto

He creado `SESSION_CONTEXT.md` que contiene:
- Estado actual del proyecto
- Cambios realizados
- Próximos pasos
- Referencias útiles

**Léelo antes de continuar trabajando:**
```bash
cat SESSION_CONTEXT.md
```

### Retomar el Trabajo

Cuando reabras el Codespace:

```bash
# 1. Verificar que estás en la rama correcta
git branch

# 2. Actualizar desde GitHub (por si hiciste cambios desde otro lado)
git pull origin copilot/update-documentation-and-env-example

# 3. Verificar estado
git status

# 4. Leer el contexto
cat SESSION_CONTEXT.md

# 5. Ver documentación de Vercel
cat VERCEL_RESUMEN_ESPANOL.md

# 6. Continuar trabajando...
```

---

## 🤖 Trabajar con GitHub Copilot

Tu Codespace incluye GitHub Copilot. Para usarlo:

### En el Chat

1. Click en el ícono de chat (barra lateral derecha)
2. O presiona: **Cmd/Ctrl + Shift + I**
3. Escribe tu pregunta en español
4. Ejemplos:
   - "¿Cómo agrego una nueva API route?"
   - "Explícame este código"
   - "¿Cómo puedo hacer X?"

### En el Código

1. Empieza a escribir
2. Copilot sugerirá completaciones
3. Presiona **Tab** para aceptar
4. **Esc** para rechazar

### Comandos Útiles en Chat

```
@workspace ¿dónde está definida la función X?
/explain [selecciona código]
/fix [selecciona código con error]
/tests [selecciona función]
```

---

## 📋 Checklist: Nueva Sesión de Trabajo

Cada vez que abras el Codespace:

- [ ] Verificar rama correcta: `git branch`
- [ ] Actualizar código: `git pull`
- [ ] Leer contexto: `cat SESSION_CONTEXT.md`
- [ ] Instalar deps (si es necesario): `npm ci`
- [ ] Verificar tests: `npm test`
- [ ] Revisar tareas pendientes en el contexto

---

## 🔧 Configuración Avanzada

### Personalizar tu Codespace

Puedes crear un archivo `.devcontainer/devcontainer.json` para:
- Instalar extensiones automáticamente
- Configurar settings por defecto
- Ejecutar comandos al inicio

Ejemplo básico (ya incluido en el proyecto):

```json
{
  "name": "EcomIA Development",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "npm ci",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

### Variables de Entorno en Codespaces

Para no tener que crear `.env.local` cada vez:

1. Ve a: https://github.com/settings/codespaces
2. Scroll a "Codespaces secrets"
3. Click "New secret"
4. Agrega tus variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY`

Las variables estarán disponibles automáticamente en todos tus Codespaces.

---

## 💡 Tips y Trucos

### 1. Puerto Forwarding Automático

Cuando ejecutes `npm run dev`, Codespaces automáticamente:
- Detecta el puerto 3000
- Lo hace público
- Te da una URL: `https://[codespace-name]-3000.githubpreview.dev`

### 2. Ver en el Navegador

Click en "Ports" (abajo) → Click en el ícono de globo junto a 3000

### 3. Compartir tu Codespace

Puedes hacer tu Codespace visible para colaboración:
1. Click en tu nombre (abajo izquierda)
2. "Share Codespace"
3. Copia el link

### 4. Múltiples Terminales

- **Cmd/Ctrl + Shift + `**: Nueva terminal
- Puedes tener varias abiertas simultáneamente:
  - Terminal 1: `npm run dev` (servidor)
  - Terminal 2: `npm test -- --watch` (tests)
  - Terminal 3: Comandos git

### 5. Sincronizar Settings

Tus settings de VS Code se sincronizan automáticamente entre:
- VS Code Desktop
- Codespaces
- VS Code Web

---

## 🆘 Solución de Problemas

### Problema: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Port 3000 is already in use"
```bash
# Encontrar y matar el proceso
lsof -ti:3000 | xargs kill -9
# O reinicia el Codespace
```

### Problema: "Out of disk space"
```bash
# Limpiar node_modules y builds
npm run clean  # Si existe
rm -rf node_modules .next
npm ci
```

### Problema: Codespace muy lento
1. Detén el Codespace actual
2. Ve a https://github.com/codespaces
3. Crea uno nuevo (con más recursos)
4. Los cambios pusheados estarán ahí

---

## 📚 Recursos Adicionales

### Documentación del Proyecto

- [README.md](./README.md) - Documentación principal
- [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Estado actual
- [VERCEL_RESUMEN_ESPANOL.md](./VERCEL_RESUMEN_ESPANOL.md) - Guía de Vercel
- [.env.local.example](./.env.local.example) - Variables de entorno

### Links Útiles

- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

## ✅ Resumen Rápido

**Para empezar:**
1. Abre Codespace desde GitHub
2. `npm ci` (primera vez)
3. Copia `.env.local.example` a `.env.local`
4. `npm run dev`

**Para continuar:**
1. Reabre tu Codespace existente
2. `git pull`
3. Lee `SESSION_CONTEXT.md`
4. Continúa trabajando

**Para guardar:**
1. `git add .`
2. `git commit -m "mensaje"`
3. `git push`

**Para preguntar:**
1. Abre GitHub Copilot Chat (Cmd/Ctrl + Shift + I)
2. Pregunta en español
3. Referencia este documento si necesitas ayuda

---

**Creado:** Febrero 12, 2026  
**Mantenido por:** Equipo EcomIA  
**Actualizado:** Este documento se actualiza con cada sesión
