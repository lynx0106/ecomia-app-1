/**
 * PUT /api/admin/agents/[key]
 * Update specific agent definition and invalidate cache
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';
import { invalidateAgentCache } from '@/lib/agents/agent-definitions';

async function canManageAgents(
  supabase: SupabaseClient,
  user: User | null
) {
  if (!user) return false;
  if (isSuperAdmin(user?.email)) return true;
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();
  return data?.role === 'admin';
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!(await canManageAgents(supabase, user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Missing agent key' }, { status: 400 });
    }

    // Update agent
    const { data, error } = await supabase
      .from('agent_definitions')
      .update({
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.system_prompt !== undefined && { system_prompt: body.system_prompt }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.order !== undefined && { order: body.order }),
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/admin/agents/[key]] DB Error:', error);
      return NextResponse.json(
        { error: 'Failed to update agent', details: error.message },
        { status: 500 }
      );
    }

    // Invalidate cache so changes apply immediately
    invalidateAgentCache();

    console.log(`[PUT /api/admin/agents/[key]] Updated agent: ${key}`);

    return NextResponse.json({
      ok: true,
      agent: data,
      message: 'Agent updated successfully. Changes applied immediately.',
    });
  } catch (err) {
    console.error('[PUT /api/admin/agents/[key]] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!(await canManageAgents(supabase, user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!key) {
      return NextResponse.json({ error: 'Missing agent key' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('agent_definitions')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent: data });
  } catch (err) {
    console.error('[GET /api/admin/agents/[key]] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
