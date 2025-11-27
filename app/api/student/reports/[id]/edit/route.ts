import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const reportId = params.id;
    
    const body = await request.json();
    const { tasks_completed, problems_encountered, learnings_acquired, total_hours_worked } = body;

    // Get the current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, get the report to check ownership and status
    const { data: report, error: fetchError } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if the user owns this report
    if (report.student_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own reports' },
        { status: 403 }
      );
    }

    // Check if report is already reviewed (can't edit reviewed reports)
    if (report.status === 'approved' || report.status === 'rejected') {
      return NextResponse.json(
        { error: 'Cannot edit reports that have been reviewed' },
        { status: 400 }
      );
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabase
      .from('weekly_reports')
      .update({
        tasks_completed,
        problems_encountered,
        learnings_acquired,
        total_hours_worked,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: updatedReport },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const reportId = params.id;

    // Get the current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the report
    const { data: report, error: fetchError } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if the user owns this report
    if (report.student_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only view your own reports' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { data: report },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}