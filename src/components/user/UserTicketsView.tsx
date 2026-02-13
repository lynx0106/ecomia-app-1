'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Clock, Zap, Ticket } from 'lucide-react';

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
  resolved_at?: string;
  conversation_context?: any;
}

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
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

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const categoryLabels: Record<string, string> = {
  bug: 'Error/Bug',
  feature_request: 'Solicitud de Feature',
  access_issue: 'Problema de Acceso',
  data_loss: 'Pérdida de Datos',
  performance: 'Rendimiento',
  other: 'Otro',
};

export function UserTicketsView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener solo los tickets del usuario actual
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
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

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Ticket size={28} className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Tickets de Soporte
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aquí puedes ver el estado de tus solicitudes de soporte. Los tickets se crean automáticamente cuando el agente de soporte no puede resolver tu problema.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{openTickets.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Activos</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{resolvedTickets.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Resueltos</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{tickets.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <div className="animate-spin mx-auto mb-4 text-indigo-600">⏳</div>
              <p className="text-gray-600 dark:text-gray-400">Cargando tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No tienes tickets de soporte
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Los tickets se crean automáticamente cuando el chat de soporte necesita ayuda del equipo de administración.
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-left">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💡 <strong>Cómo crear un ticket:</strong>
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 list-decimal space-y-1">
                  <li>Abre el chat de soporte (💬 burbuja en la esquina inferior derecha)</li>
                  <li>Describe tu problema o solicitud</li>
                  <li>Si el agente no puede resolverlo, se creará un ticket automáticamente</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tickets Activos */}
              {openTickets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    🔥 Tickets Activos
                  </h3>
                  <div className="space-y-2">
                    {openTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          selectedTicket?.id === ticket.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-700 shadow-md'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {ticket.issue_title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                            {statusLabels[ticket.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {ticket.issue_description.substring(0, 100)}
                          {ticket.issue_description.length > 100 ? '...' : ''}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            📅 {new Date(ticket.created_at).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                          <div className={`flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
                            {priorityIcons[ticket.priority]}
                            <span className="font-medium">{priorityLabels[ticket.priority]}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tickets Resueltos */}
              {resolvedTickets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ✅ Tickets Resueltos
                  </h3>
                  <div className="space-y-2">
                    {resolvedTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-4 rounded-lg text-left transition-all opacity-75 hover:opacity-100 ${
                          selectedTicket?.id === ticket.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-700'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {ticket.issue_title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                            {statusLabels[ticket.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {ticket.issue_description.substring(0, 100)}...
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            📅 {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                          </span>
                          {ticket.resolved_at && (
                            <span className="text-green-600 dark:text-green-400">
                              ✓ Resuelto {new Date(ticket.resolved_at).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                📝 Detalles
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Título
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">
                    {selectedTicket.issue_title}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </label>
                  <div className="mt-1">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedTicket.status]}`}>
                      {statusLabels[selectedTicket.status]}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Prioridad
                  </label>
                  <div className={`mt-1 flex items-center gap-2 ${priorityColors[selectedTicket.priority]}`}>
                    {priorityIcons[selectedTicket.priority]}
                    <span className="font-medium">{priorityLabels[selectedTicket.priority]}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Categoría
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {categoryLabels[selectedTicket.category] || selectedTicket.category}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Descripción
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.issue_description}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Fecha de Creación
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {new Date(selectedTicket.created_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {selectedTicket.resolved_at && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Fecha de Resolución
                    </label>
                    <p className="text-green-600 dark:text-green-400 mt-1">
                      {new Date(selectedTicket.resolved_at).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {/* Estado Info */}
                {selectedTicket.status === 'open' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      🔔 Tu ticket ha sido recibido y está esperando revisión por nuestro equipo.
                    </p>
                  </div>
                )}

                {selectedTicket.status === 'in_progress' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      ⚡ Un administrador está trabajando en tu solicitud.
                    </p>
                  </div>
                )}

                {selectedTicket.status === 'resolved' && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-300">
                      ✅ Tu ticket ha sido resuelto. Si tienes más preguntas, contacta al soporte nuevamente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700 sticky top-4">
              <Ticket size={48} className="mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecciona un ticket para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
