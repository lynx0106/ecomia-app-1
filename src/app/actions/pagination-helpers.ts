'use server';

import { createClient } from '@/lib/supabase/server';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Obtener landings paginadas del usuario actual
 */
export async function getUserLandingsPaginated(
  params: PaginationParams = {}
): Promise<PaginationResult<any>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user');
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (page - 1) * limit;

  // Contar total
  const { count } = await supabase
    .from('landing_pages')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  // Obtener página
  let query = supabase
    .from('landing_pages')
    .select('*')
    .eq('user_id', user.id)
    .range(offset, offset + limit - 1);

  // Ordenar
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  const total = count || 0;
  const pages = Math.ceil(total / limit);

  return {
    data: data || [],
    pagination: { page, limit, total, pages },
  };
}

/**
 * Obtener stores paginadas del usuario actual
 */
export async function getUserStoresPaginated(
  params: PaginationParams = {}
): Promise<PaginationResult<any>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user');
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (page - 1) * limit;

  // Contar total
  const { count } = await supabase
    .from('stores')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  // Obtener página
  let query = supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .range(offset, offset + limit - 1);

  // Ordenar
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  const total = count || 0;
  const pages = Math.ceil(total / limit);

  return {
    data: data || [],
    pagination: { page, limit, total, pages },
  };
}

/**
 * Obtener research sessions paginadas del usuario actual
 */
export async function getUserResearchSessionsPaginated(
  params: PaginationParams = {}
): Promise<PaginationResult<any>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user');
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (page - 1) * limit;

  // Contar total
  const { count } = await supabase
    .from('research_sessions')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  // Obtener página
  let query = supabase
    .from('research_sessions')
    .select('*')
    .eq('user_id', user.id)
    .range(offset, offset + limit - 1);

  // Ordenar
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  const total = count || 0;
  const pages = Math.ceil(total / limit);

  return {
    data: data || [],
    pagination: { page, limit, total, pages },
  };
}

/**
 * Hook para usar en componentes - wrapper de next/navigation
 */
export function usePaginationParams() {
  // Este hook se usa del lado del cliente
  // Los parámetros vienen de URL: ?page=1&limit=10
  if (typeof window === 'undefined') {
    return { page: 1, limit: DEFAULT_LIMIT };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    page: parseInt(params.get('page') || '1'),
    limit: parseInt(params.get('limit') || String(DEFAULT_LIMIT)),
  };
}
