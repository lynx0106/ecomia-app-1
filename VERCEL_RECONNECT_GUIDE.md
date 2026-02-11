# Guía: Reconectar Vercel a tu Repositorio

## 🎯 El Problema 

Vercel está configurado para seguir a: `https://github.com/lynxia25-hub/ecomia-app` (upstream)  
Pero tú estás haciendo push a: `https://github.com/lynx0106/ecomia-app-1` (origin)

Por eso Vercel no ve tus cambios.

## ✅ Solución: 3 pasos en el Dashboard de Vercel

### Paso 1: Ir al Dashboard de Vercel
1. Abre: https://vercel.com/dashboard
2. Busca el proyecto "ecomia-app"
3. Haz click para entrar

### Paso 2: Acceder a Project Settings
1. En la parte superior, haz click en "Settings" (engranaje)
2. En el menú izquierdo, busca "Git"

### Paso 3: Desconectar y Reconectar el Repositorio
1. Busca la sección "Connected Repository"
2. Haz click en "Disconnect"
3. Confirma la desconexión
4. Espera 5 segundos
5. Busca "Connect Repository"
6. Selecciona GitHub
7. Busca: `lynx0106/ecomia-app-1`
8. Haz click en "Connect"
9. Selecciona rama: `main`
10. Haz click en "Deploy"

## 🔄 Después de Reconectar

Vercel debería:
1. ✅ Detectar automáticamente el cambio
2. ✅ Dispara un nuevo build
3. ✅ Desplegar los cambios correctos

### Verificar que funcionó:
```bash
curl -s https://ecom-ia.online | grep "Crear Cuenta"
```

Si ves "Crear Cuenta", ¡funcionó! 🎉

## 📝 Notas Importantes

**Si DNS está apuntando a `lynxia25-hub`:**
- Deberás cambiar los records DNS en Cloudflare
- Alternativamente, configura un CNAME personalizado en Vercel
- Vercel te dará instrucciones después de reconectar

**Si aún no funciona después de reconectar:**
1. Verifica que `origin/main` en git tenga los últimos commits
2. En Vercel, haz click "Redeploy" manualmente
3. Espera 3-5 minutos para que compile

## 🆘 Si Necesitas Ayuda

**Pantalla de Settings > Git debería verse así:**
```
┌─────────────────────────────┐
│ Connected Repository         │
├─────────────────────────────┤
│ ✅ lynx0106/ecomia-app-1   │
│ Branch: main                │
│                             │
│ [Disconnect] [Redeploy]     │
└─────────────────────────────┘
```

**No así (esto es lo actual - INCORRECTO):**
```
┌─────────────────────────────┐
│ Connected Repository         │
├─────────────────────────────┤
│ ✅ lynxia25-hub/ecomia-app │
│ Branch: main                │
│                             │
│ [Disconnect] [Redeploy]     │
└─────────────────────────────┘
```
