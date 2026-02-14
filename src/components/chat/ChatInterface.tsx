'use client';

import { useState } from "react";
import { useToast } from '@/components/ui/ToastProvider';
import { Trash2, RotateCcw, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { AgentResultsPanel } from './AgentResultsPanel';

type Message = { id: string; role: "user" | "assistant"; content: string; isAgentMessage?: boolean };
type AgentState = any; // Estado del flujo multi-agente

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<AgentState | null>(null); // Estado del workflow
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Panel de resultados
  const { toast } = useToast();

  const handleClearChat = () => {
    if (messages.length === 0) return;
    
    if (confirm('¿Limpiar todas las investigaciones? No se guardarán en el histórico.')) {
      setMessages([]);
      setInput("");
      setError(null);
      setAgentState(null); // Limpiar estado del workflow
      setIsPanelVisible(false); // Cerrar panel
      toast({
        title: '✓ Chat limpiado',
        description: 'Puedes comenzar una nueva investigación.',
        tone: 'success',
        durationMs: 3000,
      });
    }
  };

  const handleNewResearch = () => {
    if (messages.length === 0) return handleClearChat();
    
    if (confirm('¿Comenzar nueva investigación? Los mensajes actuales se perderán (no se guardan).')) {
      setMessages([]);
      setInput("");
      setError(null);
      setAgentState(null); // Reiniciar estado del workflow
      setIsPanelVisible(false); // Cerrar panel
      toast({
        title: '🚀 Nueva investigación',
        description: 'Lista para comenzar.',
        tone: 'success',
        durationMs: 2000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map((m) => ({ role: m.role, content: m.content })),
          state: agentState, // Enviar estado existente si lo hay
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        // Manejo especial para error de búsquedas agotadas
        if (res.status === 403 && data.remaining === 0) {
          toast({
            title: '❌ Sin búsquedas disponibles',
            description: data.message || 'Has agotado tus búsquedas asignadas. Contacta al administrador.',
            tone: 'error',
            durationMs: 8000,
          });
          throw new Error('Sin búsquedas disponibles');
        }
        
        throw new Error(data.error || "Error en el chat");
      }
      
      // Intentar parsear como JSON para obtener estado
      const text = await res.text();
      let content = text;
      let newState = agentState;
      let isAgentMessage = false;
      
      try {
        const jsonData = JSON.parse(text);
        if (jsonData.content) {
          content = jsonData.content;
        }
        if (jsonData.state) {
          newState = jsonData.state;
          setAgentState(newState); // Guardar nuevo estado
          console.log('[ChatInterface] Estado actualizado:', newState);
          
          // Auto-abrir panel si hay resultados nuevos
          if (!isPanelVisible && (
            newState.sourcingResult || 
            newState.landingResult || 
            newState.contentResult || 
            newState.mediaResult
          )) {
            setIsPanelVisible(true);
          }
          
          // Marcar como mensaje de agente si viene de workflow multi-agente
          isAgentMessage = true;
        }
      } catch {
        // Si no es JSON, usar el texto plano
        content = text;
      }
      
      // Solo agregar al chat si es mensaje del orquestador (preguntas de confirmación)
      // No agregar resultados extensos de agentes
      const shouldAddToChat = !isAgentMessage || content.length < 500 || content.includes('¿') || content.toLowerCase().includes('continuar');
      
      if (shouldAddToChat) {
        const assistantMsg: Message = { 
          id: crypto.randomUUID(), 
          role: "assistant", 
          content,
          isAgentMessage 
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Solo agregar un mensaje breve indicando que hay resultados
        const summaryMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "✅ Resultados procesados. Revisa el panel lateral para ver los detalles.",
          isAgentMessage: true
        };
        setMessages((prev) => [...prev, summaryMsg]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Panel de resultados de agentes */}
      <AgentResultsPanel 
        agentState={agentState} 
        isVisible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
      />

      {/* Chat principal */}
      <div className={`flex flex-col h-screen w-full transition-all duration-300 ${isPanelVisible ? 'md:mr-96 lg:mr-[28rem]' : ''}`}>
        {/* Header with action buttons */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h3 className="font-semibold text-gray-700">
              {messages.length > 0 ? `${messages.length} mensajes` : 'Chat de investigación'}
            </h3>
            {agentState && (
              <p className="text-xs text-gray-500">
                Paso actual: {agentState.currentStep || 'iniciando'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPanelVisible(!isPanelVisible)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition ${
                isPanelVisible 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isPanelVisible ? 'Ocultar resultados' : 'Ver resultados'}
            >
              {isPanelVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              Resultados
            </button>
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleNewResearch}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  title="Comenzar nueva investigación"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                  title="Limpiar chat"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-semibold mb-2">👋 ¡Hola!</p>
              <p className="text-sm">Inicia una conversación para comenzar la investigación</p>
              <p className="text-xs mt-4 text-gray-500">
                Los resultados detallados aparecerán en el panel lateral →
              </p>
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.role === "user" 
                    ? "bg-blue-500 text-white" 
                    : m.isAgentMessage
                    ? "bg-green-100 text-gray-900 border border-green-300"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
