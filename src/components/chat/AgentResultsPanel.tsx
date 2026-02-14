'use client';

import { useEffect, useState } from 'react';
import type { AgentState } from '@/lib/agents/types';
import { ChevronDown, ChevronUp, Trash2, CheckCircle, Loader2 } from 'lucide-react';

interface AgentResultsPanelProps {
  agentState: AgentState | null;
  isVisible: boolean;
  onClose: () => void;
  onContinue?: () => void;
  onDelete?: () => void;
}

export function AgentResultsPanel({ agentState, isVisible, onClose, onContinue, onDelete }: AgentResultsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!isVisible) return null;

  // Auto-continue después de 4 segundos si hay siguiente agente
  useEffect(() => {
    if (agentState?.nextAgent && agentState.nextAgent !== 'complete' && onContinue) {
      const timer = setTimeout(() => {
        onContinue();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [agentState?.nextAgent, onContinue]);

  const getAgentStatus = (agentName: string) => {
    if (!agentState) return 'pending';
    const currentStep = agentState.currentStep;
    const previousSteps = agentState.previousSteps || [];
    if (currentStep === agentName) return 'loading';
    if (previousSteps.includes(agentName)) return 'completed';
    return 'pending';
  };

  const hasAnyResults = agentState && (
    agentState.sourcingResult || 
    agentState.landingResult || 
    agentState.contentResult || 
    agentState.mediaResult
  );

  const canContinue = agentState && agentState.nextAgent && agentState.nextAgent !== 'complete';
  const isProcessing = agentState && agentState.currentStep && agentState.currentStep !== 'orchestrate';

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Encabezado colapsable */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
          ) : hasAnyResults ? (
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-600 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {isProcessing ? `Procesando: ${agentState?.currentStep}...` : 'Resultados de investigación'}
            </h3>
            {agentState && (
              <p className="text-xs text-gray-400 truncate">
                {(agentState.previousSteps?.length || 0)}/4 agentes completados
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <>
          <div className="border-t border-gray-700 px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
            {agentState && [
              { name: '🎯 Análisis', type: 'orchestrator' },
              { name: '🔍 Investigación', type: 'sourcing', result: agentState.sourcingResult },
              { name: '📄 Landing', type: 'landing', result: agentState.landingResult },
              { name: '💬 Copys', type: 'copys', result: agentState.contentResult },
              { name: '🎨 Medios', type: 'media', result: agentState.mediaResult },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-gray-800 px-2 py-1.5 rounded">
                <span className="text-gray-300">{item.name}</span>
                <div className="flex items-center gap-1">
                  {getAgentStatus(item.type) === 'completed' && (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  )}
                  {getAgentStatus(item.type) === 'loading' && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  )}
                  {getAgentStatus(item.type) === 'pending' && (
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-700" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="border-t border-gray-700 px-4 py-3 flex gap-2">
            {canContinue && onContinue && (
              <button
                onClick={onContinue}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                Continuar
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center justify-center text-red-400 hover:text-red-300 p-2"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
