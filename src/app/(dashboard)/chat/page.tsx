
'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { AgentResultsPanel } from '@/components/chat/AgentResultsPanel';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

// Lazy load ResearchDisplay to optimize memory usage
const ResearchDisplay = dynamic(
  () => import('@/components/chat/ResearchDisplay').then((mod) => mod.ResearchDisplay),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string };
type ToolInvocation = { toolName?: string; state?: string; args?: { query?: string }; result?: unknown };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedWelcome, setHasLoadedWelcome] = useState(false);
  const [agentState, setAgentState] = useState<any>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Load welcome message for new users
  useEffect(() => {
    async function loadWelcomeMessage() {
      if (hasLoadedWelcome || messages.length > 0) return;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Check if user is new
        const { data: onboarding } = await supabase
          .from('onboarding_status')
          .select('completed_tour, tour_skipped_at, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        // Determine welcome message based on user status
        let welcomeMessage = '';
        const isNewUser = !onboarding?.completed_tour && !onboarding?.tour_skipped_at;

        if (isNewUser) {
          welcomeMessage = `¡Hola! 👋 Soy tu asesor de e-commerce impulsado por IA.

**Aquí puedo ayudarte con:**
• 🔍 **Investigación de Mercado** - Busca productos rentables y analiza la competencia
• 📄 **Landing Pages** - Crea páginas para promover tus productos
• 💬 **Copys para Redes** - Genera contenido persuasivo para Instagram, TikTok y Facebook
• 🏪 **Tiendas Online** - Construye tu ecommerce paso a paso
• 💡 **Estrategia** - Consejos sobre e-commerce y emprendimiento

**¿En qué te puedo ayudar hoy?** Describeme tu idea o producto y yo te guío en cada paso. 

Recuerda: puedes hacer clic en el botón **?** (Ayuda) si necesitas ver nuevamente la guía de bienvenida.`;
        } else {
          welcomeMessage = `¡Bienvenido de vuelta! 👋 

¿Qué te traes hoy? 
• 🔍 ¿Buscas un nuevo producto?
• 📄 ¿Necesitas crear una landing?
• 💬 ¿Quieres copys para redes?
• 🏪 ¿Trabajamos en tu tienda?

Cuéntame tu idea y yo me encargo del resto.`;
        }

        const welcomeMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: welcomeMessage,
        };

        setMessages([welcomeMsg]);
        setHasLoadedWelcome(true);
        logger.info('Welcome message loaded', { isNewUser });
      } catch (err) {
        logger.error('Error loading welcome message', err as Error);
        setHasLoadedWelcome(true);
      }
    }

    loadWelcomeMessage();
  }, [hasLoadedWelcome, messages.length]);

  const toolInvocations = useMemo<ToolInvocation[]>(() => [], []);

  const latestAssistantMessage = useMemo(() => {
    const latest = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && typeof m.content === 'string');
    return latest?.content || '';
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');

    try {
      const res = await fetch('/api/chat?mode=multi&sync=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          state: agentState,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error en el chat');
      }

      const data = await res.json();
      if (!data || !data.content) {
        throw new Error('Respuesta vacía del servidor. Intenta de nuevo.');
      }
      
      // Actualizar estado de agentes si existe
      if (data.state) {
        setAgentState(data.state);
        console.log('[ChatPage] Estado de agentes actualizado:', data.state);
        
        // Auto-abrir panel si hay resultados
        if (data.state.sourcingResult || data.state.landingResult || 
            data.state.contentResult || data.state.mediaResult) {
          setIsPanelVisible(true);
        }
      }
      
      const rawAssistantText = String(data.content);
      const assistantText = rawAssistantText
        .replace(/<function=\w+>[^]*?<\/function>/g, '')
        .replace(/<function=\w+>[^]*$/g, '')
        .trim();
      if (!assistantText.trim()) {
        throw new Error('El asistente no pudo generar una respuesta. Intenta con un mensaje diferente.');
      }

      // Filtrar mensajes extensos (>500 chars) para mostrar solo resumen en chat
      const shouldAddToChat = assistantText.length < 500 || 
                              assistantText.includes('¿') || 
                              assistantText.toLowerCase().includes('continuar');
      
      const messageContent = shouldAddToChat 
        ? assistantText 
        : '✅ Resultados procesados. Haz clic en "Ver Resultados" para ver los detalles.';

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: messageContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-gray-200 dark:bg-black relative">
      {/* Panel de resultados de agentes */}
      <AgentResultsPanel 
        agentState={agentState} 
        isVisible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
      />

      {/* Main Content Area (Research Results) */}
      <div className="flex-1 min-w-0 h-full min-h-0 overflow-hidden relative">
        <ResearchDisplay 
          toolInvocations={toolInvocations} 
          isLoading={isLoading} 
          assistantMessage={latestAssistantMessage}
          refreshKey={messages.length}
          onQuickPrompt={sendMessage}
        />
      </div>

      {/* Right Sidebar (Chat) */}
      <div className="w-full lg:w-64 xl:w-72 h-[40vh] lg:h-full flex-shrink-0 z-10">
        <ChatSidebar
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          sendMessage={sendMessage}
          isLoading={isLoading}
          sessionRefreshKey={messages.length}
          onToggleResults={() => setIsPanelVisible(!isPanelVisible)}
          isPanelVisible={isPanelVisible}
        />
        {error && (
          <div className="px-4 pb-4 text-sm text-red-600">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
