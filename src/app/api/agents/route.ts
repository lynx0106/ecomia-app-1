import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AGENT_CONFIGS, type AgentKey } from '@/lib/agents/config';
import { rateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

type AgentPromptRow = {
  agent_key: string;
  prompt: string | null;
};

type AgentDefinitionRow = {
  key: string;
  name: string;
  description: string;
  system_prompt: string;
  enabled: boolean;
};

type AgentPromptInput = {
  key?: string;
  prompt?: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('agent_prompts')
    .select('agent_key, prompt')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to load prompts' }, { status: 500 });
  }

  const overrides = (data as AgentPromptRow[] || []).reduce((acc: Record<string, string>, row) => {
    acc[row.agent_key] = row.prompt || '';
    return acc;
  }, {});

  const { data: definitions, error: defError } = await supabase
    .from('agent_definitions')
    .select('key, name, description, system_prompt, enabled')
    .eq('enabled', true)
    .order('name');

  const baseAgents = defError || !definitions || definitions.length === 0
    ? AGENT_CONFIGS.map((agent) => ({
        key: agent.key,
        name: agent.name,
        description: agent.description,
        defaultPrompt: agent.defaultPrompt,
      }))
    : (definitions as AgentDefinitionRow[]).map((agent) => ({
        key: agent.key,
        name: agent.name,
        description: agent.description,
        defaultPrompt: agent.system_prompt,
      }));

  const agents = baseAgents.map((agent) => ({
    key: agent.key,
    name: agent.name,
    description: agent.description,
    prompt: overrides[agent.key] || '',
    defaultPrompt: agent.defaultPrompt,
  }));

  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Aplicar rate limiting
  const rateLimitResult = await rateLimit(
    req as NextRequest,
    RATE_LIMITS.AGENTS,
    user.id
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.resetAt);
  }

  const body = await req.json().catch(() => ({}));
  const agents: AgentPromptInput[] = Array.isArray(body?.agents) ? body.agents : [];

  const { data: keysData, error: keysError } = await supabase
    .from('agent_definitions')
    .select('key')
    .eq('enabled', true);

  const validKeys = new Set(
    !keysError && keysData && keysData.length > 0
      ? keysData.map((row) => row.key)
      : AGENT_CONFIGS.map((a) => a.key)
  );
  const payload = agents
    .filter((agent): agent is { key: AgentKey; prompt?: string } =>
      typeof agent.key === 'string' && validKeys.has(agent.key as AgentKey)
    )
    .map((agent) => ({
      user_id: user.id,
      agent_key: agent.key,
      prompt: String(agent.prompt || ''),
    }));

  if (payload.length === 0) {
    return NextResponse.json({ error: 'No valid agents provided' }, { status: 400 });
  }

  const { error } = await supabase
    .from('agent_prompts')
    .upsert(payload, { onConflict: 'user_id,agent_key' });

  if (error) {
    return NextResponse.json({ error: 'Failed to save prompts' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
