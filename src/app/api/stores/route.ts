import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

type StoreRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const STORE_STATUSES = new Set(['draft', 'active', 'archived']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value?: string | null) {
  const slug = value?.trim().toLowerCase() || '';
  if (!slug) return null;
  return SLUG_PATTERN.test(slug) ? slug : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('stores')
    .select('id, user_id, name, slug, status, meta, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 500 });
  }

  return NextResponse.json({ stores: (data || []) as StoreRow[] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as unknown));
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};

  const StoreSchema = z.object({
    name: z.string().min(1, 'Missing name'),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().nullable().or(z.literal('')).optional(),
    status: z.string().optional().transform((s) => (typeof s === 'string' ? s.trim().toLowerCase() : 'draft')),
    meta: z.record(z.string(), z.unknown()).optional(),
  });

  const parsed = StoreSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { name } = parsed.data;
  const slug = normalizeSlug(typeof parsed.data.slug === 'string' ? parsed.data.slug : null);
  if (parsed.data.slug && !slug) {
    return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
  }

  const status = typeof parsed.data.status === 'string' ? parsed.data.status : 'draft';
  if (!STORE_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const meta = parsed.data.meta ? asRecord(parsed.data.meta) : null;
  if (parsed.data.meta && !meta) {
    return NextResponse.json({ error: 'Invalid meta' }, { status: 400 });
  }

  if (slug) {
    const { data: existing, error: slugError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (slugError) {
      return NextResponse.json({ error: 'Failed to validate slug' }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('stores')
    .insert({
      user_id: user.id,
      name,
      slug,
      status,
      meta: meta || {},
    })
    .select('id, user_id, name, slug, status, meta, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }

  return NextResponse.json({ store: data as StoreRow }, { status: 201 });
}
