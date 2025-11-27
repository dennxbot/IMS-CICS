import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// GET - Fetch single course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Unexpected error fetching course:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, code, description, is_active } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if course code already exists (excluding current course)
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code.toUpperCase())
      .neq('id', courseId)
      .single();

    if (existingCourse) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 409 });
    }

    // Update the course
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({
        name,
        code: code.toUpperCase(),
        description: description || null,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating course:', updateError);
      return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Unexpected error updating course:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if course has enrolled students
    const { data: enrolledStudents } = await supabase
      .from('users')
      .select('id')
      .eq('course_id', courseId)
      .limit(1);

    if (enrolledStudents && enrolledStudents.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with enrolled students" }, 
        { status: 400 }
      );
    }

    // Delete the course
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }

    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error deleting course:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}