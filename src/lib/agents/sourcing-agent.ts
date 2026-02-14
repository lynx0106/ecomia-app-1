import { generateText, tool } from 'ai';
import { z } from 'zod';
import { createXai } from '@ai-sdk/xai';
import { tavily } from '@tavily/core';
import type { AgentState } from './types';
import { getAgentSystemPrompt } from './agent-definitions';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || 'dummy-key-for-build' });

function getSourcingFallbackPrompt(): string {
  return `
Eres un Analista de Sourcing Estratégico especializado en e-commerce para LATAM.

MISIÓN:
- Investigar productos según lo que pida el usuario
- Buscar proveedores reales en Mercado Libre Colombia, AliExpress, distribuidoras
- Analizar viabilidad: demanda, competencia, margen, riesgos
- Proporcionar tabla clara con opciones

DIRECTRICES:
- Sé rápido y práctico
- Si no encuentras datos, indica "dato no disponible"
- Prioriza: Colombia > Latinoamérica > Internacional

ESTRUCTURA DE RESPUESTA:
## [NOMBRE DEL PRODUCTO]
Descripción breve y análisis de viabilidad.

### TABLA DE INVESTIGACIÓN
| Proveedor | Precio | PVP Sugerido |
| --- | --- | --- |
| [nombre] | [COP/USD] | [COP/USD] |

### ANÁLISIS
- **Demanda:** Alta/Media/Baja
- **Competencia:** Alta/Media/Baja  
- **Margen:** Bajo/Medio/Alto
`;
}

export async function executeSourcingAgent(
  messages: any[],
  state: AgentState
): Promise<{ response: string; nextAgent: string; state: AgentState }> {
  const userMessage = messages
    ?.filter((m) => m.role === 'user')
    ?.pop()?.content || '';

  let systemPrompt: string;
  try {
    systemPrompt = await getAgentSystemPrompt('sourcing');
    if (!systemPrompt) {
      console.warn('No sourcing prompt found in DB, using fallback');
      systemPrompt = getSourcingFallbackPrompt();
    }
  } catch (err) {
    console.error('Error loading sourcing prompt from DB:', err);
    systemPrompt = getSourcingFallbackPrompt();
  }

  try {
    // Búsqueda con timeout corto (máx 1.5s para ser más rápido)
    const searchResults = await Promise.race([
      (async () => {
        try {
          const results = await tvly.search(userMessage, {
            topic: 'general',
            max_results: 2,
          });
          return results.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');
        } catch {
          return '';
        }
      })(),
      new Promise<string>((resolve) => setTimeout(() => resolve(''), 1500)),
    ]);

    console.log('[Sourcing] 🔍 Búsqueda completada en < 1.5s');

    const response = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      messages: [
        ...messages.slice(-3).map((m: any) => ({ // Solo últimos 3 mensajes para reducir tokens
          role: m.role,
          content: m.content,
        })),
        ...(searchResults ? [{
          role: 'user',
          content: `DATOS DE BÚSQUEDA:\n${searchResults.slice(0, 1000)}`, // Limitar a 1000 chars
        }] : []),
      ],
      temperature: 0.5,
      maxTokens: 800, // Limitar tokens de respuesta para ser más rápido
    } as any);

    const newState: AgentState = {
      ...state,
      currentStep: 'sourcing',
      previousSteps: [...(state.previousSteps || []), 'sourcing'],
      updatedAt: new Date(),
      sourcingResult: {
        productName: userMessage.substring(0, 50),
        productDescription: response.text.substring(0, 200),
        providers: [],
        analysis: {
          demand: 'Alta',
          competition: 'Media',
          margin: 'Medio',
          risks: [],
        },
        strategy: {
          hook: '',
          trend: '',
          alternative: '',
        },
      },
    };

    const nextAgent = 'landing_builder';

    console.log('[Sourcing] ✅ Completado. Siguiente sugerido: landing');

    return {
      response: response.text,
      nextAgent,
      state: newState,
    };
  } catch (err) {
    console.error('Sourcing agent error:', err);
    throw new Error('Error en agente de sourcing');
  }
}
