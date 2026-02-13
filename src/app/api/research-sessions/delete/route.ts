import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Research ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: research } = await supabase
      .from('research_sessions')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!research || research.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    // Delete all related data
    // 1. Delete research sources
    await supabase
      .from('research_sources')
      .delete()
      .eq('research_session_id', id);

    // 2. Delete product candidates
    await supabase
      .from('product_candidates')
      .delete()
      .eq('research_session_id', id);

    // 3. Delete product suppliers
    await supabase
      .from('product_suppliers')
      .delete()
      .eq('research_session_id', id);

    // 4. Delete product assets
    await supabase
      .from('product_assets')
      .delete()
      .eq('research_session_id', id);

    // 5. Delete the research session itself
    const { error } = await supabase
      .from('research_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete research error:', error);
      return NextResponse.json({ error: 'Failed to delete research' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Investigación eliminada completamente'
    });

  } catch (error) {
    console.error('Delete research endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
