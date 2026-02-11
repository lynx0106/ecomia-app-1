/**
 * InteractiveTour Component
 * 
 * Displays an interactive tutorial for first-time users
 * Uses React Joyride for guided tour with hotspots
 * 
 * Features:
 * - Auto-detects first login
 * - 5-step guided tour (~3-4 minutes)
 * - Track progress in Supabase
 * - Beautiful UI with custom styling
 * - Can be skipped at any time
 * - Completion analytics
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

interface OnboardingStatus {
  user_id: string;
  completed_tour: boolean;
  tour_skipped: boolean;
  tour_steps_completed: number;
}

export function InteractiveTour() {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      const supabase = createClient();
      
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        // Get or create onboarding record
        const { data, error } = await supabase
          .from('onboarding_status')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Record doesn't exist, create it
          const { data: newRecord, error: createError } = await supabase
            .from('onboarding_status')
            .insert([{ user_id: user.id }])
            .select()
            .single();

          if (createError) {
            logger.error('Failed to create onboarding record', createError);
            setIsLoading(false);
            return;
          }

          setOnboardingData(newRecord);
          setRunTour(true); // First time, show tour
        } else if (error) {
          logger.error('Failed to fetch onboarding status', error);
        } else if (data && !data.completed_tour && !data.tour_skipped) {
          // Tour not completed, show it
          setOnboardingData(data);
          setRunTour(true);
        } else {
          setOnboardingData(data);
        }
      } catch (err) {
        logger.error('Error checking onboarding status', err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    checkOnboardingStatus();
  }, []);

  // Update onboarding progress
  const updateOnboardingProgress = useCallback(
    async (
      completed: boolean = false,
      skipped: boolean = false,
      stepsCompleted: number = 0
    ) => {
      if (!userId || !onboardingData) return;

      const supabase = createClient();

      try {
        const { error } = await supabase
          .from('onboarding_status')
          .update({
            completed_tour: completed,
            tour_skipped: skipped,
            tour_steps_completed: stepsCompleted,
            tour_completed_at: completed ? new Date().toISOString() : null,
            device_type: getDeviceType(),
            browser: getBrowserType(),
          })
          .eq('user_id', userId);

        if (error) {
          logger.error('Failed to update onboarding progress', error);
        } else {
          logger.info('Onboarding progress updated', {
            completed,
            skipped,
            stepsCompleted,
          });
        }
      } catch (err) {
        logger.error('Error updating onboarding progress', err as Error);
      }
    },
    [userId, onboardingData]
  );

  // Handle tour events
  const handleJoyrideCallback = useCallback(
    async (data: any) => {
      const { action, index, status, type } = data;

      // Track events
      if (type === EVENTS.STEP_AFTER || type === EVENTS.STEP_BEFORE) {
        setStepIndex(index);
        logger.debug(`Tour step ${index} - ${type}`, {});
      }

      // Handle tour completion or skip
      if (status === STATUS.FINISHED) {
        logger.info('Tour completed successfully', {
          totalSteps: steps.length,
        });
        setRunTour(false);
        await updateOnboardingProgress(true, false, steps.length);
      } else if (status === STATUS.SKIPPED) {
        logger.info('Tour skipped by user', {});
        setRunTour(false);
        await updateOnboardingProgress(false, true, stepIndex);
      }
    },
    [updateOnboardingProgress]
  );

  // Tour steps configuration
  const steps = [
    {
      target: '[data-tour="sidebar"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">👋 ¡Bienvenido a EcomIA!</h3>
          <p className="text-sm">
            Este es tu menú principal. Aquí accedes a todas las funciones de la
            plataforma.
          </p>
        </div>
      ),
      placement: 'right' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="chat"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">💬 Tu Asistente IA</h3>
          <p className="text-sm">
            Aquí hablas con tu asesor inteligente. Pregunta lo que sea sobre
            e-commerce: productos, precios, estrategia, etc.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
    {
      target: '[data-tour="stores"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">🏪 Crea tu Tienda</h3>
          <p className="text-sm">
            Aquí creas tu tienda online para vender productos. Solo necesitas un
            nombre y ya puedes empezar.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
    {
      target: '[data-tour="landing"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">📄 Landing Pages</h3>
          <p className="text-sm">
            Crea páginas especiales para promover productos específicos. Perfectas
            para campañas publicitarias.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
    {
      target: '[data-tour="research"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">🔍 Investiga Mercados</h3>
          <p className="text-sm">
            Investiga si tus ideas de negocio funcionan antes de invertir dinero.
            Obtén datos del mercado, competencia y precios.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
  ];

  const tourstyled = {
    options: {
      primaryColor: '#3b82f6',
      zIndex: 10000,
      arrowColor: '#ffffff',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: 12,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
    },
    tooltip: {
      fontSize: 14,
      padding: 16,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      color: '#1f2937',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    badge: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      fontSize: 14,
      padding: '2px 8px',
      borderRadius: 20,
    },
    button: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: 6,
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    buttonNext: {
      backgroundColor: '#3b82f6',
    },
    buttonBack: {
      marginRight: 10,
    },
    buttonSkip: {
      color: '#6b7280',
      fontSize: 13,
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  };

  if (isLoading) {
    return null; // Don't render while loading
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      showSkipButton
      continuous
      scrollToFirstStep
      scrollOffset={100}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: '¡Completado!',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
      styles={tourstyled}
      hideCloseButton={false}
    />
  );
}

// Utility functions
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (/mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    ua.toLowerCase()
  )) {
    return /ipad|android/.test(ua.toLowerCase()) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

function getBrowserType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  return 'Unknown';
}
