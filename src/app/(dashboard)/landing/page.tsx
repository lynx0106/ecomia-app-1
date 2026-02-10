'use client';

import { useEffect, useState } from 'react';
import { listLandingPages } from '@/app/actions/landing-pages';
import { listStores } from '@/app/actions/stores';
import LandingCard from '@/components/landing/LandingCard';
import LandingCreateForm from '@/components/landing/LandingCreateForm';
import PuterLandingGenerator from '@/components/landing/PuterLandingGenerator';

export default function LandingGeneratorPage() {
  const [landings, setLandings] = useState<any[]>([]);
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

        // Load landings
        const landingResult = await listLandingPages();
        const landingList = 'landingPages' in landingResult ? (landingResult.landingPages || []) : [];
        setLandings(landingList);

        // Load stores
        const storeResult = await listStores();
        const storeList = 'stores' in storeResult ? (storeResult.stores || []) : [];
        setStores(storeList.map((s) => ({ id: s.id, name: s.name })));
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
      <div className="min-h-screen p-6 space-y-10">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <div className="text-center text-gray-500">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 space-y-10">
        <div className="max-w-3xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Landing Pages</h1>
            <p className="text-sm text-gray-500">Las landing pages se crean a través del Chat IA.</p>
          </div>

          {landings.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 mb-4">Aún no tienes landing pages.</p>
              <p className="text-sm text-gray-400">Usa el Chat IA para crear tu primera landing con la guía paso a paso.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {landings.map((landing) => (
                <LandingCard key={landing.id} landing={landing} stores={stores} readOnly />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-10">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-sm text-gray-500">Crea y administra tus landing pages. (Admin)</p>
        </div>

        <LandingCreateForm stores={stores} />

        {landings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">No tienes landing pages creadas aun.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {landings.map((landing) => (
              <LandingCard key={landing.id} landing={landing} stores={stores} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl">
        <PuterLandingGenerator />
      </div>
    </div>
  );
}
