'use client';

import { AdminAllocatedSearchesPanel } from '@/components/admin/AdminAllocatedSearchesPanel';

export default function AdminSearchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Búsquedas Asignadas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Asigna búsquedas gratuitas a usuarios que no tienen su propia API key
        </p>
      </div>

      <AdminAllocatedSearchesPanel />
    </div>
  );
}
