/**
 * useFirstLogin Hook
 * 
 * Detects if this is the user's first login
 * Returns true if user just signed up or hasn't completed onboarding
 * 
 * Usage:
 * const isFirstLogin = useFirstLogin();
 * if (isFirstLogin) {
 *   // Show tour, welcome message, etc
 * }
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { useAuth } from './useAuth';

export function useFirstLogin(): boolean {
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkIfFirstLogin() {
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

        // Check onboarding_status table
        const { data, error } = await supabase
          .from('onboarding_status')
          .select('completed_tour, tour_skipped_at')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Record doesn't exist = first login
          logger.debug('First login detected (no onboarding record)');
          setIsFirstLogin(true);

          // Create onboarding record
          await supabase
            .from('onboarding_status')
            .insert([{ user_id: user.id }])
            .select();
        } else if (error) {
          logger.error('Error checking first login status', error);
          setIsFirstLogin(false);
        } else if (data) {
          // Check if completed tour
          const completed = data.completed_tour || Boolean(data.tour_skipped_at);
          setIsFirstLogin(!completed);
          logger.debug(`First login: ${!completed}`, {
            completed_tour: data.completed_tour,
            tour_skipped_at: data.tour_skipped_at,
          });
        }
      } catch (err) {
        logger.error('Error in useFirstLogin hook', err as Error);
        setIsFirstLogin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkIfFirstLogin();
  }, []);

  return isFirstLogin;
}

/**
 * useOnboardingStatus Hook
 * 
 * Get detailed onboarding status for current user
 * Returns full onboarding record
 * 
 * Usage:
 * const { completed, skipped, stepsCompleted, loading } = useOnboardingStatus();
 */

export interface OnboardingData {
  user_id: string;
  completed_tour: boolean;
  tour_skipped_at: string | null;
  tour_started_at: string | null;
  tour_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useOnboardingStatus() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchStatus() {
      if (!user) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        const { data: status, error: err } = await supabase
          .from('onboarding_status')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (err) {
          setError(err as any);
          logger.error('Error fetching onboarding status', err as any);
        } else {
          setData(status as OnboardingData);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        logger.error('Error in useOnboardingStatus', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [user]);

  return { data, loading, error };
}
