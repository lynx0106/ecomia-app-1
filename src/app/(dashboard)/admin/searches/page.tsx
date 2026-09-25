import { redirect } from 'next/navigation';
import { requireOperationsAdmin } from '@/lib/auth/server';
import { AdminAllocatedSearchesPanel } from '@/components/admin/AdminAllocatedSearchesPanel';

export default async function AdminSearchesPage() {
  const admin = await requireOperationsAdmin();
  if (!admin) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cupo de investigaciones
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Suma investigaciones a un vendedor. Cada investigación guardada descuenta un uso.
        </p>
      </div>

      <AdminAllocatedSearchesPanel />
    </div>
  );
}
