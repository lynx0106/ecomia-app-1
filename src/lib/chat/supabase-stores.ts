import type { SupabaseClient } from '@supabase/supabase-js';
import type { AllocationRow, ProductWriter, QuotaStore } from '@/lib/chat/research-quota';

type Row = Record<string, unknown>;

export function quotaStoreFromSupabase(supabase: SupabaseClient): QuotaStore {
  return {
    async getAllocation(userId) {
      const { data, error } = await supabase
        .from('user_allocated_searches')
        .select('allocated_count, used_count')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message || 'No se pudo leer el cupo');
      if (!data) return null;
      const row = data as Row;
      return {
        allocated_count: Number(row.allocated_count) || 0,
        used_count: Number(row.used_count) || 0,
      } satisfies AllocationRow;
    },
    async insertAllocation(userId, allocatedCount) {
      const { error } = await supabase.from('user_allocated_searches').insert({
        user_id: userId,
        allocated_count: allocatedCount,
        used_count: 0,
      });
      if (error) throw new Error(error.message || 'No se pudo crear el cupo del plan');
    },
    async consume(userId) {
      const { data, error } = await supabase
        .from('user_allocated_searches')
        .select('allocated_count, used_count')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return { ok: false as const };
      const row = data as Row;
      const allocated = Number(row.allocated_count) || 0;
      const used = Number(row.used_count) || 0;
      if (used >= allocated) return { ok: false as const };
      const next = used + 1;
      const { data: updated, error: updateError } = await supabase
        .from('user_allocated_searches')
        .update({ used_count: next })
        .eq('user_id', userId)
        .eq('used_count', used)
        .select('used_count');
      if (updateError || !updated || updated.length === 0) return { ok: false as const };
      return { ok: true as const, used: next, allocated };
    },
    async refund(userId) {
      const { data } = await supabase
        .from('user_allocated_searches')
        .select('used_count')
        .eq('user_id', userId)
        .maybeSingle();
      const used = Number((data as Row | null)?.used_count) || 0;
      if (used <= 0) return;
      await supabase
        .from('user_allocated_searches')
        .update({ used_count: used - 1 })
        .eq('user_id', userId)
        .eq('used_count', used);
    },
  };
}

export function productWriterFromSupabase(supabase: SupabaseClient): ProductWriter {
  return {
    async insertResearchSession(row) {
      const { data, error } = await supabase
        .from('research_sessions')
        .insert(row)
        .select('id')
        .single();
      if (error || !data?.id) throw new Error(error?.message || 'No se pudo guardar la investigación');
      return { id: String(data.id) };
    },
    async insertLanding(row) {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert(row)
        .select('id, slug')
        .single();
      if (error || !data?.id) throw new Error(error?.message || 'No se pudo guardar la landing');
      return { id: String(data.id), slug: String(data.slug) };
    },
  };
}
