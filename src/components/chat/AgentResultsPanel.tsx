'use client';

import { AgentResultCard } from './AgentResultCard';
import type { AgentState } from '@/lib/agents/types';
import { X } from 'lucide-react';

interface AgentResultsPanelProps {
  agentState: AgentState | null;
  isVisible: boolean;
  onClose: () => void;
}

export function AgentResultsPanel({ agentState, isVisible, onClose }: AgentResultsPanelProps) {
  if (!isVisible) return null;

  const getAgentStatus = (agentName: string) => {
    if (!agentState) return 'pending';
    
    const currentStep = agentState.currentStep;
    const previousSteps = agentState.previousSteps || [];
    
    // Si está en este paso actualmente
    if (currentStep === agentName) return 'loading';
    
    // Si ya lo completó
    if (previousSteps.includes(agentName)) return 'completed';
    
    // Si aún no llegó
    return 'pending';
  };

  const hasAnyResults = agentState && (
    agentState.sourcingResult || 
    agentState.landingResult || 
    agentState.contentResult || 
    agentState.mediaResult
  );

  return (
    <div className="fixed top-0 right-0 h-screen w-full md:w-96 lg:w-[28rem] bg-white border-l shadow-2xl z-40 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div>
          <h2 className="font-bold text-lg">Resultados de Agentes</h2>
          <p className="text-xs text-gray-500">
            {hasAnyResults ? 'Haz clic en cada card para ver detalles' : 'Los resultados aparecerán aquí'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Cerrar panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {!hasAnyResults && !agentState && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Aún no hay resultados</p>
            <p className="text-xs mt-2">Inicia una investigación en el chat</p>
          </div>
        )}

        {/* Orchestrator Card - Solo si hay estado */}
        {agentState && (
          <AgentResultCard
            agentName="Orquestador"
            agentType="orchestrator"
            status={getAgentStatus('orchestrate')}
            result={{
              intention: agentState.userIntention,
              nextStep: agentState.nextAgent || agentState.currentStep,
            }}
            timestamp={agentState.updatedAt ? new Date(agentState.updatedAt) : undefined}
          />
        )}

        {/* Sourcing Agent Card */}
        <AgentResultCard
          agentName="Investigación de Producto"
          agentType="sourcing"
          status={getAgentStatus('sourcing')}
          result={agentState?.sourcingResult}
          timestamp={agentState?.sourcingResult ? new Date() : undefined}
        />

        {/* Landing Builder Card */}
        <AgentResultCard
          agentName="Diseño de Landing Page"
          agentType="landing"
          status={getAgentStatus('landing')}
          result={agentState?.landingResult}
          timestamp={agentState?.landingResult ? new Date() : undefined}
        />

        {/* Copy Social Card */}
        <AgentResultCard
          agentName="Copys para Redes Sociales"
          agentType="copys"
          status={getAgentStatus('content')}
          result={agentState?.contentResult}
          timestamp={agentState?.contentResult ? new Date() : undefined}
        />

        {/* Media Creator Card */}
        <AgentResultCard
          agentName="Estrategia de Medios"
          agentType="media"
          status={getAgentStatus('media')}
          result={agentState?.mediaResult}
          timestamp={agentState?.mediaResult ? new Date() : undefined}
        />
      </div>

      {/* Footer con progreso */}
      {agentState && (
        <div className="sticky bottom-0 bg-gray-50 border-t px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>Progreso del flujo</span>
            <span>{agentState.previousSteps?.length || 0} / 4 completados</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((agentState.previousSteps?.length || 0) / 4) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
