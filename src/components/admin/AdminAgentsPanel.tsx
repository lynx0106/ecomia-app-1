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
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}

      {/* Agents Table */}
      {!editingAgent && !showCreateForm && (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Key</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Enabled</th>
                <th className="text-left p-3">Order</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.key} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{agent.name}</td>
                  <td className="p-3 font-mono text-xs">{agent.key}</td>
                  <td className="p-3 text-xs">{agent.category || '-'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      agent.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {agent.enabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3">{agent.order}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="p-1 hover:bg-blue-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.key)}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Form */}
      {editingAgent && (
        <div className="border rounded p-4 bg-gray-50">
          <h3 className="font-bold mb-4">
            {showCreateForm ? 'Create New Agent' : `Edit: ${editingAgent.name}`}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <input
                type="text"
                value={editingAgent.key}
                onChange={(e) => setEditingAgent({ ...editingAgent, key: e.target.value })}
                disabled={!!editingAgent.id}
                placeholder="orchestrator_v2"
                className="w-full px-3 py-2 border rounded disabled:bg-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier (lowercase, underscores)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={editingAgent.name}
                onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                placeholder="Orchestrator Agent"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editingAgent.description}
                onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                placeholder="What does this agent do?"
                rows={2}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">System Prompt</label>
              <textarea
                value={editingAgent.system_prompt}
                onChange={(e) => setEditingAgent({ ...editingAgent, system_prompt: e.target.value })}
                placeholder="You are an AI agent that..."
                rows={8}
                className="w-full px-3 py-2 border rounded font-mono text-xs"
              />
              <p className="text-xs text-gray-500 mt-1">
                {editingAgent.system_prompt.length} characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={editingAgent.category || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                  placeholder="research, landing, etc."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <input
                  type="number"
                  value={editingAgent.order}
                  onChange={(e) => setEditingAgent({ ...editingAgent, order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingAgent.enabled}
                onChange={(e) => setEditingAgent({ ...editingAgent, enabled: e.target.checked })}
                id="enabled"
              />
              <label htmlFor="enabled" className="text-sm">
                Enabled
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveAgent}
              disabled={saving}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditingAgent(null);
                setShowCreateForm(false);
              }}
              className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
