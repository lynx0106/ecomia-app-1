import { listStores } from '@/app/actions/stores';
import { listLandingPages } from '@/app/actions/landing-pages';
import StoreCard from '@/components/stores/StoreCard';
import LandingCard from '@/components/landing/LandingCard';

export default async function CreationsPage() {
  const storeResult = await listStores();
  const landingResult = await listLandingPages();
  
  const stores = 'stores' in storeResult ? (storeResult.stores || []) : [];
  const landings = 'landingPages' in landingResult ? (landingResult.landingPages || []) : [];
  const storeList = stores.map((store) => ({ id: store.id, name: store.name }));

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mis Creaciones</h1>
        <p className="text-sm text-gray-500">Tiendas y landings que creaste con la IA.</p>
      </div>

      {/* Tiendas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">🏪 Tiendas ({stores.length})</h2>
        {stores.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">Aún no tienes tiendas. Usa Chat IA para crear una.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} readOnly />
            ))}
          </div>
        )}
      </div>

      {/* Landings */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">🎨 Landing Pages ({landings.length})</h2>
        {landings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">Aún no tienes landings. Usa Chat IA para crear una.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {landings.map((landing) => (
              <LandingCard key={landing.id} landing={landing} stores={storeList} readOnly />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
