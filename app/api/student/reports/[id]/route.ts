import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

export async function DELETE(
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

    // First, get the report to check ownership and get document path
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
        { error: 'Unauthorized - You can only delete your own reports' },
        { status: 403 }
      );
    }

    // Check if report is already reviewed (can't delete reviewed reports)
    if (report.status === 'approved' || report.status === 'rejected') {
      return NextResponse.json(
        { error: 'Cannot delete reports that have been reviewed' },
        { status: 400 }
      );
    }

    // If there's an uploaded document, delete it from storage first
    if (report.document_url && report.document_path) {
      try {
        const { error: storageError } = await supabase.storage
          .from('weekly-reports')
          .remove([report.document_path]);

        if (storageError) {
          console.error('Error deleting document from storage:', storageError);
          // Continue with report deletion even if document deletion fails
        }
      } catch (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('weekly_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete report' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}