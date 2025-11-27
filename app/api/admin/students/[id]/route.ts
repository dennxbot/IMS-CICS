import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const studentId = params.id;

    // Fetch student with company information
    const { data: student, error } = await supabase
      .from('users')
      .select(`
        *,
        companies(name)
      `)
      .eq('id', studentId)
      .eq('user_type', 2)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const studentId = params.id;
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'student_id', 'contact_number', 'address'];
    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim().length === 0) {
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

    // Validate year level (removed as it's no longer needed)

    // Check if student exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('users')
      .select('id, email, student_id')
      .eq('id', studentId)
      .eq('user_type', 2)
      .single();

    if (checkError || !existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if student ID already exists (excluding current student)
    if (data.student_id !== existingStudent.student_id) {
      const { data: existingStudentId } = await supabase
        .from('users')
        .select('id')
        .eq('student_id', data.student_id)
        .neq('id', studentId)
        .single();

      if (existingStudentId) {
        return NextResponse.json(
          { error: "Student ID already exists" },
          { status: 400 }
        );
      }
    }

    // Check if email already exists (excluding current student)
    if (data.email !== existingStudent.email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .neq('id', studentId)
        .single();

      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Update student
    const { data: updatedStudent, error } = await supabase
      .from('users')
      .update({
        full_name: data.full_name.trim(),
        email: data.email.trim(),
        student_id: data.student_id.trim(),
        contact_number: data.contact_number.trim(),
        address: data.address.trim(),
        course: data.course?.trim() || null,
        company_id: data.company_id || null,
        is_active: data.is_active
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "Student updated successfully",
        student: updatedStudent 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}