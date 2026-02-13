import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: adminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Only admins can manage allocations' }, { status: 403 });
    }

    // Get allocated searches for user
    const { data, error } = await supabase
      .from('user_allocated_searches')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching allocated searches:', error);
      return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
    }

    return NextResponse.json({ 
      allocation: data || { 
        user_id: userId, 
        allocated_count: 0, 
        used_count: 0 
      }
    });
  } catch (error) {
    console.error('Allocated searches GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: adminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Only admins can manage allocations' }, { status: 403 });
    }

    const { allocated_count, action = 'set' } = await req.json();

    if (action === 'set') {
      // Set allocated count
      const { error } = await supabase
        .from('user_allocated_searches')
        .upsert({
          user_id: userId,
          allocated_count,
          used_count: 0,
          reset_date: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error setting allocation:', error);
        return NextResponse.json({ error: 'Error updating allocation' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `${allocated_count} búsquedas asignadas al usuario`
      });
    } else if (action === 'increment') {
      // Increment used count
      const { data: current } = await supabase
        .from('user_allocated_searches')
        .select('used_count')
        .eq('user_id', userId)
        .single();

      const newUsedCount = (current?.used_count || 0) + 1;

      const { error } = await supabase
        .from('user_allocated_searches')
        .update({ used_count: newUsedCount })
        .eq('user_id', userId);

      if (error) {
        console.error('Error incrementing used count:', error);
        return NextResponse.json({ error: 'Error updating count' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        used_count: newUsedCount
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Allocated searches POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
