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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, user_id, store_id, title, slug, content, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load landing pages' }, { status: 500 });
  }

  return NextResponse.json({ landingPages: (data || []) as LandingPageRow[] });
}

export async function POST() {
  return NextResponse.json(
    { error: 'La landing la crea el chat. La edición vive en las acciones del editor.' },
    { status: 405 }
  );
}
