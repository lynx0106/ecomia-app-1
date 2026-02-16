# 🔧 INSTRUCCIONES: Configuración del Webhook MercadoPago

## ✅ Completado Automáticamente
- [x] Migración de base de datos creada
- [x] Validador de webhooks implementado
- [x] Endpoint API creado

---

## 📋 PASOS MANUALES REQUERIDOS

### 1. Aplicar Migración en Supabase

**Opción A: Desde el Dashboard de Supabase**
1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar el contenido de `database/migrations/20260216_add_payment_logs.sql`
5. Pegar y ejecutar
6. Verificar que la tabla `payment_logs` se creó correctamente

**Opción B: Desde CLI (si tienes Supabase CLI)**
```bash
npx supabase db push
```

---

### 2. Configurar Variables de Entorno

**Archivo: `.env.local`** (crear si no existe)

```bash
# MercadoPago - Webhook Secret
# Obtener desde: https://www.mercadopago.com.co/developers/panel/app/{APP_ID}/webhooks
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret_aqui

# MercadoPago - Access Token
# Obtener desde: https://www.mercadopago.com.co/developers/panel/app/{APP_ID}/credentials
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui

# (Opcional) Para testing en desarrollo
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: 
- NO commitear el archivo `.env.local`
- Agregar a `.gitignore` si no está
- En producción, configurar en Vercel → Settings → Environment Variables

---

### 3. Configurar Webhook en MercadoPago

1. **Ir al Panel de MercadoPago**
   - https://www.mercadopago.com.co/developers/panel

2. **Seleccionar tu Aplicación**
   - Clic en tu app existente

3. **Ir a Webhooks**
   - Menu lateral → "Webhooks"

4. **Agregar Nueva URL de Webhook**
   - **URL Producción**: `https://ecomia-app.online/api/webhooks/mercadopago`
   - **URL Desarrollo**: `https://tu-ngrok-url.ngrok.io/api/webhooks/mercadopago`

5. **Seleccionar Eventos**
   - ✅ `payment` (todos los eventos de pago)
   - ❌ Desmarcar otros eventos por ahora

6. **Guardar**
   - Copiar el "Webhook Secret" generado
   - Agregarlo a `.env.local` como `MERCADOPAGO_WEBHOOK_SECRET`

---

### 4. Testing Local (Opcional pero Recomendado)

**Para testear localmente necesitas exponer tu localhost con ngrok:**

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000

# Usar la URL generada en la configuración del webhook
```

**Test del endpoint:**
```bash
# Health check
curl http://localhost:3000/api/webhooks/mercadopago

# Debería retornar:
# {"status":"ok","service":"mercadopago-webhook","timestamp":"..."}
```

---

### 5. Verificar en Producción

**Después del deploy en Vercel:**

1. **Verificar que el endpoint existe**
   ```bash
   curl https://ecomia-app.online/api/webhooks/mercadopago
   ```

2. **Hacer un pago de prueba**
   - Crear una landing page
   - Configurar checkout
   - Hacer un pago con tarjeta de prueba de MercadoPago
   - Verificar en Supabase que se creó el registro en `payment_logs`

3. **Monitorear logs**
   - Vercel → Tu proyecto → Logs
   - Buscar `[Webhook]` para ver los logs del webhook

---

## 🧪 TARJETAS DE PRUEBA DE MERCADOPAGO

**Para testing en modo sandbox:**

| Tipo | Número | CVV | Fecha | Resultado |
|------|--------|-----|-------|-----------|
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | ✅ Aprobado |
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | ✅ Aprobado |
| Mastercard | 5031 4332 1540 6351 | 123 | 11/25 | ❌ Rechazado |

Más info: https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 📊 Verificar que Todo Funciona

### Checklist Post-Configuración

- [ ] Tabla `payment_logs` existe en Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] Webhook configurado en panel de MercadoPago
- [ ] URL del webhook apunta a producción
- [ ] Endpoint responde con status 200
- [ ] Pago de prueba registrado en `payment_logs`
- [ ] Logs en Vercel muestran procesamiento exitoso

---

## 🚨 Troubleshooting

### Error: "MERCADOPAGO_WEBHOOK_SECRET not configured"
- **Causa**: Variable de entorno no configurada
- **Solución**: Agregar en Vercel → Settings → Environment Variables
- **Redeployar**: Hacer un nuevo deploy después de agregar variables

### Error: "Invalid signature"
- **Causa**: El secret del webhook no coincide
- **Solución**: Verificar que el secret en `.env` es el mismo del panel de MercadoPago
- **Nota**: El secret cambia si regeneras el webhook

### No llegan notificaciones
- **Verificar**: URL del webhook en panel de MercadoPago
- **Verificar**: Que la URL es accesible públicamente
- **Verificar**: Logs en MercadoPago → Webhooks → Ver intentos de entrega

### Pagos no se registran
- **Verificar**: Tabla `payment_logs` existe
- **Verificar**: RLS policies permiten inserts
- **Ver logs**: Supabase → Logs → buscar errores de INSERT

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs en Vercel
2. Revisar logs en Supabase
3. Verificar configuración en panel de MercadoPago
4. Contactar soporte si el problema persiste

---

**Última actualización**: 16 de febrero, 2026  
**Estado**: Webhook implementado, pendiente configuración manual
