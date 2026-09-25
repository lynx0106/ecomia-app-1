'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { MessageSquare, Zap, Settings } from 'lucide-react';

type HubState = {
  allocated: number;
  used: number;
  researchCount: number;
  landing: {
    id: string;
    title: string;
    status: string;
    slug: string | null;
    hasToken: boolean;
  } | null;
};

export function DashboardHub() {
  const [state, setState] = useState<HubState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: allocation }, { data: landings }, { count }] = await Promise.all([
          supabase
            .from('user_allocated_searches')
            .select('allocated_count, used_count')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('landing_pages')
            .select('id, title, status, slug, content')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('research_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        const latest = landings?.[0];
        const content = (latest?.content || {}) as Record<string, unknown>;
        const payments = (content.payments || {}) as Record<string, unknown>;
        const mp = (payments.mercadopago || {}) as Record<string, unknown>;

        setState({
          allocated: allocation?.allocated_count || 0,
          used: allocation?.used_count || 0,
          researchCount: count || 0,
          landing: latest
            ? {
                id: latest.id,
                title: latest.title,
                status: latest.status,
                slug: latest.slug,
                hasToken: typeof mp.access_token_enc === 'string' && mp.access_token_enc.length > 0,
              }
            : null,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 h-96 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando tu panel...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">No se pudo cargar el panel.</p>
      </div>
    );
  }

  const remaining = Math.max(0, state.allocated - state.used);
  const landingLabel = !state.landing
    ? 'Sin landing'
    : state.landing.status === 'published'
      ? 'Publicada'
      : 'Borrador';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tu oferta</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Investiga un producto en Colombia, publica una landing y cobra en tu Mercado Pago.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Investigaciones</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {state.allocated > 0 ? `${state.used} usadas · ${remaining} libres` : 'El cupo del plan se crea al entrar al chat'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Landing</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{landingLabel}</p>
          {state.landing && (
            <p className="text-sm text-gray-500 truncate">{state.landing.title}</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Mercado Pago</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {state.landing?.hasToken ? 'Token guardado' : 'Sin token'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <MessageSquare size={16} />
          Investigar
        </Link>
        <Link
          href={state.landing ? `/landing/${state.landing.id}` : '/landing'}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
        >
          <Zap size={16} />
          {state.landing ? 'Editar landing' : 'Landings'}
        </Link>
        {state.researchCount > 0 && (
          <Link
            href="/research-history"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            Investigaciones
          </Link>
        )}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
        >
          <Settings size={16} />
          Cuenta
        </Link>
      </div>
    </div>
  );
}
