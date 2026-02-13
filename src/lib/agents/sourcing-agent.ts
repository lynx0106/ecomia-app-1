import { generateText, tool } from 'ai';
import { z } from 'zod';
import { createXai } from '@ai-sdk/xai';
import { tavily } from '@tavily/core';
import type { AgentState } from './types';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || 'dummy-key-for-build' });

/**
 * Sourcing & Research Agent - Investigación de productos y proveedores
 */

export async function executeSourcingAgent(
  messages: any[],
  state: AgentState
): Promise<{ response: string; nextAgent: string; state: AgentState }> {
  const userMessage = messages
    ?.filter((m) => m.role === 'user')
    ?.pop()?.content || '';

  const systemPrompt = `
Eres un Analista de Sourcing Estratégico especializado en e-commerce para LATAM.

MISIÓN:
- Investigar productos según lo que pida el usuario
- Buscar proveedores reales en Mercado Libre Colombia, AliExpress, distribuidoras
- Analizar viabilidad: demanda, competencia, margen, riesgos
- Proporcionar tabla clara con opciones
- Pedir confirmación antes de continuar

DIRECTRICES:
- NUNCA INVENTES PRECIOS NI PROVEEDORES
- Si no encuentras, indica "dato no disponible"
- Prioriza: Colombia > Latinoamérica > Internacional
- Formatos: COP y USD
- Links reales o "dato no disponible"
- Si el usuario quiere "flujo completo", después de esto dice: "Continuamos a Landing Builder"

ESTRUCTURA DE RESPUESTA:
## [NOMBRE DEL PRODUCTO]
Descripción breve de por qué es ganador.

### TABLA DE INVESTIGACIÓN
| Proveedor | Contacto | Precio Proveedor | PVP Sugerido |
| --- | --- | --- | --- |
| [nombre] | [URL o dato no disponible] | [COP/USD] | [COP/USD] |

### ANÁLISIS RÁPIDO
- **Demanda:** [Alta/Media/Baja] + motivo breve
- **Competencia:** [Alta/Media/Baja] + motivo breve
- **Margen:** [Bajo/Medio/Alto] + motivo breve
- **Riesgos:** [logística, devoluciones, restricciones ads]

### ESTRATEGIA PARA REDES SOCIALES
- **Hook:** [por qué detiene el scroll]
- **Tendencia:** [popularidad actual en TikTok/Instagram]
- **Alternativa:** [producto similar en tendencia]

### SIGUIENTE PASO
¿Quieres continuar con una Landing Page + tienda online para este producto? 
[SÍ] → Landing Builder próximo
[NO] → ¿Investigar otro producto?
`;

  try {
    // Buscar en internet usando Tavily
    const searchResults = await (async () => {
      try {
        const results = await tvly.search(userMessage, {
          topic: 'general',
          max_results: 3,
        });
        return results.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');
      } catch {
        return '(Búsqueda en internet no disponible)';
      }
    })();

    const response = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      messages: [
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: `Datos de búsqueda en internet:\n${searchResults}`,
        },
      ],
      temperature: 0.5,
    } as any);

    const newState: AgentState = {
      ...state,
      currentStep: 'sourcing',
      previousSteps: [...state.previousSteps, 'sourcing'],
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

    // Determinar siguiente paso
    const userWantsComplete = userMessage.toLowerCase().includes('tienda') ||
      userMessage.toLowerCase().includes('landing') ||
      userMessage.toLowerCase().includes('completo');

    const nextAgent = userWantsComplete ? 'landing_builder' : 'media';

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
