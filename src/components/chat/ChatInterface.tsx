'use client';

import { useState } from "react";
import { useToast } from '@/components/ui/ToastProvider';
import { Trash2, RotateCcw } from 'lucide-react';

type Message = { id: string; role: "user" | "assistant"; content: string };

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClearChat = () => {
    if (messages.length === 0) return;
    
    if (confirm('¿Limpiar todas las investigaciones? No se guardarán en el histórico.')) {
      setMessages([]);
      setInput("");
      setError(null);
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
      const text = await res.text();
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: text };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header with action buttons */}
      {messages.length > 0 && (
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">
            {messages.length} mensajes en el chat
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleNewResearch}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              title="Comenzar nueva investigación (no se guardan los datos)"
            >
              <RotateCcw className="w-4 h-4" />
              Nueva Investigación
            </button>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              title="Limpiar chat actual"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
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
        {error && <div className="text-sm text-red-600">Error: {error}</div>}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-full px-4 py-2 border"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-full"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
