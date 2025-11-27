import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    if (userData.user_type !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const companyId = params.id;

    if (!companyId || companyId === 'all') {
      return NextResponse.json({ students: [] });
    }

    const { data: students, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        student_id,
        email,
        course,
        year_level,
        is_active,
        companies(name)
      `)
      .eq('company_id', companyId)
      .eq('user_type', 2) // Only students
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching students by company:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({ students: students || [] });

  } catch (error) {
    console.error('Error fetching students by company:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}