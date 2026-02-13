'use client';

import { useState } from 'react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { logger } from '@/lib/logging';
import { BookOpen, RotateCcw } from 'lucide-react';

export default function TutorialsPage() {
  const [isOpen, setIsOpen] = useState(true);

  const handleReset = async () => {
    try {
      const response = await fetch('/api/onboarding/reset', {
        method: 'POST',
      });

      if (response.ok) {
        logger.info('Onboarding status reset');
        setIsOpen(true);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to reset onboarding', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={32} />
            <h1 className="text-4xl font-bold">Tutoriales</h1>
          </div>
          <p className="text-lg text-indigo-100">
            Aprende a usar cada feature de EcomIA para sacar el máximo provecho de tu asistente IA.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Tutorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Tu Asistente IA
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Conoce tu asistente de e-commerce que te ayuda a tomar decisiones de negocio basadas en datos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">🏪</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Crear Tiendas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Construye y lanza tiendas online funcionales con tu IA en cuestión de minutos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Landing Pages
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Diseña landing pages profesionales para promocionar productos específicos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Investigación de Mercado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Descubre oportunidades, demanda y competencia con investigación basada en datos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Copys para Redes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Genera contenido viral y copys profesionales para Instagram, TikTok y Facebook.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Configuración
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Personaliza tu perfil y ajusta configuraciones según tus preferencias.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Necesitas ayuda?
          </h2>

          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-all"
            >
              <span>🎓</span>
              Ver Guía Nuevamente
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
            >
              <RotateCcw size={18} />
              Reiniciar Onboarding
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            💡 <strong>Pro Tip:</strong> Puedes hacer preguntas en cualquier momento usando el botón de 
            <span className="text-indigo-600 dark:text-indigo-400 font-medium"> Ayuda</span> 
            en la esquina inferior derecha.
          </p>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
