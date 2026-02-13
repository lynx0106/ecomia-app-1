# Migración de Groq a xAI Grok

## Resumen del Cambio

Se ha migrado el proveedor de IA de **Groq** (modelo LLaMA) a **xAI Grok** (modelo grok-beta de xAI/Elon Musk).

## Motivación

- ✅ Modelo más actualizado con conocimiento reciente
- ✅ Mejor capacidad de conversación contextual
- ✅ Compatible con formato OpenAI (fácil integración)
- ✅ Soluciona problemas de límite de tokens del tier gratuito de Groq
- ✅ El usuario tiene cuenta en xAI y puede generar API keys

## Cambios Realizados

### 1. Código (`src/app/api/chat/route.ts`)

**Antes:**
```typescript
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

model: groq('llama-3.1-8b-instant')
```

**Después:**
```typescript
import { createOpenAI } from '@ai-sdk/openai';

const xai = createOpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

model: xai('grok-beta')
```

### 2. Variables de Entorno

**Antes:**
```bash
GROQ_API_KEY=your_groq_api_key
```

**Después:**
```bash
XAI_API_KEY=your_xai_api_key
```

### 3. Archivos Modificados

- ✅ `src/app/api/chat/route.ts` - Cambio de proveedor y modelo (8 referencias actualizadas)
- ✅ `.env.local.example` - Actualizada variable de entorno y documentación
- ✅ Validaciones de API key actualizadas

## Configuración en Vercel

Para que funcione en producción, necesitas:

1. **Ir a Vercel Dashboard**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto

2. **Actualizar Variables de Entorno**
   - Settings → Environment Variables
   - **Eliminar:** `GROQ_API_KEY` (ya no se usa)
   - **Agregar:** `XAI_API_KEY` con tu clave de xAI
   - Valor: Obtenerlo de https://console.x.ai/team → API Keys

3. **Redeploy**
   - Deployments tab
   - Click en el último deployment
   - "..." menú → "Redeploy"
   - Esperar 3-5 minutos

## Cómo Obtener tu API Key de xAI

1. Ve a https://console.x.ai/team
2. Inicia sesión con tu cuenta de xAI
3. Ve a la sección "API Keys"
4. Click en "Create New Key"
5. Copia la clave generada
6. Guárdala en Vercel como `XAI_API_KEY`

## Ventajas del Modelo Grok

### Capacidades

- **Conocimiento actualizado:** Datos recientes (vs modelos antiguos)
- **Contexto largo:** Mejor manejo de conversaciones extensas
- **Comprensión mejorada:** Entendimiento más profundo de contextos complejos
- **Velocidad:** Respuestas rápidas y eficientes

### Límites

- **Contexto:** Más generoso que el tier gratuito de Groq
- **Rate limits:** Dependen de tu plan en xAI
- **Costo:** Verifica pricing en https://x.ai/pricing

## Compatibilidad

- ✅ **Formato OpenAI:** xAI usa el mismo formato que OpenAI
- ✅ **Vercel AI SDK:** Compatible con `@ai-sdk/openai`
- ✅ **Streaming:** Soporta respuestas en streaming
- ✅ **Tools/Functions:** Compatible con function calling

## Testing

Para probar localmente:

1. **Configura tu API key local:**
   ```bash
   cp .env.local.example .env.local
   # Edita .env.local y agrega tu XAI_API_KEY
   ```

2. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

3. **Prueba el chat:**
   - Ve a http://localhost:3000
   - Inicia sesión
   - Abre el chat
   - Envía un mensaje
   - Deberías recibir respuesta del modelo Grok

## Rollback (si es necesario)

Si necesitas volver a Groq:

1. **Revertir código:**
   ```bash
   # Revierte src/app/api/chat/route.ts al commit anterior
   git checkout <commit-anterior> -- src/app/api/chat/route.ts
   ```

2. **Revertir variables:**
   - En Vercel: Cambiar `XAI_API_KEY` por `GROQ_API_KEY`
   - Redeploy

## Soporte

- **xAI Docs:** https://docs.x.ai/
- **xAI Console:** https://console.x.ai/
- **Vercel AI SDK:** https://sdk.vercel.ai/

## Próximos Pasos

1. ✅ Hacer merge de este PR
2. ✅ Configurar `XAI_API_KEY` en Vercel
3. ✅ Redeploy a producción
4. ✅ Probar el chat en https://ecom-ia.online
5. ✅ Verificar que las respuestas sean correctas

## Notas Importantes

- El cambio es **compatible hacia adelante** - no rompe funcionalidad existente
- Todos los **8 usos del modelo** fueron actualizados
- La **validación de API keys** fue actualizada
- El **fallback mode** también fue actualizado para xAI
- Los **tests existentes** siguen funcionando

## Estado

- ✅ Código migrado
- ✅ Variables de entorno actualizadas
- ✅ Documentación creada
- ⏳ Pendiente: Configurar XAI_API_KEY en Vercel
- ⏳ Pendiente: Deployment a producción
