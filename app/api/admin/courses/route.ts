import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.user_type !== 1) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, description } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { message: "Name and code are required" },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .single();

    if (existingCourse) {
      return NextResponse.json(
        { message: "Course code already exists" },
        { status: 409 }
      );
    }

    // Create the course
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert([
        {
          name,
          code: code.toUpperCase(),
          description: description || null,
          is_active: true,
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating course:', createError);
      return NextResponse.json(
        { message: "Failed to create course" },
        { status: 500 }
      );
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating course:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createClient();

    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, name, code, description, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { message: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('Unexpected error fetching courses:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}