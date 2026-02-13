  /**
 * Agent Definitions Service
 * Handles loading, caching, and managing agent definitions from Supabase
 */

import { createClient } from '@/lib/supabase/server';

export interface AgentDefinition {
  id: string;
  name: string;
  key: string;
  description: string;
  system_prompt: string;
  category: string;
  enabled: boolean;
  order: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// In-memory cache with TTL
let agentCache: {
  agents: AgentDefinition[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all enabled agents from cache or DB
 */
export async function getAgentDefinitions(
  forceRefresh = false
): Promise<AgentDefinition[]> {
  const now = Date.now();

  // Return from cache if valid
  if (agentCache && now - agentCache.timestamp < CACHE_TTL && !forceRefresh) {
    console.log('[AgentService] Returning agents from cache');
    return agentCache.agents;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('agent_definitions')
      .select('*')
      .eq('enabled', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('[AgentService] Error fetching agents:', error);
      // Return cached agents as fallback
      if (agentCache) {
        return agentCache.agents;
      }
      throw error;
    }

    agentCache = {
      agents: data || [],
      timestamp: now,
    };

    console.log(`[AgentService] Loaded ${data?.length || 0} agents from DB`);
    return data || [];
  } catch (err) {
    console.error('[AgentService] Failed to load agents:', err);
    // Fallback to cached agents
    if (agentCache) {
      return agentCache.agents;
    }
    throw new Error('Failed to load agent definitions');
  }
}

/**
 * Get single agent by key
 */
export async function getAgentByKey(key: string): Promise<AgentDefinition | null> {
  const agents = await getAgentDefinitions();
  return agents.find((a) => a.key === key) || null;
}

/**
 * Get agent system prompt
 */
export async function getAgentSystemPrompt(key: string): Promise<string> {
  const agent = await getAgentByKey(key);
  if (!agent) {
    throw new Error(`Agent not found: ${key}`);
  }
  return agent.system_prompt;
}

/**
 * Update agent definition (admin only)
 */
export async function updateAgentDefinition(
  key: string,
  updates: Partial<AgentDefinition>
): Promise<AgentDefinition> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_definitions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Invalidate cache
  agentCache = null;

  console.log(`[AgentService] Updated agent: ${key}`);
  return data;
}

/**
 * Create new agent definition (admin only)
 */
export async function createAgentDefinition(
  agent: Omit<AgentDefinition, 'id' | 'created_at' | 'updated_at' | 'version'>
): Promise<AgentDefinition> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_definitions')
    .insert([agent])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Invalidate cache
  agentCache = null;

  console.log(`[AgentService] Created agent: ${agent.key}`);
  return data;
}

/**
 * Delete agent definition (admin only)
 */
export async function deleteAgentDefinition(key: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('agent_definitions')
    .delete()
    .eq('key', key);

  if (error) {
    throw error;
  }

  // Invalidate cache
  agentCache = null;

  console.log(`[AgentService] Deleted agent: ${key}`);
}

/**
 * Manually invalidate cache (call after DB updates outside this service)
 */
export function invalidateAgentCache(): void {
  agentCache = null;
  console.log('[AgentService] Cache invalidated');
}

/**
 * Get cache status (for debugging)
 */
export function getAgentCacheStatus(): {
  cached: boolean;
  age_ms: number | null;
  ttl_ms: number;
  agent_count: number;
} {
  const now = Date.now();
  if (!agentCache) {
    return {
      cached: false,
      age_ms: null,
      ttl_ms: CACHE_TTL,
      agent_count: 0,
    };
  }

  return {
    cached: true,
    age_ms: now - agentCache.timestamp,
    ttl_ms: CACHE_TTL,
    agent_count: agentCache.agents.length,
  };
}
