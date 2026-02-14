'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Loader2 } from 'lucide-react';

interface AgentResultCardProps {
  agentName: string;
  agentType: 'sourcing' | 'landing' | 'copys' | 'media' | 'orchestrator';
  status: 'pending' | 'loading' | 'completed';
  result?: any;
  timestamp?: Date;
}

export function AgentResultCard({ 
  agentName, 
  agentType, 
  status, 
  result, 
  timestamp 
}: AgentResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAgentIcon = () => {
    switch (agentType) {
      case 'orchestrator':
        return '🎯';
      case 'sourcing':
        return '🔍';
      case 'landing':
        return '🎨';
      case 'copys':
        return '✍️';
      case 'media':
        return '📸';
      default:
        return '🤖';
    }
  };

  const getAgentColor = () => {
    switch (agentType) {
      case 'orchestrator':
        return 'border-purple-500 bg-purple-50';
      case 'sourcing':
        return 'border-blue-500 bg-blue-50';
      case 'landing':
        return 'border-green-500 bg-green-50';
      case 'copys':
        return 'border-yellow-500 bg-yellow-50';
      case 'media':
        return 'border-pink-500 bg-pink-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const renderResultContent = () => {
    if (!result) return null;

    switch (agentType) {
      case 'sourcing':
        return (
          <div className="space-y-3">
            {result.productName && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Producto:</h4>
                <p className="text-sm">{result.productName}</p>
              </div>
            )}
            {result.productDescription && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Descripción:</h4>
                <p className="text-sm">{result.productDescription}</p>
              </div>
            )}
            {result.providers && result.providers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Proveedores ({result.providers.length}):</h4>
                <div className="space-y-2 mt-2">
                  {result.providers.slice(0, 3).map((prov: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded border text-sm">
                      <p className="font-medium">{prov.name}</p>
                      <p className="text-xs text-gray-600">{prov.priceProvider}</p>
                    </div>
                  ))}
                  {result.providers.length > 3 && (
                    <p className="text-xs text-gray-500">+{result.providers.length - 3} más...</p>
                  )}
                </div>
              </div>
            )}
            {result.analysis && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="p-2 bg-white rounded border text-center">
                  <p className="text-xs text-gray-600">Demanda</p>
                  <p className="font-semibold text-sm">{result.analysis.demand}</p>
                </div>
                <div className="p-2 bg-white rounded border text-center">
                  <p className="text-xs text-gray-600">Competencia</p>
                  <p className="font-semibold text-sm">{result.analysis.competition}</p>
                </div>
                <div className="p-2 bg-white rounded border text-center">
                  <p className="text-xs text-gray-600">Margen</p>
                  <p className="font-semibold text-sm">{result.analysis.margin}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'landing':
        return (
          <div className="space-y-3">
            {result.title && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Título:</h4>
                <p className="text-sm font-bold">{result.title}</p>
              </div>
            )}
            {result.subtitle && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Subtítulo:</h4>
                <p className="text-sm">{result.subtitle}</p>
              </div>
            )}
            {result.benefits && result.benefits.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Beneficios:</h4>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {result.benefits.slice(0, 5).map((benefit: string, idx: number) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.cta && (
              <div className="p-2 bg-white rounded border text-center">
                <p className="text-xs text-gray-600">Call to Action</p>
                <p className="font-semibold text-sm">{result.cta}</p>
              </div>
            )}
          </div>
        );

      case 'copys':
        return (
          <div className="space-y-3">
            {result.instagram && (
              <div className="p-2 bg-white rounded border">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">📷 Instagram</h4>
                <p className="text-xs whitespace-pre-wrap">{result.instagram.post?.substring(0, 150)}...</p>
                <p className="text-xs text-blue-600 mt-1">{result.instagram.hashtags}</p>
              </div>
            )}
            {result.tiktok && (
              <div className="p-2 bg-white rounded border">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">🎵 TikTok</h4>
                <p className="text-xs whitespace-pre-wrap">{result.tiktok.post?.substring(0, 150)}...</p>
                <p className="text-xs text-blue-600 mt-1">{result.tiktok.hashtags}</p>
              </div>
            )}
            {result.facebook && (
              <div className="p-2 bg-white rounded border">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">📘 Facebook</h4>
                <p className="text-xs whitespace-pre-wrap">{result.facebook.post?.substring(0, 150)}...</p>
                <p className="text-xs text-blue-600 mt-1">{result.facebook.hashtags}</p>
              </div>
            )}
          </div>
        );

      case 'media':
        return (
          <div className="space-y-3">
            {result.imagePrompts && result.imagePrompts.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Prompts de Imagen:</h4>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {result.imagePrompts.slice(0, 3).map((prompt: string, idx: number) => (
                    <li key={idx} className="text-xs">{prompt}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.videoGuides && result.videoGuides.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Guías de Video:</h4>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {result.videoGuides.slice(0, 3).map((guide: string, idx: number) => (
                    <li key={idx} className="text-xs">{guide}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.visualStrategy && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Estrategia Visual:</h4>
                <p className="text-sm">{result.visualStrategy}</p>
              </div>
            )}
          </div>
        );

      case 'orchestrator':
        return (
          <div className="space-y-2">
            {result.intention && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Intención detectada:</h4>
                <p className="text-sm">{result.intention}</p>
              </div>
            )}
            {result.nextStep && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Siguiente paso:</h4>
                <p className="text-sm">{result.nextStep}</p>
              </div>
            )}
          </div>
        );

      default:
        return <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>;
    }
  };

  return (
    <div className={`border-2 rounded-lg overflow-hidden ${getAgentColor()}`}>
      {/* Header - Always visible */}
      <button
        onClick={() => status === 'completed' && setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
        disabled={status !== 'completed'}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getAgentIcon()}</span>
          <div className="text-left">
            <h3 className="font-semibold text-sm">{agentName}</h3>
            {timestamp && (
              <p className="text-xs text-gray-500">
                {timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIndicator()}
          {status === 'completed' && (
            isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Content - Expandable */}
      {isExpanded && status === 'completed' && result && (
        <div className="px-4 pb-4 bg-white border-t">
          {renderResultContent()}
        </div>
      )}

      {/* Loading state */}
      {status === 'loading' && (
        <div className="px-4 pb-4 bg-white border-t">
          <p className="text-sm text-gray-600 animate-pulse">Procesando información...</p>
        </div>
      )}
    </div>
  );
}
