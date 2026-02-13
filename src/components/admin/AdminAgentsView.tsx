'use client';

import { useState, useEffect } from 'react';
import { Edit2, Plus, Copy, Trash2, Check, X } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  key: string;
  description: string;
  system_prompt: string;
  category: string;
  enabled: boolean;
  order: number;
  version: number;
  updated_at: string;
  updated_by: string;
}

export default function AdminAgentsView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Agent>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/agents');
      if (!response.ok) throw new Error('Error loading agents');
      const data = await response.json();
      setAgents(data.agents || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading agents');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (agent: Agent) => {
    setEditingKey(agent.key);
    setEditForm(agent);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({});
  };

  const saveAgent = async () => {
    if (!editingKey) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/agents/${editingKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          system_prompt: editForm.system_prompt,
          category: editForm.category,
          enabled: editForm.enabled,
          order: editForm.order,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error saving agent');
      }

      setAgents(
        agents.map((a) => (a.key === editingKey ? { ...a, ...editForm } : a))
      );
      setEditingKey(null);
      setEditForm({});
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving agent');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (agent: Agent) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/agents/${agent.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !agent.enabled }),
      });

      if (!response.ok) throw new Error('Error updating agent');

      setAgents(
        agents.map((a) =>
          a.key === agent.key ? { ...a, enabled: !a.enabled } : a
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating agent');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando agentes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Agentes</h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Nuevo Agente
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.key}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
          >
            {editingKey === agent.key ? (
              // Modo edición
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={editForm.category || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={2}
                    className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    System Prompt
                  </label>
                  <textarea
                    value={editForm.system_prompt || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        system_prompt: e.target.value,
                      })
                    }
                    rows={6}
                    className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.enabled || false}
                      onChange={(e) =>
                        setEditForm({ ...editForm, enabled: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Habilitado
                    </span>
                  </label>

                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 rounded px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={saveAgent}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Modo vista
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Key: <code className="text-xs">{agent.key}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        agent.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {agent.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {agent.description}
                </p>

                <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Prompt (primeras 200 caracteres):
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">
                    {agent.system_prompt.substring(0, 200)}...
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => startEdit(agent)}
                    className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => toggleEnabled(agent)}
                    className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    {agent.enabled ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600">
          No hay agentes disponibles
        </div>
      )}
    </div>
  );
}
