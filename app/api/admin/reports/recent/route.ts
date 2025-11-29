import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering for this API route due to cookie usage
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const studentId = searchParams.get('studentId');
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = supabase
      .from('weekly_reports')
      .select(`
        id,
        student_id,
        week_starting,
        week_ending,
        submitted_at,
        status,
        total_hours_worked,
        tasks_completed,
        problems_encountered,
        learnings_acquired,
        next_week_plan,
        supervisor_comments,
        supervisor_rating,
        users!weekly_reports_student_id_fkey!inner(
          full_name,
          student_id,
          company_id,
          companies(name)
        )
      `)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (studentId && studentId !== 'all') {
      query = query.eq('student_id', studentId);
    } else if (companyId && companyId !== 'all') {
      // Only apply company filter if no specific student is selected
      query = query.eq('users.company_id', parseInt(companyId));
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('submitted_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('submitted_at', dateTo);
    }

    console.log('Filter parameters:', { studentId, companyId, status, dateFrom, dateTo });
    console.log('Query built, about to execute...');

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching recent reports:', error);
      return NextResponse.json({ error: 'Failed to fetch recent reports' }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });

  } catch (error) {
    console.error('Error fetching recent reports:', error);
    return NextResponse.json({ error: 'Failed to fetch recent reports' }, { status: 500 });
  }
}