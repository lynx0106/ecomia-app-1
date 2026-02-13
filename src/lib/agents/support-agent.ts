import { generateText, tool } from 'ai';
import { z } from 'zod';
import { createXai } from '@ai-sdk/xai';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Support Agent - Especialista en ayuda y soporte de la plataforma
 * Responde preguntas sobre cómo usar EcomIA
 * Puede escalar casos a admin si no puede resolver
 */

const SUPPORT_KNOWLEDGE_BASE = `
# BASE DE CONOCIMIENTO - EcomIA Platform

## CARACTERÍSTICAS PRINCIPALES
1. **Chat con IA** - Investiga productos, crea contenido, diseña tiendas
2. **Investigación de Mercado** - Busca productos rentables con Tavily
3. **Crear Tiendas** - Tiendas online sin código
4. **Landing Pages** - Páginas de venta profesionales
5. **Dashboard Admin** - Ver tickets y usuarios
6. **Onboarding Modal** - Guía interactiva para nuevos usuarios

## NAVEGACIÓN
- 💬 Chat → Habla con IA para investigar productos
- 🏪 Tiendas → Crear y administrar tiendas online
- 📄 Landing Pages → Crear páginas de venta
- 🔍 Investigaciones → Ver historial de búsquedas
- ⚙️ Configuración → Perfil y preferencias
- 📚 Tutoriales → Guías interactivas

## PREGUNTAS COMUNES
Q: ¿Cómo investigar productos?
A: Ve a Chat → Escribe "Investiga productos de [categoría]" → Elige un producto → Chat genera contenido → Crea tienda

Q: ¿Dónde veo mis tiendas?
A: En el menú izquierdo → 🏪 Tiendas → Verás todas tus tiendas creadas

Q: ¿Cómo cambio mi email?
A: ⚙️ Configuración → Perfil → Cambiar email → Confirma en tu inbox

Q: ¿Cómo funciona el onboarding?
A: First login → Ver modal con features → Puedes hacer tour completo o saltar → Help button siempre disponible

Q: ¿Qué modelos de IA usa?
A: XAI (grok-4-1-fast-non-reasoning) + Tavily para investigación en tiempo real

Q: ¿Puedo cambiar un producto después de crearlo?
A: Sí → Chat → "Investigar otro producto" → Repite el flujo → Puedes tener múltiples investigaciones

## ERRORES COMUNES
- "Bad Request en chat" → Recarga la página o limpia caché
- "No me muestra los tutoriales" → Click en Help bubble → Ver Tutoriales
- "¿Dónde está mi tienda?" → Espera 2-5 min después de crearla (Vercel deploy)
- "No veo mi landing" → Mismo del anterior, Vercel tarda en publicar

## ESCALAR A ADMIN
- Bug en la plataforma
- Datos perdidos
- Acceso denegado
- Feature request urgente
- Problema de pago/billing
`;

export async function executeSupportAgent(
  messages: any[],
  userId: string,
  supabase: any
) {
  const systemPrompt = `
Eres Support Agent de EcomIA - Especialista en ayuda de la plataforma.

MISIÓN:
- Responder preguntas sobre cómo usar EcomIA
- Guiar usuarios por features
- Resolver problemas técnicos simples
- Escalar casos complejos a admin usando el TOOL escalate_support_ticket

BASE DE CONOCIMIENTO:
${SUPPORT_KNOWLEDGE_BASE}

DIRECTRICES:
1. Si usuario pregunta sobre PLATAFORMA (¿Dónde está X? ¿Cómo uso Y?) → RESPONDE directamente
2. Si user pregunta sobre INVESTIGACIÓN (Investiga productos) → Responde: "Para investigar productos usa el Chat de investigación en tu dashboard o click en 💬 Chat"
3. Si es ERROR GRAVE, bug, o problema persistente → USA el tool escalate_support_ticket INMEDIATAMENTE
4. Si user está perdido → Guía como si fuera tu primer día (paciente y claro)
5. NUNCA muestres JSON o código técnico

⚠️ IMPORTANTE - USA EL TOOL escalate_support_ticket cuando el usuario diga:
- "No funciona" / "No puedo acceder" / "Está roto" / "Da error"
- "Perdí mis datos" / "No encuentro mis X"
- "Llevo X días con el problema"
- "Ya lo intenté varias veces"
- Cualquier frase que indique un problema técnico real

CÓMO ESCALAR:
1. Detecta problema que requiere admin
2. USA el tool escalate_support_ticket con:
   - issue_title: Resumen corto (ej: "Usuario no puede acceder a tiendas")
   - issue_description: Detalles completos del problema
   - priority: urgent (problemas graves), high (acceso/datos), medium (features), low (preguntas)
   - category: bug, feature_request, access_issue, data_loss, performance, other
3. El tool responderá automáticamente al usuario

RESPONDE CON:
- Máximo 2 párrafos para preguntas simples
- Si necesita pasos, usa números
- Siempre termina con: "¿Algo más en lo que pueda ayudarte?" o "¿Funcionó?"

PERSONALIDAD:
- Amable, paciente, profesional
- Español LATAM
- Directo pero empático
`;

  const tools = {
    escalate_support_ticket: (tool as any)({
      description: 'Escalar caso a admin cuando no pueda resolver o sea bug',
      parameters: z.object({
        issue_title: z.string().describe('Título conciso del problema'),
        issue_description: z.string().describe('Descripción detallada'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Prioridad'),
        category: z.enum(['bug', 'feature_request', 'access_issue', 'data_loss', 'performance', 'other']).describe('Categoría'),
      }),
      execute: async (params: any) => {
        try {
          console.log('[Support Agent] Ejecutando tool escalate_support_ticket:', params);
          
          const { error } = await supabase
            .from('support_tickets')
            .insert({
              user_id: userId,
              issue_title: params.issue_title,
              issue_description: params.issue_description,
              priority: params.priority,
              category: params.category,
              conversation_context: messages.slice(-5), // Últimos 5 mensajes de contexto
              status: 'open',
            });

          if (error) {
            console.error('[Support Agent] Error creating support ticket:', error);
            return 'No pude crear el ticket, intenta más tarde';
          }

          console.log('[Support Agent] Ticket creado exitosamente');
          return `✅ Ticket creado con éxito. El admin recibirá tu solicitud (#${Date.now().toString().slice(-4)}) y te responderá pronto.`;
        } catch (err) {
          console.error('[Support Agent] Support escalation error:', err);
          return 'Error al crear ticket, contacta a admin directo';
        }
      },
    }),
  };

  try {
    console.log('[Support Agent] Starting with', messages.length, 'messages');
    console.log('[Support Agent] User ID:', userId);
    
    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      tools: tools as any,
      messages,
      maxSteps: 5,
    } as any);

    console.log('[Support Agent] Success. Steps:', result.steps?.length || 0);
    console.log('[Support Agent] Tool calls:', result.steps?.map((s: any) => s.toolCalls).filter(Boolean).flat() || 'none');
    console.log('[Support Agent] Response:', result.text?.substring(0, 100));
    
    return {
      content: result.text || 'Disculpa, no pude procesar tu pregunta. Intenta de nuevo.',
    };
  } catch (err: any) {
    console.error('[Support Agent] Error:', err);
    console.error('[Support Agent] Error details:', {
      message: err?.message,
      cause: err?.cause,
      stack: err?.stack?.split('\n').slice(0, 3),
    });
    
    // Devolver un mensaje de error más descriptivo
    const errorMsg = err?.message || 'Error desconocido';
    return {
      content: `Hubo un problema al procesar tu solicitud: ${errorMsg}. Por favor, intenta de nuevo o espera unos minutos.`,
    };
  }
}
