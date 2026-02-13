import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import type { AgentState } from './types';
import { getAgentDefinitions } from './agent-definitions';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Orchestrator Agent DINÁMICO - Carga agentes desde DB en tiempo de ejecución
 * Detecta intención del usuario y ruta al agente correcto
 */

export async function executeOrchestratorAgentDynamic(
  messages: any[],
  userId: string
): Promise<{ nextAgent: string; intention: string; state: AgentState }> {
  const lastUserMessage = messages
    ?.filter((m) => m.role === 'user')
    ?.pop()?.content || '';

  // Cargar definiciones dinámicas de agentes desde DB
  let agents: any[] = [];
  try {
    agents = await getAgentDefinitions();
  } catch (err) {
    console.warn('Error loading dynamic agents, using defaults:', err);
    // Fallback a agentes por defecto
    agents = [
      { key: 'sourcing', name: 'Sourcing Agent', category: 'product_research' },
      { key: 'landing_builder', name: 'Landing Builder', category: 'landing_pages' },
      { key: 'copy_social', name: 'Copy Social', category: 'social_content' },
      { key: 'media_creator', name: 'Media Creator', category: 'visual_strategy' },
    ];
  }

  // Construir dinámicamente las intenciones y rutas desde DB
  const agentRoutes = agents
    .map(
      (a) =>
        `- "${a.category || a.key}": usa ${a.key} (${a.name}) - ${a.description || 'agente especializado'}`
    )
    .join('\n');

  const validAgentKeys = agents.map((a) => a.key).join('|');

  const systemPrompt = `
Eres un Orquestador de IA Multiagente especializado en e-commerce en LATAM.

TU TRABAJO:
1. Analizar los mensajes del usuario
2. Identificar su intención exacta
3. Resolver inmediatamente si es pregunta simple sobre plataforma
4. Entregar decisión de qué agente usar si es tarea compleja

AGENTES DISPONIBLES (Dinámicos - desde DB):
${agentRoutes}

REGLAS:
- NUNCA INVENTES DATOS
- Si el usuario pregunta por features de la plataforma, responde directo
- Solo usa los agentes listados arriba
- Selecciona el agente más específico para la tarea
- Si la petición no coincide con ningún agente, responde directo (nextAgent="direct")

RESPONDE EN JSON STRICT (válido):
{
  "intention": "descripción de la intención exacta del usuario",
  "nextAgent": "${validAgentKeys}|direct",
  "reasoning": "explicación breve de por qué elegiste este agente",
  "directResponse": "si nextAgent=direct, tu respuesta aquí. Si no, null"
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
        nextAgent: agentMatch?.[1] || agents[0]?.key || 'sourcing',
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
      nextAgent: parsed.nextAgent || agents[0]?.key || 'sourcing',
      intention: parsed.intention || lastUserMessage,
      state,
    };
  } catch (err) {
    console.error('Orchestrator agent error:', err);
    throw new Error('Error en orquestador de agentes');
  }
}

/**
 * Mantener función original para compatibilidad
 * Se puede reemplazar gradualmente
 */
export { executeOrchestratorAgentDynamic as executeOrchestratorAgent };
