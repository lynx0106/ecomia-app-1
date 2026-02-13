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
- Escalar casos complejos a admin

BASE DE CONOCIMIENTO:
${SUPPORT_KNOWLEDGE_BASE}

DIRECTRICES:
1. Si usuario pregunta sobre PLATAFORMA (¿Dónde está X? ¿Cómo uso Y?) → RESPONDE
2. Si user pregunta sobre INVESTIGACIÓN (Investiga productos) → Responde: "Para investigar productos usa el Chat de investigación en tu dashboard o click en 💬 Chat"
3. Si es ERROR GRAVE o bug → Escalar a admin con escalate_support_ticket tool
4. Si user está perdido → Guía como si fuera tu primer día (paciente y claro)
5. NUNCA muestres JSON o código técnico

ESCALA A SUPPORT si:
- User reporta bug: "No funciona X"
- User perdió datos
- Feature no disponible para user
- Acceso denegado
- Problema persistente

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
            console.error('Error creating support ticket:', error);
            return 'No pude crear el ticket, intenta más tarde';
          }

          return `✅ Ticket creado con éxito. El admin recibirá tu solicitud (#${Date.now().toString().slice(-4)}) y te responderá pronto.`;
        } catch (err) {
          console.error('Support escalation error:', err);
          return 'Error al crear ticket, contacta a admin directo';
        }
      },
    }),
  };

  try {
    console.log('[Support Agent] Starting with', messages.length, 'messages');
    
    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      tools: tools as any,
      messages,
      maxSteps: 5,
    } as any);

    console.log('[Support Agent] Success:', result.text?.substring(0, 100));
    
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
