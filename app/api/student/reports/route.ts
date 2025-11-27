import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitWeeklyReport } from "@/lib/student";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.user_type !== 2) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      student_id, 
      week_starting, 
      week_ending, 
      tasks_completed, 
      problems_encountered, 
      learnings_acquired, 
      next_week_plan,
      submission_type = 'form',
      document_name,
      document_type,
      document_size
    } = body;

    // Validate required fields based on submission type
    if (!student_id || !week_starting || !week_ending) {
      return NextResponse.json(
        { error: "Missing required fields: student_id, week_starting, or week_ending" },
        { status: 400 }
      );
    }

    // Validate form content for form-based submissions
    if (submission_type === 'form' || submission_type === 'both') {
      if (!tasks_completed || !learnings_acquired || !next_week_plan) {
        return NextResponse.json(
          { error: "Missing required form fields for form submission" },
          { status: 400 }
        );
      }
    }

    // Ensure student can only submit their own reports
    if (student_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Can only submit your own reports" },
        { status: 403 }
      );
    }

    const report = {
      week_starting,
      week_ending,
      tasks_completed: tasks_completed || '',
      problems_encountered: problems_encountered || '',
      learnings_acquired: learnings_acquired || '',
      next_week_plan: next_week_plan || '',
      submission_type,
      document_name: document_name || null,
      document_type: document_type || null,
      document_size: document_size || null,
      document_url: null // Will be updated after file upload
    };

    const result = await submitWeeklyReport(student_id, report);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to submit weekly report";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}