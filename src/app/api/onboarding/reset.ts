import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

/**
 * POST /api/onboarding/reset
 * Resets user's onboarding status so they can see the modal again
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reset onboarding status
    const { error } = await supabase
      .from('onboarding_status')
      .update({
        completed_tour: false,
        tour_completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to reset onboarding', error);
      return NextResponse.json(
        { error: 'Failed to reset onboarding' },
        { status: 500 }
      );
    }

    logger.info('Onboarding reset successfully', { userId: user.id });

    return NextResponse.json(
      { success: true, message: 'Onboarding reset' },
      { status: 200 }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Reset onboarding error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
