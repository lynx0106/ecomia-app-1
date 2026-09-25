'use client';

import { useEffect, useState } from 'react';
import { listLandingPages } from '@/app/actions/landing-pages';
import LandingCard from '@/components/landing/LandingCard';
import Link from 'next/link';

type LandingListItem = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  store_id: string | null;
  created_at: string;
};

export default function LandingGeneratorPage() {
  const [landings, setLandings] = useState<LandingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const landingResult = await listLandingPages();
        const landingList = 'landingPages' in landingResult ? (landingResult.landingPages || []) : [];
        setLandings(landingList);
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
          <h1 className="text-3xl font-bold">Landings</h1>
          <div className="text-center text-gray-500">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-10">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Landings</h1>
          <p className="text-sm text-gray-500">
            El chat crea la landing en borrador. Aquí editas el precio en COP, pegas tu token de Mercado Pago y publicas.
          </p>
        </div>

        {landings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
            <p className="text-gray-500">Aún no tienes landings.</p>
            <Link href="/chat" className="text-sm font-semibold text-indigo-600">
              Investigar un producto en el chat
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {landings.map((landing) => (
              <LandingCard key={landing.id} landing={landing} stores={[]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
