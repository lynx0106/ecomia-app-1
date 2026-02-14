import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';

async function canManageAgents(
  supabase: SupabaseClient,
  user: User | null
) {
  if (!user) {
    console.log('[canManageAgents] No user');
    return false;
  }
  
  const email = user?.email || '';
  console.log('[canManageAgents] Checking email:', email);
  
  if (isSuperAdmin(email)) {
    console.log('[canManageAgents] User is super admin');
    return true;
  }
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .or(`user_id.eq.${user.id},email.eq.${email}`)
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('[canManageAgents] user_roles query error:', error.message);
      // If table doesn't exist or other error, allow via email check
      return isSuperAdmin(email);
    }
    
    const isAdmin = data?.role === 'admin';
    console.log('[canManageAgents] Role check result:', isAdmin);
    return isAdmin;
  } catch (err) {
    console.warn('[canManageAgents] Exception:', err);
    return false;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[AdminAgents GET] User:', user?.email, 'ID:', user?.id);

    if (!(await canManageAgents(supabase, user))) {
      console.log('[AdminAgents GET] User not authorized');
      return NextResponse.json({ error: 'Unauthorized - User is not admin' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('agent_definitions')
      .select('id, key, name, description, system_prompt, category, enabled, "order"')
      .order('order');

    if (error) {
      console.error('[AdminAgents GET] Supabase Error:', error.message, error.details, error.code);
      return NextResponse.json(
        { error: 'Failed to load agents', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Map to expected format
    const agents = (data || []).map((agent: any) => ({
      id: agent.id,
      key: agent.key,
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      category: agent.category,
      enabled: agent.enabled,
      order: agent.order,
    }));

    console.log('[AdminAgents GET] Success, loaded', agents.length, 'agents');
    return NextResponse.json({ agents });
  } catch (err) {
    console.error('[AdminAgents GET] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageAgents(supabase, user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agent = body;

  if (!agent?.key || !agent?.name) {
    return NextResponse.json({ error: 'Missing key or name' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('agent_definitions')
    .upsert({
      key: String(agent.key),
      name: String(agent.name),
      description: String(agent.description || ''),
      system_prompt: String(agent.system_prompt || ''),
      category: agent.category || 'specialized',
      enabled: agent.enabled !== false,
      order: agent.order || 0,
    }, { onConflict: 'key' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[AdminAgents POST] Error:', error);
    return NextResponse.json({ error: 'Failed to save agent', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ agent: data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageAgents(supabase, user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agentKey = body?.agent_key || body?.key;

  if (!agentKey) {
    return NextResponse.json({ error: 'Missing agent_key or key' }, { status: 400 });
  }

  const { error } = await supabase
    .from('agent_definitions')
    .delete()
    .eq('key', String(agentKey));

  if (error) {
    console.error('[AdminAgents DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}