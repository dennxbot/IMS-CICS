import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.user_type !== 2) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { document_url } = body;

    if (!document_url) {
      return NextResponse.json(
        { error: "Missing document_url" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const reportId = params.id;

    // First, verify that the report belongs to the current student
    const { data: existingReport, error: checkError } = await supabase
      .from('weekly_reports')
      .select('student_id')
      .eq('id', reportId)
      .single();

    if (checkError || !existingReport) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (existingReport.student_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Can only update your own reports" },
        { status: 403 }
      );
    }

    // Update the report with the document URL
    const { data, error } = await supabase
      .from('weekly_reports')
      .update({
        document_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating report document URL:', error);
      return NextResponse.json(
        { error: "Failed to update report with document URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update report document";
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}