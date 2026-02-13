# 🔄 Workflow de Sincronización de Repositorios

**Última actualización:** 13 de Febrero, 2026  
**Versión:** 1.0

---

## 📌 Contexto

El proyecto EcomIA usa **dos repositorios sincronizados**:

| Repositorio | Dueño | Propósito | Vercel |
|-------------|-------|----------|--------|
| **ecomia-app-1** | lynx0106 | Rama de trabajo (desarrollo/staging) | ✅ Conectado |
| **ecomia-app** | lynxia25-hub | Repo principal (producción) | ✅ Conectado |

Ambos están en Vercel pero **lynx0106/ecomia-app-1 es donde se trabaja** y los cambios se sincronizan a lynxia25-hub/ecomia-app.

---

## 🚀 Flujo Standard

### Paso 1: Desarrollar en lynx0106/ecomia-app-1

```bash
cd /workspaces/ecomia-app-1

# Hacer cambios
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

### Paso 2: Crear Pull Request a lynxia25-hub

```bash
cd /workspaces/ecomia-app-1

# Crear PR automático
gh pr create \
  --repo lynxia25-hub/ecomia-app \
  --base main \
  --head lynx0106:main \
  --title "Sync: [descripción corta]" \
  --body "Descripción de cambios y detalles"
```

O si ya existe PR #2, actualizar en GitHub:
- Ir a https://github.com/lynxia25-hub/ecomia-app/pull/2
- El PR se auto-actualiza con los nuevos commits

### Paso 3: Merge en lynxia25-hub (producción)

1. **lynxia25-hub owner** hace merge del PR en GitHub
2. Vercel detecta cambios en lynxia25-hub/ecomia-app:main
3. Auto-deploy a ecom-ia.online

---

## 📋 Checklist Pre-Commit

Antes de hacer `git commit`, verifica:

- [ ] `npm run build` ✅ (sin errores)
- [ ] `npm run lint` ✅ (sin warnings críticos)
- [ ] `npm test` ✅ (tests pasan)
- [ ] `git status` (no hay cambios accidentales)
- [ ] Mensaje de commit es descriptivo

```bash
npm run build && npm run lint && npm test
```

---

## 🔗 Remotes Configurados

```bash
git remote -v

# Output esperado:
# origin     https://github.com/lynx0106/ecomia-app-1 (fetch)
# origin     https://github.com/lynx0106/ecomia-app-1 (push)
# upstream   https://github.com/lynxia25-hub/ecomia-app.git (fetch)
# upstream   https://github.com/lynxia25-hub/ecomia-app.git (push)
```

**origin** = rama de trabajo (lynx0106)  
**upstream** = repo principal (lynxia25-hub)

---

## ⚠️ Si Algo Sale Mal

### PR rechazado o conflictos

```bash
# Ver estado actual
git log --oneline -5

# Si hay conflictos:
git pull upstream main
# Resolver conflictos en archivos
git add .
git commit -m "chore: resolve conflicts"
git push origin main

# El PR se auto-actualiza
```

### Build falla en Vercel

Esperar a que lynxia25-hub/ecomia-app se recompile. Si persiste:

1. Revisar logs de Vercel (lynxia25-hub dashboard)
2. Hacer rollback con commit revert:
   ```bash
   git revert <hash-del-commit>
   git push origin main
   # PR se actualiza
   ```

### Cambios duplicados o histórico confuso

```bash
# Ver historia completa
git log --all --graph --oneline

# Sincronizar todo si está muy desfasado
git fetch origin
git fetch upstream
git merge upstream/main
git push origin main
```

---

## 📚 Documentación Relacionada

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deploy manual a Vercel
- [SETUP_LOCAL.md](./SETUP_LOCAL.md) - Configuración local
- [SCRIPTS.md](./SCRIPTS.md) - Scripts disponibles

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────────────────────┐
│       lynx0106/ecomia-app-1 (DESARROLLO)           │
│  ├─ git commit & push origin main                  │
│  └─ (Vercel auto-deploy)                           │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   GitHub PR #2 (mostrado   │
        │   en lynxia25-hub/ecomia-app)
        └────────────────┬───────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  lynxia25-hub/ecomia-app (PRODUCCIÓN)              │
│  ├─ Merge PR                                       │
│  └─ Vercel auto-deploy → ecom-ia.online 🚀        │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Permisos

- **lynx0106:** puede hacer push a su propio repo
- **lynxia25-hub:** hace merge de PRs en su repo principal
- **Vercel:** mira ambos repos, deploya desde lynxia25-hub

---

## 💡 Comandos Rápidos

```bash
# Ver cambios sin stagear
git diff

# Ver cambios stagiados
git diff --cached

# Ver último commit
git log -1 -p

# Crear commit con cambios específicos
git add archivo1.ts archivo2.ts
git commit -m "feat: mensaje"

# Ver remotes
git remote -v

# Push a origin (lynx0106)
git push origin main

# Ver PRs pendientes
gh pr list --repo lynxia25-hub/ecomia-app
```

---

**Si tienes dudas sobre el flujo, vuelve a este documento.**
