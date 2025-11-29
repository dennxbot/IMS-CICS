import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const { action, comments, rating } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get the current user (admin) from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is an admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.user_type !== 1) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Update the report
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updateData: {
      status: string;
      reviewed_by: string;
      reviewed_at: string;
      supervisor_comments?: string;
      supervisor_rating?: number;
    } = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    };

    // Add supervisor comments and rating if provided
    if (comments) {
      updateData.supervisor_comments = comments;
    }
    if (rating && action === 'approve') {
      updateData.supervisor_rating = rating;
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from('weekly_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    // Create notification for student
    try {
      const notificationMessage = action === 'approve'
        ? `Your weekly report for week of ${updatedReport.week_starting} has been approved.`
        : `Your weekly report for week of ${updatedReport.week_starting} has been rejected.${comments ? ` Reason: ${comments}` : ''}`;

      await supabase.from('notifications').insert({
        user_id: updatedReport.student_id,
        title: `Report ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: notificationMessage,
        type: action === 'approve' ? 'success' : 'error',
        link: '/student/reports'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Report ${status} successfully`
    });

  } catch (error) {
    console.error('Error in approve/reject report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}