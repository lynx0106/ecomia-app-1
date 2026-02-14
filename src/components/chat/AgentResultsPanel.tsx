'use client';

import { AgentResultCard } from './AgentResultCard';
import type { AgentState } from '@/lib/agents/types';
import { X, ArrowRight, Trash2, CheckCircle } from 'lucide-react';

interface AgentResultsPanelProps {
  agentState: AgentState | null;
  isVisible: boolean;
  onClose: () => void;
  onContinue?: () => void;
  onDelete?: () => void;
}

export function AgentResultsPanel({ agentState, isVisible, onClose, onContinue, onDelete }: AgentResultsPanelProps) {
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

  const canContinue = agentState && agentState.nextAgent && agentState.nextAgent !== 'complete';

  return (
    <div className="fixed top-0 right-0 h-screen w-full md:w-96 lg:w-[28rem] bg-gray-50 border-l border-gray-200 shadow-2xl z-40 flex flex-col dark:bg-gray-950 dark:border-gray-800">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between z-10 dark:bg-gray-900 dark:border-gray-800">
        <div>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Flujo Multi-Agente</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {hasAnyResults ? 'Resultados de investigación' : 'Esperando resultados...'}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">\n        {!hasAnyResults && !agentState && (
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

      {/* Footer con acciones */}
      <div className="mt-auto sticky bottom-0 bg-white border-t px-4 py-4 space-y-3 dark:bg-gray-900 dark:border-gray-800">
        {/* Barra de progreso */}
        {agentState && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2 dark:text-gray-400">
              <span className="font-medium">Progreso del flujo</span>
              <span className="font-semibold">{agentState.previousSteps?.length || 0} / 4 completados</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${((agentState.previousSteps?.length || 0) / 4) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          {canContinue && onContinue && (
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Continuar con {getNextStepName(agentState?.nextAgent)}
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-lg font-semibold transition-colors border border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-400"
              title="Eliminar esta investigación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {canContinue && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Revisa los resultados y decide si quieres continuar
          </p>
        )}

        {!canContinue && agentState?.currentStep === 'complete' && (
          <div className="text-center py-2">
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">✅ Flujo completado</p>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Puedes crear tu tienda con estos resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getNextStepName(nextAgent?: string): string {
  const names: Record<string, string> = {
    'landing_builder': 'Landing Page',
    'copy_social': 'Copys Sociales',
    'media_creator': 'Estrategia de Medios',
    'complete': 'Finalizar',
  };
  return names[nextAgent || ''] || 'Siguiente Paso';
}
