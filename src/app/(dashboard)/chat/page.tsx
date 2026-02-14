
'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { CheckCircle, Loader2, Trash2 } from 'lucide-react';

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
  const [showLegacyResults, setShowLegacyResults] = useState(false);

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
      }
      
      // Agregar mensajes de progreso al chat si existen
      const progressMsgs: Message[] = [];
      if (data.progressMessages && Array.isArray(data.progressMessages)) {
        data.progressMessages.forEach((msg: string) => {
          progressMsgs.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: msg,
          });
        });
      }
      
      const rawAssistantText = String(data.content);
      const assistantText = rawAssistantText
        .replace(/<function=\w+>[^]*?<\/function>/g, '')
        .replace(/<function=\w+>[^]*$/g, '')
        .trim();
      if (!assistantText.trim()) {
        throw new Error('El asistente no pudo generar una respuesta. Intenta con un mensaje diferente.');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantText,
      };

      setMessages((prev) => [...prev, ...progressMsgs, assistantMessage]);
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

  const handleContinue = async () => {
    // Enviar confirmación automática
    await sendMessage('sí, continuar');
  };

  const handleDeleteInvestigation = () => {
    if (confirm('¿Eliminar esta investigación? Se perderán todos los resultados.')) {
      setAgentState(null);
      setMessages([]);
      setIsPanelVisible(false);
      setInput('');
      setShowLegacyResults(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-gray-200 dark:bg-black relative">
      {/* Main Content Area (Research Results) */}
      {!agentState && !showLegacyResults && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🧭</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Listo para investigar</h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              Usa el chat para iniciar una investigación. Los resultados aparecerán aquí en el centro.
            </p>
            <button
              onClick={() => setShowLegacyResults(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Ver investigaciones anteriores
            </button>
          </div>
        </div>
      )}

      {!agentState && showLegacyResults && (
        <div className="flex-1 min-w-0 h-full min-h-0 overflow-hidden relative">
          <ResearchDisplay 
            toolInvocations={toolInvocations} 
            isLoading={isLoading} 
            assistantMessage={latestAssistantMessage}
            refreshKey={messages.length}
            onQuickPrompt={sendMessage}
          />
        </div>
      )}

      {/* Vista de progreso de agentes en el centro */}
      {agentState && (
        <div className="flex-1 min-w-0 h-full min-h-0 overflow-hidden p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Flujo Multi-Agente</h2>
            
            {/* Progreso de agentes */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-4">
              <div className="space-y-3">
                {[
                  { name: '🎯 Análisis de Intención', type: 'orchestrator' },
                  { name: '🔍 Investigación de Producto', type: 'sourcing', result: agentState.sourcingResult },
                  { name: '📄 Generación de Landing', type: 'landing', result: agentState.landingResult },
                  { name: '💬 Creación de Copys', type: 'copys', result: agentState.contentResult },
                  { name: '🎨 Generación de Medios', type: 'media', result: agentState.mediaResult },
                ].map((item, idx) => {
                  const status = (() => {
                    if (!agentState) return 'pending';
                    const currentStep = agentState.currentStep;
                    const previousSteps = agentState.previousSteps || [];
                    if (currentStep === item.type) return 'loading';
                    if (previousSteps.includes(item.type)) return 'completed';
                    return 'pending';
                  })();

                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-shrink-0">
                        {status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {status === 'loading' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {status === 'pending' && (
                          <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                        {status === 'loading' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Procesando...</p>
                        )}
                        {status === 'completed' && item.result && (
                          <p className="text-xs text-green-600 dark:text-green-400">Completado</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de progreso */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progreso del flujo</span>
                  <span>{(agentState.previousSteps?.length || 0)}/4 completados</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((agentState.previousSteps?.length || 0) / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                {agentState.nextAgent && agentState.nextAgent !== 'complete' && (
                  <button
                    onClick={handleContinue}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Continuar con {agentState.nextAgent === 'landing_builder' ? 'Landing' : agentState.nextAgent === 'copy_social' ? 'Copys' : agentState.nextAgent === 'media_creator' ? 'Medios' : 'siguiente paso'}
                  </button>
                )}
                <button
                  onClick={handleDeleteInvestigation}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar investigación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {agentState.sourcingResult && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">🔍 Investigación de Producto</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Producto: {agentState.sourcingResult.productName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{agentState.sourcingResult.productDescription}</p>
                  </div>
                </div>
              )}
              
              {agentState.landingResult && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">📄 Landing Page</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Landing generada exitosamente</p>
                </div>
              )}
              
              {agentState.contentResult && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">💬 Copys para Redes</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Contenido generado para redes sociales</p>
                </div>
              )}
              
              {agentState.mediaResult && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">🎨 Medios y Visuales</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Ideas visuales generadas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar (Chat) */}
      <div className="w-full lg:w-80 xl:w-96 h-[40vh] lg:h-full flex-shrink-0 z-10">
        <ChatSidebar
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          sendMessage={sendMessage}
          isLoading={isLoading}
          sessionRefreshKey={messages.length}
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
