'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is new and hasn't seen onboarding
  useEffect(() => {
    async function checkNewUser() {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check onboarding_status
        const { data, error } = await supabase
          .from('onboarding_status')
          .select('completed_tour, tour_skipped')
          .eq('user_id', user.id)
          .maybeSingle();

        // If record doesn't exist, user is new
        if (error && error.code === 'PGRST116') {
          logger.info('New user detected - showing onboarding modal');
          setIsVisible(true);
          setHasShown(false);

          // Create onboarding record
          const { error: createError } = await supabase
            .from('onboarding_status')
            .insert([{ user_id: user.id }])
            .select()
            .single();

          if (createError) {
            logger.error('Failed to create onboarding record', createError);
          }
        } else if (data && !data.completed_tour && !data.tour_skipped) {
          // Tour not completed, show modal
          logger.info('Incomplete tour - showing onboarding modal');
          setIsVisible(true);
        } else {
          // Tour already completed or skipped
          setIsVisible(false);
        }

        setHasShown(true);
      } catch (err) {
        logger.error('Error checking onboarding status', err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    // Only check on mount if not explicitly controlled
    if (isOpen === undefined) {
      checkNewUser();
    } else {
      setIsVisible(isOpen);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleClose = async () => {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Mark as completed
        await supabase
          .from('onboarding_status')
          .update({
            completed_tour: true,
            tour_completed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        logger.info('Onboarding marked as completed');
      }
    } catch (err) {
      logger.error('Error marking onboarding complete', err as Error);
    }

    setIsVisible(false);
    onClose?.();
  };

  if (isLoading) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 p-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">👋 ¡Bienvenido a EcomIA!</h1>
            <p className="text-indigo-100 mt-1">Tu asesor de e-commerce impulsado por IA</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-12">
            Aquí puedes ver todo lo que EcomIA te ofrece para crear y gestionar tu negocio online.
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Chat IA */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tu Asistente IA</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Pregunta lo que sea sobre e-commerce: productos, precios, estrategia, copys para redes sociales.
              </p>
            </div>

            {/* Tiendas */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Crea tu Tienda</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Construye tu tienda online para vender productos. Solo necesitas un nombre y ya puedes empezar.
              </p>
            </div>

            {/* Landing Pages */}
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Landing Pages</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Crea páginas especiales para promocionar productos específicos. Perfectas para campañas publicitarias.
              </p>
            </div>

            {/* Investigación */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Investigación de Mercado</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Investiga si tus ideas funcionan. Obtén datos de demanda, competencia y proveedores.
              </p>
            </div>

            {/* Copys Sociales */}
            <div className="group bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-6 rounded-xl border border-pink-200 dark:border-pink-800 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">✍️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Copys para Redes</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Genera contenido persuasivo para Instagram, TikTok y Facebook. Con hashtags y CTAs optimizados.
              </p>
            </div>

            {/* Configuración */}
            <div className="group bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuración</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Gestiona tu perfil, preferencias y configuración general de tu cuenta.
              </p>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 ¿Necesitas Ayuda?</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Pregunta cualquier cosa en el <strong>chat</strong> (💬). Nuestro asistente IA te guiará en cada paso.
            </p>
          </div>

          {/* Footer Button */}
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              ✨ Entendido, Comencemos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
