'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  LayoutDashboard,
  Ticket,
  BookOpen,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  ChevronRight,
  Users,
} from 'lucide-react';

interface UserStats {
  chatSessions: number;
  activeResearch: number;
  stores: number;
  landings: number;
  tickets: number;
  unreadTickets: number;
}

interface DashCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  stat?: number;
  description: string;
  color: string;
  bgColor: string;
  priority?: 'high' | 'normal';
}

export function DashboardHub() {
  const [stats, setStats] = useState<UserStats>({
    chatSessions: 0,
    activeResearch: 0,
    stores: 0,
    landings: 0,
    tickets: 0,
    unreadTickets: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if admin
      const adminRes = await fetch('/api/admin/me');
      const adminData = await adminRes.json();
      setIsAdmin(Boolean(adminData?.isAdmin));

      // Load user stats
      let statsData: any = {};

      // Research sessions
      const { data: research } = await supabase
        .from('research_sessions')
        .select('id, status')
        .eq('user_id', user.id);
      statsData.chatSessions = research?.length || 0;
      statsData.activeResearch = research?.filter((r: any) => r.status === 'active').length || 0;

      // Stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id);
      statsData.stores = stores?.length || 0;

      // Landing pages
      const { data: landings } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('user_id', user.id);
      statsData.landings = landings?.length || 0;

      // Support tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, status')
        .eq('user_id', user.id);
      statsData.tickets = tickets?.length || 0;
      statsData.unreadTickets = tickets?.filter((t: any) => t.status === 'open').length || 0;

      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userCards: DashCard[] = [
    {
      id: 'chat',
      title: 'Chat IA',
      icon: <MessageSquare size={32} />,
      href: '/chat',
      description: 'Investiga productos y crea contenido',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      priority: 'high',
    },
    {
      id: 'research',
      title: 'Mis Investigaciones',
      icon: <TrendingUp size={32} />,
      href: '/research-history',
      stat: stats.activeResearch,
      description: `${stats.activeResearch} investigaciones activas`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      id: 'stores',
      title: 'Mis Tiendas',
      icon: <LayoutDashboard size={32} />,
      href: '/stores',
      stat: stats.stores,
      description: `${stats.stores} tiendas creadas`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      id: 'landing',
      title: 'Landing Pages',
      icon: <Zap size={32} />,
      href: '/landing',
      stat: stats.landings,
      description: `${stats.landings} páginas de venta`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      id: 'tickets',
      title: 'Mis Tickets',
      icon: <Ticket size={32} />,
      href: '/tickets',
      stat: stats.unreadTickets,
      description: `${stats.unreadTickets} abiertos`,
      color: stats.unreadTickets > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: stats.unreadTickets > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
    },
    {
      id: 'tutorials',
      title: 'Tutoriales',
      icon: <BookOpen size={32} />,
      href: '/tutorials',
      description: 'Aprende a usar todas las features',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const adminCards: DashCard[] = [
    {
      id: 'admin-dashboard',
      title: 'Panel Admin',
      icon: <LayoutDashboard size={32} />,
      href: '/admin/agents',
      description: 'Gestiona usuarios y configuración',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      priority: 'high',
    },
    {
      id: 'admin-tickets',
      title: 'Soporte',
      icon: <Ticket size={32} />,
      href: '/admin/tickets',
      description: 'Gestiona tickets de usuarios',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      id: 'admin-roles',
      title: 'Roles & Permisos',
      icon: <Users size={32} />,
      href: '/admin/roles',
      description: 'Asigna roles a usuarios',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
  ];

  const cardsToShow = isAdmin ? adminCards : userCards;

  if (isLoading) {
    return (
      <div className="p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 text-4xl">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          👋 Bienvenido a EcomIA
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isAdmin 
            ? 'Panel administrativo - Gestiona la plataforma'
            : 'Tu panel de control. Aquí está todo lo que necesitas'}
        </p>
      </div>

      {/* Alert for high priority items */}
      {stats.unreadTickets > 0 && !isAdmin && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">
              {stats.unreadTickets} ticket{stats.unreadTickets > 1 ? 's' : ''} pendiente{stats.unreadTickets > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-red-800 dark:text-red-300">
              Revisa el estado de tus solicitudes de soporte
            </p>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardsToShow.map((card) => (
          <Link key={card.id} href={card.href}>
            <div
              className={`${card.bgColor} p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col justify-between`}
            >
              {/* Top section */}
              <div>
                <div className={`${card.color} mb-3 flex justify-between items-start`}>
                  {card.icon}
                  {card.stat !== undefined && (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.stat}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:translate-x-1 transition-transform">
                  {card.title}
                </h3>
              </div>

              {/* Bottom section */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {card.description}
                </p>
                <div className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Ir →
                  <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Abre el chat de soporte (💬 burbuja en la esquina) para resolver tus dudas rápidamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
