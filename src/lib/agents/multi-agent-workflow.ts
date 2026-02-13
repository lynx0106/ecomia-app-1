/**
 * Multi-Agent Workflow Manager - Orquesta el flujo completo de agentes
 */

import { executeOrchestratorAgent } from './orchestrator-agent';
import { executeSourcingAgent } from './sourcing-agent';
import { executeLandingBuilderAgent } from './landing-builder-agent';
import { executeCopySocialAgent } from './copy-social-agent';
import { executeMediaCreatorAgent } from './media-creator-agent';
import type { AgentState } from './types';

export interface MultiAgentResult {
  content: string;
  state: AgentState;
  hasMore: boolean;
  nextPrompt?: string;
}

/**
 * Ejecuta el flujo multi-agente secuencial:
 * 1. Orquestador detecta intención
 * 2. Routing a agente específico (sourcing, landing, content, media)
 * 3. Mantenimiento de estado entre agentes
 * 4. Flujo completo: sourcing → landing → content → media
 */
export async function executeMultiAgentWorkflow(
  messages: any[],
  userId: string,
  existingState?: AgentState
): Promise<MultiAgentResult> {
  try {
    // Paso 1: Orquestador detecta intención
    console.log('[MultiAgentWorkflow] Iniciando orquestador...');
    const orchestrationResult = await executeOrchestratorAgent(messages, userId);

    let state = existingState || orchestrationResult.state;
    let agentResponse = '';
    let nextAgent = orchestrationResult.nextAgent;

    // Paso 2: Routing basado en intención detectada
    console.log(`[MultiAgentWorkflow] Orquestador recomienda agente: ${nextAgent}`);

    switch (nextAgent) {
      case 'sourcing':
        console.log('[MultiAgentWorkflow] Ejecutando Sourcing Agent...');
        const sourcingResult = await executeSourcingAgent(messages, state);
        agentResponse = sourcingResult.response;
        state = sourcingResult.state;
        nextAgent = sourcingResult.nextAgent;
        break;

      case 'landing_builder':
        console.log('[MultiAgentWorkflow] Ejecutando Landing Builder Agent...');
        if (!state.sourcingResult) {
          // Si no hay sourcing previo, ejecutar primero
          const sourcingFirst = await executeSourcingAgent(messages, state);
          state = sourcingFirst.state;
        }
        const landingResult = await executeLandingBuilderAgent(messages, state);
        agentResponse = landingResult.response;
        state = landingResult.state;
        nextAgent = landingResult.nextAgent;
        break;

      case 'copy_social':
        console.log('[MultiAgentWorkflow] Ejecutando Copy Social Agent...');
        const contentResult = await executeCopySocialAgent(messages, state);
        agentResponse = contentResult.response;
        state = contentResult.state;
        nextAgent = contentResult.nextAgent;
        break;

      case 'media_creator':
        console.log('[MultiAgentWorkflow] Ejecutando Media Creator Agent...');
        const mediaResult = await executeMediaCreatorAgent(messages, state);
        agentResponse = mediaResult.response;
        state = mediaResult.state;
        nextAgent = mediaResult.nextAgent;
        break;

      case 'direct':
      default:
      console.log('[MultiAgentWorkflow] Respuesta directa del orquestador');
        // El orquestador respondió directamente (no requiere agente especializado)
        return {
          content: orchestrationResult.intention,
          state,
          hasMore: false,
        };
    }

    // Paso 3: Construir respuesta completa
    const fullResponse = buildWorkflowResponse(agentResponse, nextAgent, state);

    return {
      content: fullResponse,
      state,
      hasMore: nextAgent !== 'complete' && nextAgent !== 'direct',
      nextPrompt: getNextPromptSuggestion(nextAgent, state),
    };
  } catch (err) {
    console.error('[MultiAgentWorkflow] Error:', err);
    throw new Error(`Error en flujo multi-agente: ${err instanceof Error ? err.message : 'desconocido'}`);
  }
}

/**
 * Construye la respuesta formateada para el usuario
 */
function buildWorkflowResponse(
  agentResponse: string,
  nextAgent: string,
  state: AgentState
): string {
  const progressEmojis: Record<string, string> = {
    orchestrate: '🎯',
    sourcing: '🔍',
    landing: '📄',
    content: '📱',
    media: '🎨',
    complete: '✅',
  };

  const stepName: Record<string, string> = {
    orchestrate: 'Analizando tu solicitud',
    sourcing: 'Investigando productos',
    landing: 'Diseñando landing page',
    content: 'Creando copys para redes',
    media: 'Generando ideas visuales',
    complete: 'Flujo completado',
  };

  const header = `
${progressEmojis[state.currentStep] || '✨'} **${stepName[state.currentStep] || 'Procesando'}**

---
`;

  const footer = nextAgent !== 'complete' && nextAgent !== 'direct' ? `

---

**Siguiente paso:** ${getNextStepText(nextAgent)}

*¿Quieres continuar?* Envía "sí" o "siguiente"
` : `

---

✅ **¡Flujo completado!**

Ahora estás listo para:
1. **Crear tu tienda online** con este producto
2. **Configurar pagos** (MercadoPago, Stripe)
3. **Publicar y empezar a vender**

¿Continuamos? Escribe "crear tienda"
`;

  return header + agentResponse + footer;
}

/**
 * Retorna sugerencia de prompt para siguiente paso
 */
function getNextPromptSuggestion(nextAgent: string, state: AgentState): string | undefined {
  const suggestions: Record<string, string> = {
    landing_builder: `Sí, crea una landing page para ${state.sourcingResult?.productName || 'este producto'}`,
    copy_social: `Genera copys para TikTok, Instagram y Facebook`,
    media_creator: `¿Qué ideas de videos tienes? Crea guiones y prompts para IA`,
    complete: `Crear tienda online con este producto`,
  };

  return suggestions[nextAgent];
}

/**
 * Texto descriptivo para el siguiente paso
 */
function getNextStepText(nextAgent: string): string {
  const steps: Record<string, string> = {
    landing_builder: '**Landing Page** - Estructura profesional y copys de venta',
    copy_social: '**Copys Virales** - Instagram, TikTok, Facebook optimizados',
    media_creator: '**Ideas Visuales** - Prompts de IA + guiones de video',
    complete: '**Crear Tienda** - Configurar dominio y pagos',
  };

  return steps[nextAgent] || 'Continuar con siguiente agente';
}

/**
 * De-serializar estado (en caso de persistencia entre requests)
 */
export function deserializeState(serialized: string): AgentState | undefined {
  try {
    const obj = JSON.parse(serialized);
    return {
      ...obj,
      createdAt: new Date(obj.createdAt),
      updatedAt: new Date(obj.updatedAt),
    };
  } catch {
    return undefined;
  }
}

/**
 * Serializar estado para almacenamiento
 */
export function serializeState(state: AgentState): string {
  return JSON.stringify(state);
}
