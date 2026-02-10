'use client';

import { useEffect, useState } from 'react';
import { listStores } from '@/app/actions/stores';
import StoreCreateForm from '@/components/stores/StoreCreateForm';
import StoreCard from '@/components/stores/StoreCard';

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check admin status
        const adminRes = await fetch('/api/admin/me');
        const adminData = await adminRes.json();
        setIsAdmin(Boolean(adminData?.isAdmin));

        // Load stores
        const result = await listStores();
        const storeList = 'stores' in result ? (result.stores || []) : [];
        setStores(storeList);
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Mis Tiendas</h1>
        </div>
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Mis Tiendas</h1>
          <p className="text-sm text-gray-500">Las tiendas se crean a través del Chat IA.</p>
        </div>

        {stores.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 mb-4">Aún no tienes tiendas.</p>
            <p className="text-sm text-gray-400">Usa el Chat IA para crear tu primera tienda con la guía paso a paso.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} readOnly />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mis Tiendas</h1>
        <p className="text-sm text-gray-500">Crea y administra tus tiendas. (Admin)</p>
      </div>

      <StoreCreateForm />

      <div className="space-y-4">
        {stores.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">No tienes tiendas creadas aun.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
