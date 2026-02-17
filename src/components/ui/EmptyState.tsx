'use client';

import { Inbox, Search, ShoppingCart, FileText } from 'lucide-react';

interface EmptyStateProps {
  type?: 'landings' | 'stores' | 'research' | 'generic';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EMPTY_STATES = {
  landings: {
    icon: FileText,
    title: 'Sin landing pages',
    description: 'Comienza creando tu primera landing page para empezar a vender',
  },
  stores: {
    icon: ShoppingCart,
    title: 'Sin tiendas',
    description: 'Crea tu primera tienda para comenzar con el e-commerce',
  },
  research: {
    icon: Search,
    title: 'Sin investigaciones',
    description: 'Inicia una nueva investigación de productos',
  },
  generic: {
    icon: Inbox,
    title: 'Sin resultados',
    description: 'No se encontraron elementos',
  },
};

export function EmptyState({
  type = 'generic',
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  const state = EMPTY_STATES[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-slate-700 dark:to-slate-600 rounded-lg">
        <Icon size={48} className="text-purple-600 dark:text-purple-300" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title || state.title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
        {description || state.description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
