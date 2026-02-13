'use client';

import { AdminAgentsPanel } from '@/components/admin/AdminAgentsPanel';

export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Agentes IA</h1>
        <p className="text-gray-600 mt-2">
          Administra los prompts de los agentes IA en tiempo real. Los cambios se aplican inmediatamente sin redeploying.
        </p>
      </div>

      <AdminAgentsPanel />
    </div>
  );
}