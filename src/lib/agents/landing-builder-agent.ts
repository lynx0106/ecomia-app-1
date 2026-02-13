import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import type { AgentState } from './types';
import { getAgentSystemPrompt } from './agent-definitions';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Landing Builder Agent - Crear estructura y copy de landing page
 * System Prompt is now loaded from database for real-time updates
 */

function getLandingBuilderFallbackPrompt(productContext: string): string {
  return `
Eres un Landing Page Designer especializado en conversión para e-commerce.

MISIÓN:
- Crear estructura profesional de landing page based on:
  * Producto que investiga
  * Audiencia (TikTok/Instagram shoppers)
  * Objetivos de conversión
- Generar copy persuasivo + titles + CTAs
- Sugerir colores/tipografías basado en producto
- No diseñar visualmente (eso es para Media Agent)

ESTRUCTURA DE RESPUESTA:

## LANDING PAGE STRUCTURE: "${productContext}"

### HERO SECTION
- **Title:** [título impactante, 5-8 palabras]
- **Subtitle:** [propuesta de valor, 1 línea]
- **Main Image:** [descripción de visualización]
- **CTA Button:** [Texto call-to-action]

### PROBLEM SECTION
- Problema 1: [punto de dolor del cliente]
- Problema 2: [punto de dolor del cliente]
- Problema 3: [punto de dolor del cliente]

### SOLUTION SECTION
- Beneficio 1: [cómo resuelves problema 1]
- Beneficio 2: [cómo resuelves problema 2]
- Beneficio 3: [cómo resuelves problema 3]

### SOCIAL PROOF
- Testimonios: [sugerencia, ej: "100+ usuarios satisfechos"]
- Reviews: [sugerencia, ej: "4.8/5 estrellas"]

### FAQ
1. P: [pregunta común]
   R: [respuesta clara, 2-3 líneas]
2. P: [pregunta común]
   R: [respuesta clara, 2-3 líneas]
3. P: [pregunta común]
   R: [respuesta clara, 2-3 líneas]

### FOOTER CTA
- Final Message: [último call-to-action]
- Button Text: [acción final]

### RECOMENDACIONES DE DISEÑO
- **Paleta de Color:** [colores recomendados + razón]
- **Tipografía:** [estilos recomendados]
- **Mobile Strategy:** [cómo se ve en celular]
- **Load Time:** [optimizaciones para velocidad]

### SIGUIENTE PASO
¿Quieres copys para redes sociales + ideas de media? O ya estás listo para crear la tienda?
`;
}

export async function executeLandingBuilderAgent(
  messages: any[],
  state: AgentState
): Promise<{ response: string; nextAgent: string; state: AgentState }> {
  const userMessage = messages
    ?.filter((m) => m.role === 'user')
    ?.pop()?.content || '';

  const productContext = state.sourcingResult?.productName || 'tu producto';

  // Load system prompt from database
  let systemPrompt: string;
  try {
    let dbPrompt = await getAgentSystemPrompt('landing_builder');
    if (!dbPrompt) {
      console.warn('No landing_builder prompt found in DB, using fallback');
      systemPrompt = getLandingBuilderFallbackPrompt(productContext);
    } else {
      // Replace placeholder if present
      systemPrompt = dbPrompt.replace('${productContext}', productContext);
    }
  } catch (err) {
    console.error('Error loading landing_builder prompt from DB:', err);
    systemPrompt = getLandingBuilderFallbackPrompt(productContext);
  }

  try {
    const response = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.6,
    } as any);

    const newState: AgentState = {
      ...state,
      currentStep: 'landing',
      previousSteps: [...state.previousSteps, 'landing'],
      updatedAt: new Date(),
      landingResult: {
        title: 'Landing for ' + productContext,
        subtitle: 'Professional conversion-optimized page',
        benefits: [],
        faq: [],
        cta: 'Buy Now',
      },
    };

    const userWantsMedia = userMessage.toLowerCase().includes('media') ||
      userMessage.toLowerCase().includes('contenido') ||
      userMessage.toLowerCase().includes('videos') ||
      userMessage.toLowerCase().includes('copys');

    const nextAgent = userWantsMedia ? 'copy_social' : 'copy_social';

    return {
      response: response.text,
      nextAgent,
      state: newState,
    };
  } catch (err) {
    console.error('Landing builder agent error:', err);
    throw new Error('Error en agente de landing');
  }
}
