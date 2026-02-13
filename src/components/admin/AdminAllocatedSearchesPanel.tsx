'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface UserSearchAllocation {
  user_id: string;
  user_email?: string;
  allocated_count: number;
  used_count: number;
  remaining: number;
}

export function AdminAllocatedSearchesPanel() {
  const [allocations, setAllocations] = useState<UserSearchAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [allocateAmount, setAllocateAmount] = useState<string>('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/allocate-searches');
      if (res.ok) {
        const data = await res.json();
        setAllocations(data.allocations || []);
      }
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar las asignaciones', tone: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedUserId || !allocateAmount) {
      toast({ title: 'Error', description: 'Completa todos los campos', tone: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/allocate-searches/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocated_count: parseInt(allocateAmount),
          action: 'set',
        }),
      });

      if (res.ok) {
        toast({ title: 'Éxito', description: `${allocateAmount} búsquedas asignadas`, tone: 'success' });
        loadAllocations();
        setSelectedUserId('');
        setAllocateAmount('10');
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error || 'Error al asignar', tone: 'error' });
      }
    } catch (error) {
      console.error('Error allocating searches:', error);
      toast({ title: 'Error', description: 'Error en el servidor', tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 Búsquedas Asignadas
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Asigna búsquedas a usuarios sin API Key propia
        </p>
      </div>

      {/* Allocation Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Asignar Búsquedas a Usuario
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID de Usuario
            </label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Ingresa el UUID del usuario"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Búsquedas
            </label>
            <input
              type="number"
              value={allocateAmount}
              onChange={(e) => setAllocateAmount(e.target.value)}
              min="1"
              max="1000"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleAllocate}
            disabled={isSubmitting || !selectedUserId || !allocateAmount}
            className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Asignando...' : 'Asignar Búsquedas'}
          </button>
        </div>
      </div>

      {/* Allocations List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Asignaciones Activas
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        ) : allocations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Sin asignaciones aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Usuario</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Asignadas</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Usadas</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Disponibles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allocations.map((allocation) => (
                  <tr key={allocation.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      <div>
                        <p className="font-medium">{allocation.user_email || allocation.user_id}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{allocation.user_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                        {allocation.allocated_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {allocation.used_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-bold px-3 py-1 rounded-full ${
                        allocation.remaining > 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300'
                      }`}>
                        {allocation.remaining}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Cómo funciona</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Asigna búsquedas a usuarios que no tengan su API Key de IA</li>
          <li>Los usuarios ven sus búsquedas disponibles en el chat</li>
          <li>Al investigar, se decrementa el contador automáticamente</li>
          <li>Cuando se agotan, solo pueden usar si agregan su API Key</li>
        </ul>
      </div>
    </div>
  );
}
