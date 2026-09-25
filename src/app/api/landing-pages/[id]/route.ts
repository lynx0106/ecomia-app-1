import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type LandingPageRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  title: string;
  slug: string | null;
  content: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
};

const writeViaEditor = () => NextResponse.json(
  { error: 'La edición y la publicación viven en el editor de la landing.' },
  { status: 405 }
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load landing page' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ landingPage: data as LandingPageRow });
}

export async function PUT() {
  return writeViaEditor();
}

export async function DELETE() {
  return writeViaEditor();
}
