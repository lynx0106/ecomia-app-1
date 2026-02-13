# 🔄 Workflow de Desarrollo

**Última actualización:** 13 de Febrero, 2026  
**Versión:** 2.0

---

## 📌 Contexto

El proyecto EcomIA ahora usa **un único repositorio principal**:

| Repositorio | Dueño | Propósito | Vercel |
|-------------|-------|----------|--------|
| **ecomia-app-1** | lynx0106 | Repo único (desarrollo + producción) | ✅ Conectado |

**Vercel deploya directamente desde `lynx0106/ecomia-app-1:main` a ecom-ia.online.**

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

### Paso 2: Vercel auto-deploya

Vercel detecta los cambios en `main` y auto-deploya a ecom-ia.online en 2-5 minutos.

**Sin pasos adicionales requeridos.**

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
```

**origin** = único repositorio (lynx0106/ecomia-app-1)

---

## ⚠️ Si Algo Sale Mal

### Build falla en Vercel

1. Ver logs de Vercel (dashboard de lynx0106)
2. Hacer rollback con commit revert:
   ```bash
   git revert <hash-del-commit>
   git push origin main
   ```
3. Vercel se recompila automáticamente

### Cambios no se ven en producción

```bash
# Verificar que están en main
git log --oneline -5

# Forzar push (si es necesario)
git push -f origin main

# Esperar 2-5 min a que Vercel redeploy
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
│    lynx0106/ecomia-app-1 (ÚNICO REPOSITORIO)       │
│  ├─ git commit & push origin main                  │
│  └─ Vercel auto-deploy → ecom-ia.online 🚀        │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Permisos

- **lynx0106:** Dueño del repo, puede hacer push directamente
- **Vercel:** Mira lynx0106/ecomia-app-1, deploya automáticamente

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
