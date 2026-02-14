# Sistema de Resultados de Agentes - Documentación UI

## 📋 Resumen

Nueva arquitectura de UI que separa la conversación del chat de los resultados detallados de los agentes multi-agente.

## 🎯 Objetivos Conseguidos

### ✅ Chat Limpio
- **Antes**: Resultados extensos de todos los agentes aparecían en el chat
- **Ahora**: Solo mensajes conversacionales y preguntas de confirmación del orquestador
- **Beneficio**: Chat enfocado en la interacción humana, más legible

### ✅ Panel de Resultados Lateral
- **Ubicación**: Panel derecho desplegable (396px en desktop, full screen en móvil)
- **Contenido**: Cards individuales por cada agente
- **Auto-apertura**: Se abre automáticamente cuando hay resultados nuevos
- **Toggle manual**: Botón "Resultados" en header para mostrar/ocultar

### ✅ Cards Colapsables por Agente
- **Estados**:
  - 🔘 `pending`: Aún no ejecutado (card gris, no expandible)
  - ⏳ `loading`: Ejecutando actualmente (spinner animado)
  - ✅ `completed`: Finalizado (expandible al hacer clic)
  
- **Tipos de Cards**:
  - 🎯 **Orquestador**: Intención detectada, siguiente paso
  - 🔍 **Sourcing**: Producto, proveedores, análisis de mercado
  - 🎨 **Landing Builder**: Título, subtítulo, beneficios, CTA
  - ✍️ **Copy Social**: Posts para Instagram, TikTok, Facebook
  - 📸 **Media Creator**: Prompts de imagen, guías de video

### ✅ Barra de Progreso
- **Footer del panel**: Muestra X/4 completados
- **Visual**: Barra azul que crece con cada agente ejecutado
- **Estado**: Se actualiza en tiempo real

## 🏗️ Arquitectura de Componentes

```
ChatInterface (principal)
├── Header
│   ├── Título + paso actual
│   ├── Botón "Resultados" (toggle panel)
│   ├── Botón "Nueva" (reset todo)
│   └── Botón "Limpiar" (borrar chat)
├── Messages Area
│   ├── Mensaje usuario (azul, derecha)
│   ├── Mensaje asistente (gris, izquierda)
│   └── Mensaje agente (verde claro, izquierda)
├── Input Form
│   ├── Input text
│   └── Botón "Enviar"
└── AgentResultsPanel (superpuesto)
    ├── Header Panel
    │   ├── Título + subtítulo
    │   └── Botón cerrar (X)
    ├── Content (scroll)
    │   ├── AgentResultCard (Orchestrator)
    │   ├── AgentResultCard (Sourcing)
    │   ├── AgentResultCard (Landing)
    │   ├── AgentResultCard (Copys)
    │   └── AgentResultCard (Media)
    └── Footer
        └── Barra de progreso
```

## 🔄 Flujo de Datos

### 1. Usuario envía mensaje
```typescript
handleSubmit() → POST /api/chat
  ↓
Recibe response con { content, state }
  ↓
Si state.sourcingResult existe → auto-abrir panel
  ↓
Si content > 500 chars → no agregar al chat, mostrar resumen
  ↓
Actualizar agentState que alimenta AgentResultsPanel
```

### 2. Panel renderiza cards
```typescript
AgentResultsPanel recibe agentState
  ↓
Para cada agente (sourcing, landing, copys, media):
  ↓
Determina estado: pending | loading | completed
  ↓
AgentResultCard renderiza según:
  - agentType: formato específico por tipo
  - status: indicador visual + expandible si completed
  - result: datos estructurados del agente
```

### 3. Usuario expande card
```typescript
Click en card con status=completed
  ↓
setIsExpanded(true)
  ↓
renderResultContent() según agentType:
  - sourcing: tabla proveedores + análisis
  - landing: título, beneficios, CTA
  - copys: posts con hashtags por red social
  - media: prompts + guías visuales
```

## 📱 Responsividad

### Desktop (≥768px)
- Chat: Ancho dinámico (full width si panel cerrado, se reduce si panel abierto)
- Panel: 396px fijo, derecha, superpuesto con sombra
- Transición suave: `transition-all duration-300`

### Móvil (<768px)
- Chat: Full width cuando panel cerrado
- Panel: Full width cuando abierto (overlay completo)
- Botón X para cerrar panel
- Scroll vertical en ambos

## 🎨 Códigos de Color por Agente

```typescript
orchestrator → border-purple-500 bg-purple-50
sourcing     → border-blue-500 bg-blue-50
landing      → border-green-500 bg-green-50
copys        → border-yellow-500 bg-yellow-50
media        → border-pink-500 bg-pink-50
```

## 🔍 Lógica de Filtrado de Mensajes

### ¿Qué se muestra en el chat?

**SÍ muestra**:
- Mensajes del usuario (siempre)
- Preguntas del orquestador ("¿Continuar con Landing Page?")
- Confirmaciones cortas (< 500 chars)
- Mensajes que incluyen "¿" o "continuar"

**NO muestra** (va solo al panel):
- Resultados extensos de sourcing (> 500 chars)
- Resultados de landing builder
- Resultados de copys
- Resultados de media creator

**En su lugar muestra**:
```
✅ Resultados procesados. Revisa el panel lateral para ver los detalles.
```

## 📊 Estados del Sistema

### agentState (React State)
```typescript
{
  userId: string
  currentStep: 'orchestrate' | 'sourcing' | 'landing' | 'content' | 'media' | 'complete'
  previousSteps: string[]
  nextAgent?: string
  sourcingResult?: { productName, providers, analysis, ... }
  landingResult?: { title, benefits, cta, ... }
  contentResult?: { instagram, tiktok, facebook }
  mediaResult?: { imagePrompts, videoGuides, ... }
  updatedAt: Date
}
```

### isPanelVisible (React State)
- `true`: Panel visible en pantalla
- `false`: Panel oculto (solo chat visible)
- Se auto-activa a `true` cuando llegan resultados nuevos

## 🚀 Próximas Mejoras (Roadmap)

### Prioridad Alta
- [ ] **Parseo mejorado**: Extraer datos estructurados reales del texto de respuesta
- [ ] **Export de resultados**: Botón para descargar JSON/PDF con todos los resultados
- [ ] **Timestamps reales**: Usar timestamps de cuando se completó cada agente
- [ ] **Links a tienda**: Botón "Crear tienda con este producto" desde panel

### Prioridad Media
- [ ] **Edición inline**: Permitir editar resultados de agentes antes de continuar
- [ ] **Copiar al portapapeles**: Botón por cada sección de resultados
- [ ] **Expandir/colapsar todo**: Toggle global de todas las cards
- [ ] **Historial de sesiones**: Guardar agentState en DB para retomar después

### Prioridad Baja
- [ ] **Animaciones de entrada**: Fade-in cuando aparece nuevo resultado
- [ ] **Modo oscuro**: Soporte de dark theme en panel y cards
- [ ] **Tamaño ajustable**: Drag handle para resize del panel
- [ ] **Atajos de teclado**: `Ctrl+R` para toggle panel, `Esc` para cerrar

## 🐛 Issues Conocidos

### Datos Mock
- **Problema**: `sourcingResult` actualmente usa datos placeholder
- **Causa**: Los agentes retornan texto libre, no JSON estructurado
- **Fix necesario**: Implementar parseo con regex o structured output de AI SDK
- **Impacto**: Las cards muestran datos genéricos en lugar de los reales

### Estado de Loading
- **Problema**: No distingue cuál agente está ejecutando actualmente
- **Causa**: `currentStep` se actualiza al final, no al inicio
- **Fix necesario**: Actualizar estado antes de ejecutar agente
- **Workaround**: Funciona correctamente para completed

### Timestamps
- **Problema**: Timestamps son `new Date()` cuando se crea el resultado
- **Mejor**: Usar timestamp real de cuando se procesó en backend
- **Fix**: Agregar `processedAt` en cada resultado del agente

## 📚 Archivos Relevantes

### Componentes
- `src/components/chat/ChatInterface.tsx` - Componente principal
- `src/components/chat/AgentResultsPanel.tsx` - Panel lateral
- `src/components/chat/AgentResultCard.tsx` - Card individual

### Backend
- `src/lib/agents/multi-agent-workflow.ts` - Orquestador
- `src/lib/agents/types.ts` - Definiciones de AgentState
- `src/app/api/chat/route.ts` - Endpoint que retorna state

### Tests (pendiente)
- `src/components/chat/__tests__/AgentResultCard.test.tsx` (TODO)
- `src/components/chat/__tests__/AgentResultsPanel.test.tsx` (TODO)

## 💡 Ejemplos de Uso

### Caso 1: Flujo completo
```
Usuario: "investiga productos de fitness para vender en instagram"
  ↓
Orquestador: [chat] "Iniciando investigación de productos..."
  ↓
Sourcing: [panel] Card verde con proveedores y análisis
          [chat] "¿Continuar con Landing Page?"
  ↓
Usuario: "sí"
  ↓
Landing: [panel] Card verde con título, beneficios, CTA
         [chat] "¿Crear copys para redes?"
  ↓
Usuario: "dale"
  ↓
Copys: [panel] Card verde con posts Instagram/TikTok/Facebook
       [chat] "¿Generar estrategia visual?"
  ↓
Usuario: "siguiente"
  ↓
Media: [panel] Card verde con prompts de IA y guías de video
       [chat] "✅ Flujo completado. ¿Crear tienda?"
```

### Caso 2: Solo investigación
```
Usuario: "busca proveedores de protectores solares"
  ↓
Sourcing: [panel] Card con proveedores
          [chat] "¿Continuar?"
  ↓
Usuario: "no, gracias"
  ↓
Sistema: [chat] "Entendido. ¿Algo más?"
```

### Caso 3: Chat sin multi-agente
```
Usuario: "¿cómo funciona mercadopago?"
  ↓
Orquestador: Detecta que no es flujo multi-agente
  ↓
Sistema: [chat] Respuesta directa textual
         [panel] No se abre, no hay resultados
```

## ✅ Checklist de Testing

- [x] Build sin errores TypeScript
- [x] Chat muestra mensajes cortos correctamente
- [x] Panel se auto-abre con resultados nuevos
- [x] Cards muestran estado pending/loading/completed
- [ ] Cards expandibles muestran contenido real (pendiente parseo)
- [x] Botón toggle abre/cierra panel correctamente
- [x] Botón "Nueva" resetea chat y cierra panel
- [x] Botón "Limpiar" borra mensajes y cierra panel
- [ ] Responsivo funciona en móvil (pendiente testing real)
- [x] Barra de progreso se actualiza correctamente
- [ ] No hay memory leaks al cambiar entre sesiones

---

**Fecha de implementación**: 14 Febrero 2026  
**Versión**: 1.0  
**Status**: ✅ Deployed to Production  
**Próxima revisión**: Implementar parseo estructurado de resultados
