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
  progressMessages?: string[]; // Nuevos mensajes de progreso para mostrar en el chat
}

/**
 * Ejecuta el flujo multi-agente secuencial CON PAUSAS:
 * 1. Orquestador detecta intención
 * 2. Routing a agente específico (sourcing, landing, content, media)
 * 3. Mantenimiento de estado entre agentes
 * 4. **UNO A LA VEZ** - espera confirmación del usuario entre pasos
 * 5. **MENSAJES DE PROGRESO** - informa al usuario en tiempo real
 */
export async function executeMultiAgentWorkflow(
  messages: any[],
  userId: string,
  existingState?: AgentState
): Promise<MultiAgentResult> {
  const progressMessages: string[] = [];
  
  try {
    console.log('[MultiAgentWorkflow] ===========================================');
    console.log('[MultiAgentWorkflow] Iniciando workflow');
    console.log('[MultiAgentWorkflow] Estado existente:', existingState ? 'SÍ' : 'NO');
    
    // Verificar si el usuario está confirmando continuar
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content.toLowerCase() || '';
    
    console.log('[MultiAgentWorkflow] Último mensaje usuario:', lastUserMessage);
    
    const isConfirming = 
      lastUserMessage.includes('sí') ||
      lastUserMessage.includes('si') ||
      lastUserMessage.includes('siguiente') ||
      lastUserMessage.includes('continua') ||
      lastUserMessage.includes('continuar') ||
      lastUserMessage.includes('ok') ||
      lastUserMessage.includes('dale');

    console.log('[MultiAgentWorkflow] ¿Usuario confirmando?:', isConfirming);

    // Si hay estado existente y usuario está confirmando, continuar con siguiente agente
    if (existingState && isConfirming && existingState.nextAgent) {
      console.log(`[MultiAgentWorkflow] ✅ CONTINUANDO con agente: ${existingState.nextAgent}`);
      progressMessages.push(`🔄 Continuando con ${existingState.nextAgent}...`);
      return await executeSingleAgent(messages, userId, existingState, existingState.nextAgent, progressMessages);
    }

    console.log(`${'-'.repeat(60)}`);
    console.log('[MultiAgentWorkflow] 🎯 NUEVA EJECUCIÓN - Consultando orquestador...');
    console.log(`${'-'.repeat(60)}`);
    
    // Primera vez: Orquestador detecta intención
    progressMessages.push('🎯 Analizando tu solicitud...');
    const orchestrationResult = await executeOrchestratorAgent(messages, userId);

    const nextAgent = orchestrationResult.nextAgent;
    console.log(`[MultiAgentWorkflow] Orquestador decidió: "${nextAgent}"`);
    progressMessages.push(`✅ Análisis completado. Iniciando: ${nextAgent}`);

    // Si el orquestador dice "direct", responder y terminar
    if (nextAgent === 'direct') {
      console.log('[MultiAgentWorkflow] 💬 Respuesta directa, NO ejecutar agentes');
      console.log(`${'='.repeat(60)}\n`);
      return {
        content: orchestrationResult.intention,
        state: orchestrationResult.state,
        hasMore: false,
        progressMessages,
      };
    }

    // Ejecutar SOLO el primer agente recomendado y PARAR
    console.log(`${'!'.repeat(60)}`);
    console.log(`[MultiAgentWorkflow] ⚠️ EJECUTANDO SOLO: "${nextAgent}"`);
    console.log(`[MultiAgentWorkflow] ⚠️ Después de esto, el workflow se PAUSARÁ`);
    console.log(`[MultiAgentWorkflow] ⚠️ Usuario debe confirmar para continuar`);
    console.log(`${'!'.repeat(60)}`);
    return await executeSingleAgent(messages, userId, orchestrationResult.state, nextAgent, progressMessages);
  } catch (err) {
    console.error('[MultiAgentWorkflow] Error:', err);
    throw new Error(`Error en flujo multi-agente: ${err instanceof Error ? err.message : 'desconocido'}`);
  }
}

/**
 * Ejecuta UN SOLO agente y se detiene
 */
async function executeSingleAgent(
  messages: any[],
  userId: string,
  state: AgentState,
  agentToExecute: string,
  progressMessages: string[] = []
): Promise<MultiAgentResult> {
  console.log(`[executeSingleAgent] ==============`);
  console.log(`[executeSingleAgent] Agente a ejecutar: ${agentToExecute}`);
  
  let agentResponse = '';
  let nextAgent = 'complete';
  let updatedState = { ...state };

  // Ejecutar SOLO el agente indicado
  switch (agentToExecute) {
    case 'sourcing':
      console.log('[executeSingleAgent] ⚙️ Ejecutando SOURCING...');
      progressMessages.push('🔍 Investigando producto y proveedores...');
      const sourcingResult = await executeSourcingAgent(messages, state);
      agentResponse = sourcingResult.response;
      updatedState = sourcingResult.state;
      nextAgent = sourcingResult.nextAgent;
      progressMessages.push('✅ Investigación completada');
      console.log(`[executeSingleAgent] ✅ Sourcing completado. Siguiente sugerido: ${nextAgent}`);
      break;

    case 'landing_builder':
      console.log('[MultiAgentWorkflow] Ejecutando SOLO Landing Builder Agent...');
      progressMessages.push('📄 Generando landing page...');
      if (!state.sourcingResult) {
        // Si no hay sourcing previo, ejecutar primero
        progressMessages.push('⚠️ Ejecutando investigación previa...');
        const sourcingFirst = await executeSourcingAgent(messages, state);
        updatedState = sourcingFirst.state;
      }
      const landingResult = await executeLandingBuilderAgent(messages, updatedState);
      agentResponse = landingResult.response;
      updatedState = landingResult.state;
      nextAgent = landingResult.nextAgent;
      progressMessages.push('✅ Landing page generada');
      break;

    case 'copy_social':
      console.log('[MultiAgentWorkflow] Ejecutando SOLO Copy Social Agent...');
      progressMessages.push('💬 Creando copys para redes...');
      const contentResult = await executeCopySocialAgent(messages, state);
      agentResponse = contentResult.response;
      updatedState = contentResult.state;
      nextAgent = contentResult.nextAgent;
      progressMessages.push('✅ Copys generados');
      break;

    case 'media_creator':
      console.log('[MultiAgentWorkflow] Ejecutando SOLO Media Creator Agent...');
      progressMessages.push('🎨 Generando ideas visuales...');
      const mediaResult = await executeMediaCreatorAgent(messages, state);
      agentResponse = mediaResult.response;
      updatedState = mediaResult.state;
      nextAgent = mediaResult.nextAgent;
      progressMessages.push('✅ Medios generados');
      break;

    default:
      console.log('[MultiAgentWorkflow] Agente no reconocido:', agentToExecute);
      agentResponse = 'Agente no disponible.';
      nextAgent = 'complete';
  }

  // Guardar el siguiente agente en el estado para la próxima iteración
  updatedState.nextAgent = nextAgent;

  console.log(`\n${'🛑'.repeat(30)}`);
  console.log(`[executeSingleAgent] 🛑 WORKFLOW PAUSADO`);
  console.log(`[executeSingleAgent] Estado guardado con nextAgent: "${nextAgent}"`);
  console.log(`[executeSingleAgent] Esperando confirmación del usuario...`);
  
  // Agregar mensaje de resumen con el progreso
  const progressSummary = progressMessages.join('\n');
  const finalMessage = `${progressSummary}\n\n${agentResponse}\n\n${nextAgent !== 'complete' ? `⏸️ **Workflow pausado**. ¿Continuar con ${nextAgent}?` : '✅ **Workflow completado**'}`;
  console.log(`[executeSingleAgent] Usuario debe enviar: "sí", "siguiente", "continuar", "ok" o "dale"`);
  console.log(`${'🛑'.repeat(30)}\n`);
  console.log(`${'='.repeat(60)}\n`);

  // Construir respuesta con indicación clara de siguiente paso
  const fullResponse = buildWorkflowResponse(agentResponse, nextAgent, updatedState);

  return {
    content: finalMessage || fullResponse,
    state: updatedState,
    hasMore: nextAgent !== 'complete' && nextAgent !== 'direct',
    nextPrompt: getNextPromptSuggestion(nextAgent, updatedState),
    progressMessages,
  };
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
${state.currentStep ? (progressEmojis[state.currentStep] || '✨') : '✨'} **${state.currentStep ? stepName[state.currentStep] : 'Procesando'}**

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
