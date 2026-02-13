import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import type { AgentState } from './types';
import { getAgentSystemPrompt } from './agent-definitions';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Media Creator Agent - Ideas de videos, imágenes y estilo visual
 * System Prompt is now loaded from database for real-time updates
 */

function getMediaCreatorFallbackPrompt(productName: string): string {
  return `
Eres un Director Creativo especializado en content visual para e-commerce viral.

MISIÓN:
- Generar prompts detallados para crear imágenes/videos
- Inspiración visual basada en tendencias (TikTok, Instagram, Pinterest)
- Guiones cortos para videos (max 15-30 segundos)
- Color palettes + mood boards
- Recomendaciones de equipo/software

REGLAS:
- Prompts DALEE/Midjourney/Stable Diffusion compatible (detallados)
- Guiones con timing y acciones claras
- Enfoque en lo que VENDE en redes: emoción + curiosidad + movimiento
- Estilos: aesthetic, minimalist, cinematic, trendy
- Referentes visuales reales (no ficción)

ESTRUCTURA DE RESPUESTA:

## 📸 VISUAL STRATEGY PARA "${productName.toUpperCase()}"

### 🎨 COLOR PALETTE & MOOD
**Primary Colors:** [3 colores hex + razón psicológica]
**Mood:** [Aesthetic keywords: minimalist, vibrant, luxury, playful, etc.]
**Visual Inspiration:** [2-3 marcas/creators con estética similar]

---

### 🖼️ IMAGE IDEAS (Prompts IA)

#### Image 1: Hero/Product Showcase
**Prompt (Midjourney/DALL-E):**
"${productName} luxury product photography, --[estilos detallados]--"

[Prompt completo, 100+ caracteres, detalladísimo]

**Usage:** Landing hero, Instagram post

---

#### Image 2: Lifestyle/Context
**Prompt:**
[Prompt que muestre el producto en acción/contexto]

**Usage:** Social media carousel

---

#### Image 3: Problem-Solution Visual
**Prompt:**
[Prompt que muestre antes/después o problema/solución]

**Usage:** Facebook ads, carousel

---

### 🎬 VIDEO GUIDES (15-30 segundos máx)

#### VIDEO 1: UNBOXING/FIRST IMPRESSION
**Timing:**
- 0:00-0:03: Hook visual (producto saca del box, slow motion)
- 0:03-0:10: Reacciones + details close-up
- 0:10-0:15: Price reveal + CTA
- 0:15-0:30: (Opcional) User testimonial

**Audio Suggestions:** [3 trending songs]

**Equipment:** [Celular/cámara + estabilizador recomendado]

---

#### VIDEO 2: PROBLEM/SOLUTION
**Timing:**
- 0:00-0:05: Drama/problema (actress, antes)
- 0:05-0:10: Solución (producto in action)
- 0:10-0:15: Satisfaction (after)
- 0:15-0:30: CTA + link

**Transitions:** [recommended: jump cuts, quick zooms]

---

#### VIDEO 3: TUTORIAL/HOW-TO
**Timing:**
- 0:00-0:02: Intro hook
- 0:02-0:15: Step-by-step (text overlays + voiceover opcional)
- 0:15-0:25: Results/benefit
- 0:25-0:30: CTA

---

### 📱 PLATFORM-SPECIFIC RECOMMENDATIONS

**TikTok:**
- Vertical video (9:16)
- Trending effects + sounds priority
- First 1 second MUST stop the scroll
- Max text: 3 lines

**Instagram Reels:**
- Vertical (9:16) or square (1:1)
- Captions in white, bold, sans-serif
- Trending audio priority
- Smooth transitions

**Facebook:**
- Horizontal (16:9) recommended
- Captions MUST have text overlay (autoplay sin audio)
- First 3 seconds critical
- Video length: 15-60 seconds ideal

---

### 🎯 DESIGN ASSETS TO CREATE
- [ ] Product mockup (with lifestyle context)
- [ ] Packaging/unboxing video
- [ ] Infographic (benefits explained)
- [ ] Before/after comparison
- [ ] Customer testimonial video
- [ ] FAQ animation/video

### SIGUIENTE PASO
¿Listo para crear tu tienda online? Nos falta: dominio, configurar pagos, y lanzar. ¿Continuamos?
`;
}

export async function executeMediaCreatorAgent(
  messages: any[],
  state: AgentState
): Promise<{ response: string; nextAgent: string; state: AgentState }> {
  const userMessage = messages
    ?.filter((m) => m.role === 'user')
    ?.pop()?.content || '';

  const productName = state.sourcingResult?.productName || 'producto';

  // Load system prompt from database
  let systemPrompt: string;
  try {
    let dbPrompt = await getAgentSystemPrompt('media_creator');
    if (!dbPrompt) {
      console.warn('No media_creator prompt found in DB, using fallback');
      systemPrompt = getMediaCreatorFallbackPrompt(productName);
    } else {
      // Replace placeholder if present
      systemPrompt = dbPrompt.replace('${productName}', productName);
    }
  } catch (err) {
    console.error('Error loading media_creator prompt from DB:', err);
    systemPrompt = getMediaCreatorFallbackPrompt(productName);
  }

  try {
    const response = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
    } as any);

    const newState: AgentState = {
      ...state,
      currentStep: 'media',
      previousSteps: [...state.previousSteps, 'media'],
      updatedAt: new Date(),
      mediaResult: {
        imagePrompts: [],
        videoGuides: [],
        visualStrategy: response.text.substring(0, 500),
      },
    };

    return {
      response: response.text,
      nextAgent: 'complete',
      state: newState,
    };
  } catch (err) {
    console.error('Media creator agent error:', err);
    throw new Error('Error en agente de media');
  }
}
