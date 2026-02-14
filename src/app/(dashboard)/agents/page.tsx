'use client';

import { useEffect, useState } from 'react';

interface AgentInfo {
  key: string;
  name: string;
  description: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) {
          throw new Error('No se pudo cargar la configuracion de agentes');
        }
        const data = await res.json();
        // Solo extraemos la info básica
        setAgents(data.agents?.map((a: any) => ({
          key: a.key,
          name: a.name,
          description: a.description
        })) || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error inesperado';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agentes</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Vista de los agentes inteligentes disponibles en la plataforma.
        </p>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {isLoading ? (
        <div className="text-gray-700 dark:text-gray-300">Cargando agentes...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.key}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-800"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                    {agent.key}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {agent.name}
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {agent.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
