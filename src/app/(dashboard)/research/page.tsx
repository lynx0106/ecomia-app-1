'use client';

import { useEffect, useState } from 'react';
import { listResearchSessions } from '@/app/actions/research-sessions';
import PillLink from '@/components/ui/PillLink';
import ResearchFlowSteps from '@/components/ui/ResearchFlowSteps';
import ResearchSessionCard from '@/components/research/ResearchSessionCard';

export default function ResearchPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if user is authenticated
        const authRes = await fetch('/api/admin/me');
        const authenticated = authRes.ok;
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          setLoading(false);
          return;
        }

        // Load sessions
        const result = await listResearchSessions();
        const sessionList = 'sessions' in result ? (result.sessions || []) : [];
        setSessions(sessionList);
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Investigacion</h1>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
        <ResearchFlowSteps />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Investigacion</h1>
          <p className="text-sm text-gray-500">Inicia sesion para ver tus sesiones.</p>
        </div>
        <ResearchFlowSteps />
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3">No hay una sesion activa porque no estas autenticado.</p>
          <PillLink href="/login" variant="neutral" size="sm">
            Ir a iniciar sesion
          </PillLink>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Investigacion</h1>
          <p className="text-sm text-gray-500">Aun no hay sesiones creadas.</p>
        </div>
        <ResearchFlowSteps />
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Inicia una investigacion desde el chat y aparecera aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Investigacion</h1>
        <p className="text-sm text-gray-500">Sesiones y resultados del flujo guiado.</p>
      </div>

      <ResearchFlowSteps />

      <div className="grid gap-6">
        {sessions.map((session) => (
          <ResearchSessionCard 
            key={session.id} 
            session={session}
          />
        ))}
      </div>
    </div>
  );
}
