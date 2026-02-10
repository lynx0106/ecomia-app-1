'use client';

import { useEffect, useState } from 'react';
import { listResearchSessions } from '@/app/actions/research-sessions';
import ResearchSessionCard from '@/components/research/ResearchSessionCard';

const STATUS_OPTIONS = ['draft', 'researching', 'proposed', 'selected', 'completed'];

export default function ResearchHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchGoal, setSearchGoal] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check admin status
        const adminRes = await fetch('/api/admin/me');
        const adminData = await adminRes.json();
        setIsAdmin(Boolean(adminData?.isAdmin));

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

  // Apply filters
  const filteredSessions = sessions.filter((session) => {
    // Filter by goal/search
    if (searchGoal && !session.goal.toLowerCase().includes(searchGoal.toLowerCase())) {
      return false;
    }

    // Filter by status
    if (filterStatus && session.status !== filterStatus) {
      return false;
    }

    // Filter by date range
    const sessionDate = new Date(session.created_at);
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      if (sessionDate < fromDate) return false;
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (sessionDate > toDate) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Mis Investigaciones</h1>
        </div>
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mis Investigaciones</h1>
        <p className="text-sm text-gray-500">
          Historial de todas tus investigaciones de mercado y análisis de productos.
          {isAdmin && ' (Admin - Ver todas)'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar por objetivo
            </label>
            <input
              type="text"
              placeholder="Ej: tienda de electrónica"
              value={searchGoal}
              onChange={(e) => setSearchGoal(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-sm gap-3">
          <span className="text-gray-600 dark:text-gray-400">
            {filteredSessions.length} de {sessions.length} investigaciones
          </span>
          {(searchGoal || filterStatus || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => {
                setSearchGoal('');
                setFilterStatus('');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 mb-4">Aún no tienes investigaciones guardadas.</p>
          <p className="text-sm text-gray-400">Ve al Chat IA para comenzar una nueva investigación.</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500">No hay investigaciones que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <ResearchSessionCard 
              key={session.id} 
              session={session} 
              readOnly={!isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
