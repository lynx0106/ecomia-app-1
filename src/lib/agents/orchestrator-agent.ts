import { generateText } from 'ai';
import { z } from 'zod';
import { createXai } from '@ai-sdk/xai';
import type { AgentState } from './types';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Orchestrator Agent - Detecta intención del usuario y ruta al agente correcto
 */

export async function executeOrchestratorAgent(
  messages: any[],
  userId: string
): Promise<{ nextAgent: string; intention: string; state: AgentState }> {
  const lastUserMessage = messages
    ?.filter((m) => m.role === 'user')
    ?.pop()?.content || '';

  const systemPrompt = `
Eres un Orquestador de IA Multiagente especializado en e-commerce en LATAM.

TU TRABAJO:
1. Analizar los mensajes del usuario
2. Identificar su intención exacta
3. Resolver inmediatamente si es pregunta simple sobre plataforma
4. Entregar decisión de qué agente usar si es tarea compleja

INTENCIONES RECONOCIDAS:
- "investigar": usuario quiere buscar un producto ("investiga productos de fitness")
- "landing": usuario quiere crear página de venta ("crea landing para zapatos")
- "contenido": usuario quiere copys para redes ("dame copys para instagram")
- "media": usuario quiere ideas visuales ("ideas de videos para tiktok")
- "producto_completo": usuario quiere flujo entero ("quiero una tienda de...")
- "otra": cualquier otra cosa → responder directamente

REGLAS:
- NUNCA INVENTES DATOS
- Si el usuario pregunta por features de la plataforma, responde directo
- Si pide análisis de producto → RUTA A: sourcing
- Si pide landing → RUTA A: landing_builder
- Si pide copys → RUTA A: copy_social
- Si pide media/visuales → RUTA A: media_creator
- Si pide "hacer todo" → RUTA A: sourcing (primer paso)

RESPONDE EN JSON STRICT (válido):
{
  "intention": "string con la intención exacta",
  "nextAgent": "sourcing|landing_builder|copy_social|media_creator|direct",
  "reasoning": "por qué elegiste este agente",
  "directResponse": "si nextAgent=direct, respuesta aquí. Si no, null"
}
`;

  try {
    const response = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.3,
    } as any);

    const text = response.text.trim();
    
    // Intentar parsear JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Si no es JSON válido, extraer por regex
      const intentionMatch = text.match(/"intention":\s*"([^"]+)"/);
      const agentMatch = text.match(/"nextAgent":\s*"([^"]+)"/);
      
      parsed = {
        intention: intentionMatch?.[1] || 'investigar',
        nextAgent: agentMatch?.[1] || 'sourcing',
        reasoning: 'Fallback parsing',
        directResponse: null,
      };
    }

    const state: AgentState = {
      userId,
      currentStep: 'orchestrate',
      previousSteps: ['orchestrate'],
      userIntention: parsed.intention || lastUserMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      nextAgent: parsed.nextAgent || 'sourcing',
      intention: parsed.intention || lastUserMessage,
      state,
    };
  } catch (err) {
    console.error('Orchestrator agent error:', err);
    throw new Error('Error en orquestador de agentes');
  }
}
