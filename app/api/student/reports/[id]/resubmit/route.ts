import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const reportId = params.id;

    const body = await request.json();
    console.log('Resubmit API: Received request body:', body);

    const { tasks_completed, problems_encountered, learnings_acquired, total_hours_worked, document_url, document_name, document_type, document_size, submission_type } = body;

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
        { error: 'Unauthorized - You can only resubmit your own reports' },
        { status: 403 }
      );
    }

    // Only allow resubmission of rejected reports
    if (report.status !== 'rejected') {
      console.log('Resubmit API: Report status is not rejected', report.status);
      return NextResponse.json(
        { error: 'Only rejected reports can be resubmitted' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!tasks_completed || !problems_encountered || !learnings_acquired || total_hours_worked === undefined || total_hours_worked === null) {
      console.log('Resubmit API: Missing required fields', {
        tasks_completed: !!tasks_completed,
        problems_encountered: !!problems_encountered,
        learnings_acquired: !!learnings_acquired,
        total_hours_worked: total_hours_worked,
        total_hours_worked_type: typeof total_hours_worked
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate total_hours_worked is a number and greater than 0
    const hoursWorked = Number(total_hours_worked);
    if (isNaN(hoursWorked) || hoursWorked <= 0) {
      console.log('Resubmit API: Invalid total_hours_worked value', {
        total_hours_worked: total_hours_worked,
        hoursWorked: hoursWorked,
        isNaN: isNaN(hoursWorked)
      });
      return NextResponse.json(
        { error: 'Total hours worked must be a valid number greater than 0' },
        { status: 400 }
      );
    }

    // Update the report and reset status to pending
    const { data: updatedReport, error: updateError } = await supabase
      .from('weekly_reports')
      .update({
        tasks_completed,
        problems_encountered,
        learnings_acquired,
        total_hours_worked: hoursWorked, // Use the validated number
        document_url,
        document_name,
        document_type,
        document_size,
        submission_type,
        status: 'pending', // Reset status to pending
        supervisor_comments: null, // Clear previous supervisor comments
        reviewed_by: null, // Clear previous reviewer
        reviewed_at: null, // Clear previous review date
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Resubmit API: Database update error:', updateError);
      return NextResponse.json(
        { error: `Failed to resubmit report: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Create notification for admins
    try {
      const serviceSupabase = createServiceRoleClient();
      const { data: admins } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('user_type', 1);

      if (admins && admins.length > 0) {
        const { data: student } = await serviceSupabase
          .from('users')
          .select('full_name')
          .eq('id', authUser.id)
          .single();

        const notifications = admins.map((admin: { id: string }) => ({
          user_id: admin.id,
          title: 'Report Resubmitted',
          message: `${student?.full_name || 'A student'} resubmitted a report for week of ${report.week_starting}.`,
          type: 'info',
          link: `/admin/students/${authUser.id}/reports`
        }));

        await serviceSupabase.from('notifications').insert(notifications);
      }
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError);
    }

    return NextResponse.json(
      { data: updatedReport, message: 'Report resubmitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error resubmitting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}