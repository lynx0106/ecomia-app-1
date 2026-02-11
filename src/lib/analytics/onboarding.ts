/**
 * Onboarding Analytics
 * 
 * Sistema para rastrear eventos de onboarding
 * Almacena eventos en tabla de Supabase para análisis posterior
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface OnboardingEvent {
  id?: string;
  user_id?: string;
  event_type:
    | 'tour_started'
    | 'tour_step_completed'
    | 'tour_completed'
    | 'tour_skipped'
    | 'first_store_created'
    | 'first_product_added'
    | 'first_question_asked';
  event_data?: Record<string, any>;
  timestamp?: string;
}

/**
 * Rastrear evento de onboarding
 * Se almacena en tabla onboarding_events de Supabase
 */
export async function trackOnboarding(
  eventType: OnboardingEvent['event_type'],
  eventData?: Record<string, any>
) {
  try {
    const supabase = createClient();

    // Obtener usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('No authenticated user for onboarding tracking');
      return;
    }

    // Registrar evento
    const event: OnboardingEvent = {
      id: uuidv4(),
      user_id: user.id,
      event_type: eventType,
      event_data: eventData || {},
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('onboarding_events')
      .insert(event);

    if (error) {
      console.error('Error tracking onboarding event:', error);
    }

    // También enviar a console en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Onboarding Event] ${eventType}:`, eventData);
    }
  } catch (err) {
    console.error('Error in trackOnboarding:', err);
  }
}

/**
 * Obtener eventos de onboarding de un usuario
 */
export async function getOnboardingEvents(userId: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('onboarding_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching onboarding events:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getOnboardingEvents:', err);
    return [];
  }
}

/**
 * Obtener resumen de onboarding para un usuario
 */
export async function getOnboardingSummary(userId: string) {
  try {
    const events = await getOnboardingEvents(userId);

    const summary = {
      totalEvents: events.length,
      tourStarted: events.some((e) => e.event_type === 'tour_started'),
      tourCompleted: events.some((e) => e.event_type === 'tour_completed'),
      tourSkipped: events.some((e) => e.event_type === 'tour_skipped'),
      storeCreated: events.some(
        (e) => e.event_type === 'first_store_created'
      ),
      productAdded: events.some(
        (e) => e.event_type === 'first_product_added'
      ),
      questionAsked: events.some(
        (e) => e.event_type === 'first_question_asked'
      ),
      firstEventTime: events.length > 0 ? events[0].timestamp : null,
      lastEventTime:
        events.length > 0 ? events[events.length - 1].timestamp : null,
    };

    return summary;
  } catch (err) {
    console.error('Error in getOnboardingSummary:', err);
    return null;
  }
}
