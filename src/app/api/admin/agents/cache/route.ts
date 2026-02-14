import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';
import { invalidateAgentCache, getAgentCacheStatus } from '@/lib/agents/agent-definitions';

/**
 * GET /api/admin/agents/cache
 * Get current cache status
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = getAgentCacheStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Cache status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/agents/cache
 * Invalidate agent cache manually
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    invalidateAgentCache();
    console.log('[API] Cache invalidated by admin:', user.email);

    return NextResponse.json({ 
      success: true,
      message: 'Agent cache invalidated successfully'
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
