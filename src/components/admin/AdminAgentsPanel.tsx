'use client';

import { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, Save, X, AlertCircle } from 'lucide-react';

interface Agent {
  id?: string;
  key: string;
  name: string;
  description: string;
  system_prompt: string;
  category?: string;
  enabled: boolean;
  order: number;
}

export function AdminAgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promptPreview, setPromptPreview] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      setAgents(data.agents || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!editingAgent) return;
    
    try {
      setSaving(true);
      const method = editingAgent.id ? 'PUT' : 'POST';
      const url = editingAgent.id 
        ? `/api/admin/agents/${editingAgent.key}`
        : '/api/admin/agents';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAgent),
      });

      if (!res.ok) throw new Error('Failed to save agent');
      
      const data = await res.json();
      
      if (editingAgent.id) {
        setAgents(agents.map(a => a.key === editingAgent.key ? data.agent : a));
      } else {
        setAgents([...agents, data.agent]);
      }

      setEditingAgent(null);
      setShowCreateForm(false);
      setMessage({ type: 'success', text: 'Agent saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to save agent' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (key: string) => {
    if (!confirm('Delete this agent? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/admin/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_key: key }),
      });

      if (!res.ok) throw new Error('Failed to delete agent');
      
      setAgents(agents.filter(a => a.key !== key));
      setMessage({ type: 'success', text: 'Agent deleted' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to delete agent' 
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading agents...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Agent Management</h2>
        <button
          onClick={() => {
            setEditingAgent({
              key: '',
              name: '',
              description: '',
              system_prompt: '',
              enabled: true,
              order: 99,
            });
            setShowCreateForm(true);
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-3 rounded flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-900/40 text-green-300' 
            : 'bg-red-900/40 text-red-300'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/40 text-red-300 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Error: {error}
        </div>
      )}
      {!editingAgent && !showCreateForm && (
        <div className="overflow-x-auto border border-gray-700 rounded">
          <table className="w-full text-sm bg-gray-900">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">Name</th>
                <th className="text-left p-3 text-gray-400 font-semibold">Key</th>
                <th className="text-left p-3 text-gray-400 font-semibold">Category</th>
                <th className="text-left p-3 text-gray-400 font-semibold">System Prompt</th>
                <th className="text-left p-3 text-gray-400 font-semibold">Enabled</th>
                <th className="text-left p-3 text-gray-400 font-semibold">Order</th>
                <th className="text-left p-3 text-gray-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.key} className="border-b border-gray-800 hover:border-b hover:border-gray-700 transition-colors cursor-pointer">
                  <td className="p-3 font-medium text-gray-200">{agent.name}</td>
                  <td className="p-3 font-mono text-xs text-gray-400">{agent.key}</td>
                  <td className="p-3 text-xs text-gray-500">{agent.category || '-'}</td>
                  <td
                    className="p-3 text-xs text-gray-400 max-w-xs truncate"
                    title={agent.system_prompt || ''}
                  >
                    {agent.system_prompt || '-'}
                    {agent.system_prompt ? (
                      <button
                        type="button"
                        onClick={() => setPromptPreview(agent)}
                        className="ml-2 text-xs text-blue-300 hover:text-blue-200"
                      >
                        Ver
                      </button>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      agent.enabled 
                        ? 'bg-green-900/50 text-green-400' 
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      {agent.enabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{agent.order}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="p-1 hover:text-blue-300 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.key)}
                      className="p-1 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {promptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPromptPreview(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-100">
                System Prompt: {promptPreview.name}
              </h4>
              <button
                type="button"
                onClick={() => setPromptPreview(null)}
                className="rounded p-1 text-gray-300 hover:text-gray-100"
                aria-label="Close prompt preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded border border-gray-800 bg-gray-950 p-3 text-xs text-gray-200 whitespace-pre-wrap font-mono">
              {promptPreview.system_prompt || 'No prompt available.'}
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingAgent && (
        <div className="border border-gray-700 rounded p-4 bg-gray-900">
          <h3 className="font-bold mb-4 text-gray-100">
            {showCreateForm ? 'Create New Agent' : `Edit: ${editingAgent.name}`}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Key</label>
              <input
                type="text"
                value={editingAgent?.key || ''}
                onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, key: e.target.value })}
                disabled={!!editingAgent?.id}
                placeholder="orchestrator_v2"
                className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 disabled:bg-gray-700 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Unique identifier (lowercase, underscores)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
              <input
                type="text"
                value={editingAgent?.name || ''}
                onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, name: e.target.value })}
                placeholder="Orchestrator Agent"
                className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
              <textarea
                value={editingAgent?.description || ''}
                onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, description: e.target.value })}
                placeholder="What does this agent do?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">System Prompt</label>
              <textarea
                value={editingAgent?.system_prompt || ''}
                onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, system_prompt: e.target.value })}
                placeholder="You are an AI agent that..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 font-mono text-xs"
              />
              <p className="text-xs text-gray-400 mt-1">
                {(editingAgent?.system_prompt || '').length} characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Category</label>
                <input
                  type="text"
                  value={editingAgent?.category || ''}
                  onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, category: e.target.value })}
                  placeholder="research, landing, etc."
                  className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Order</label>
                <input
                  type="number"
                  value={editingAgent?.order ?? 0}
                  onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingAgent?.enabled ?? true}
                onChange={(e) => editingAgent && setEditingAgent({ ...editingAgent, enabled: e.target.checked })}
                id="enabled"
              />
              <label htmlFor="enabled" className="text-sm text-gray-300">
                Enabled
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveAgent}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditingAgent(null);
                setShowCreateForm(false);
              }}
              className="flex items-center gap-2 bg-gray-700 text-gray-100 px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
