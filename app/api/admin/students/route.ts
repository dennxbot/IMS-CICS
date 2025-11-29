import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'student_id', 'full_name', 'email', 'contact_number',
      'address', 'course_id', 'company_id', 'password'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if student ID already exists using service role client
    const serviceSupabase = createServiceRoleClient();
    const { data: existingStudentId } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('student_id', data.student_id)
      .single();

    if (existingStudentId) {
      return NextResponse.json(
        { error: "Student ID already exists" },
        { status: 400 }
      );
    }

    // Check if email already exists using service role client
    const { data: existingEmail } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create auth user first using service role client to avoid session conflicts
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email for admin-created students
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create auth user" },
        { status: 400 }
      );
    }

    // Get course name from course_id using service role client
    const { data: courseData, error: courseError } = await serviceSupabase
      .from('courses')
      .select('name')
      .eq('id', parseInt(data.course_id))
      .single();

    if (courseError || !courseData) {
      // Rollback auth user if course fetch fails
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Invalid course selected" },
        { status: 400 }
      );
    }

    // Create user profile using service role client to bypass RLS policies
    const { error: profileError } = await serviceSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        user_type: 2, // Student
        student_id: data.student_id,
        course: courseData.name,
        course_id: parseInt(data.course_id),
        company_id: parseInt(data.company_id),
        contact_number: data.contact_number,
        address: data.address,
        is_active: true,
      });

    if (profileError) {
      // Rollback auth user if profile creation fails
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Student created successfully",
        student_id: authData.user.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const studentId = searchParams.get('id');

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        companies(name)
      `)
      .eq('id', studentId)
      .eq('user_type', 2)
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student: data });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}