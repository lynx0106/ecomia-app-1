'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface SupportTicket {
  id: string;
  user_id: string;
  issue_title: string;
  issue_description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<TicketPriority, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

const priorityIcons: Record<TicketPriority, React.ReactNode> = {
  low: <Clock size={16} />,
  medium: <AlertCircle size={16} />,
  high: <Zap size={16} />,
  urgent: <AlertCircle size={16} className="text-red-600" />,
};

export function AdminTicketsView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Verificar si el usuario es admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener todos los tickets
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tickets:', error);
        return;
      }

      setTickets(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📋 Tickets de Soporte
        </h2>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'Todos' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'open').length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Abiertos</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'in_progress').length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">En Progreso</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Resueltos</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{tickets.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center py-8">Cargando tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-600" />
              <p className="text-gray-600 dark:text-gray-400">No hay tickets en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {ticket.issue_title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {ticket.issue_description.substring(0, 80)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <div className={`flex items-center gap-1 ${priorityColors[ticket.priority as TicketPriority]}`}>
                      {priorityIcons[ticket.priority as TicketPriority]}
                      <span className="text-xs capitalize">{ticket.priority}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        {selectedTicket && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-fit sticky top-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Detalles del Ticket
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">TÍTULO</label>
                <p className="text-gray-900 dark:text-white">{selectedTicket.issue_title}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">ESTADO</label>
                <div className="flex gap-1 flex-wrap">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => updateTicketStatus(selectedTicket.id, status)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedTicket.status === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-400'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">PRIORIDAD</label>
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${priorityColors[selectedTicket.priority as TicketPriority]}`}>
                  {selectedTicket.priority}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">CATEGORÍA</label>
                <p className="text-gray-900 dark:text-white capitalize">{selectedTicket.category}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">DESCRIPCIÓN</label>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedTicket.issue_description}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">FECHA</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
