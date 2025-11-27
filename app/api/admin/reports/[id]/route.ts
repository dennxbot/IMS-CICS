import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
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

    // First, get the report to check if it has a document
    const { data: report, error: fetchError } = await supabase
      .from('weekly_reports')
      .select('document_url, document_name')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // If there's a document, delete it from storage first
    if (report.document_url) {
      // Extract the file path from the URL
      const urlParts = report.document_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('weekly-reports')
          .remove([fileName]);

        if (storageError) {
          console.error('Error deleting document from storage:', storageError);
          // Continue with report deletion even if document deletion fails
        }
      }
    }

    // Delete the report from the database
    const { error: deleteError } = await supabase
      .from('weekly_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}