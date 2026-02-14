import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';

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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!(await canManageAgents(supabase, user))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('agent_definitions')
    .select('id, key, name, description, system_prompt, category, enabled, "order"')
    .order('order');

  if (error) {
    console.error('[AdminAgents GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 });
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

  return NextResponse.json({ agents });
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