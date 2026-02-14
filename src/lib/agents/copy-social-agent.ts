import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import type { AgentState } from './types';
import { getAgentSystemPrompt } from './agent-definitions';

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Copy Social Agent - Crear copys persuasivos para redes sociales
 * System Prompt is now loaded from database for real-time updates
 */

function getCopySocialFallbackPrompt(productName: string): string {
  return `
Eres un Content Creator especializado en copys virales para e-commerce en TikTok, Instagram y Facebook.

MISIÓN:
- Crear copys cortos, directos y persuasivos
- Optimizados por plataforma (TikTok ≠ Instagram ≠ Facebook)
- Incluir emojis estratégicos pero no excesivos
- Hashtags relevantes y trending
- Hook que detiene el scroll en primeros 0.5 segundos

REGLAS:
- NUNCA TEXTO LARGO EN TIKTOK (máximo 2 líneas + CTA)
- Instagram: mix de visual + texto (2-3 párrafos)
- Facebook: storytelling, máximo 4-5 párrafos
- Usar números/datos reales si existen
- "Para [audiencia específica] que [dolor] → nuestra solución"
- Calls-to-action claros: "Link en bio", "Tap", "DM para info"

ESTRUCTURA DE RESPUESTA:

## COPYS PARA "${productName.toUpperCase()}"

### 🎬 TIKTOK (15-30 segundos)
**Hook Inicial (primeras palabras):**
${productName === 'producto' ? '[Hook que detiene el scroll]' : '[Crea hook impactante para ' + productName + ']'}

**Copy completo:**
[Máximo 2 líneas de texto persuasivo + CTA en caption]

**Hashtags:**
#[hashtag1] #[hashtag2] #[hashtag3] #[hashtag4] #[hashtag5]

**Trending Audio Suggestions:**
[3 canciones/sonidos trending recomendados para este producto]

---

### 📸 INSTAGRAM (Carousel/Reel)
**Slide 1 - Hook:**
[Imagen visual + frase impactante]

**Full Copy (caption):**
[2-3 párrafos storytelling + CTA]

**Hashtags:**
#[hashtag1] #[hashtag2] ... [15-20 hashtags relevantes]

**Call-to-Action:**
[Link en bio o "Tap el link"]

---

### 👥 FACEBOOK
**Headline:**
[Título atractivo]

**Body Copy:**
[4-5 párrafos con problema → solución]

**CTA Button Suggestion:**
[Botón recomendado: "Learn More", "Shop Now", "Contact Us"]

---

### 💡 ADDITIONAL STRATEGIES
- **UGC Ideas:** [ideas de User Generated Content]
- **Influencer Angle:** [cómo presentar a un microinfluencer]
- **Paid Ad Copy:** [versión para anuncios pagos]
- **Email Subject Line:** [si venden email list]

### SIGUIENTE PASO
¿Quieres ideas de media + videos? O vamos directo a crear tu tienda online?
`;
}

export async function executeCopySocialAgent(
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
    let dbPrompt = await getAgentSystemPrompt('copy_social');
    if (!dbPrompt) {
      console.warn('No copy_social prompt found in DB, using fallback');
      systemPrompt = getCopySocialFallbackPrompt(productName);
    } else {
      // Replace placeholder if present
      systemPrompt = dbPrompt.replace('${productName}', productName);
    }
  } catch (err) {
    console.error('Error loading copy_social prompt from DB:', err);
    systemPrompt = getCopySocialFallbackPrompt(productName);
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
      currentStep: undefined, // Limpiado después de completar
      previousSteps: [...state.previousSteps, 'content'],
      updatedAt: new Date(),
      contentResult: {
        instagram: { post: 'Instagram copy', hashtags: '#ecommerce' },
        tiktok: { post: 'TikTok copy', hashtags: '#viral' },
        facebook: { post: 'Facebook copy', hashtags: '#sale' },
      },
    };

    return {
      response: response.text,
      nextAgent: 'media_creator',
      state: newState,
    };
  } catch (err) {
    console.error('Copy social agent error:', err);
    throw new Error('Error en agente de copys');
  }
}
