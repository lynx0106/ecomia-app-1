import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Only admins can view allocations' }, { status: 403 });
    }

    // Get all allocations with user emails
    const { data, error } = await supabase
      .from('user_allocated_searches')
      .select(`
        *,
        user:auth.users(email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching allocations:', error);
      return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
    }

    // Format response with email and remaining count
    const allocations = data?.map((alloc: any) => ({
      user_id: alloc.user_id,
      user_email: alloc.user?.email,
      allocated_count: alloc.allocated_count,
      used_count: alloc.used_count,
      remaining: Math.max(0, alloc.allocated_count - alloc.used_count),
      reset_date: alloc.reset_date,
      created_at: alloc.created_at,
    })) || [];

    return NextResponse.json({ allocations });

  } catch (error) {
    console.error('Allocate searches list GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
