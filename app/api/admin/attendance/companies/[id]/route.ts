import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

// GET: Get students by company with their attendance summary
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;

    console.log('API called with company ID:', companyId);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // First, let's check if the company exists
    const { data: companyCheck } = await serviceSupabase
      .from('companies')
      .select('id')
      .eq('id', parseInt(companyId))
      .single();

    if (!companyCheck) {
      console.log('Company not found:', companyId);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get students for the company - try without timesheets count first
    const { data: students, error: studentsError } = await serviceSupabase
      .from('users')
      .select(`
        id,
        full_name,
        student_id,
        email,
        course,
        contact_number
      `)
      .eq('company_id', parseInt(companyId))
      .eq('user_type', 2) // Students only
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    console.log('Students query result:', { students, error: studentsError });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // If we got students, try to get their attendance counts separately
    if (students && students.length > 0) {
      console.log(`Fetched ${students.length} students from DB:`, students.map(s => s.id));

      // Deduplicate students by ID just in case
      const uniqueStudents = Array.from(new Map(students.map(item => [item.id, item])).values());

      if (uniqueStudents.length !== students.length) {
        console.warn(`Found duplicates! Original: ${students.length}, Unique: ${uniqueStudents.length}`);
      }

      const studentsWithCounts = await Promise.all(
        uniqueStudents.map(async (student) => {
          const { count } = await serviceSupabase
            .from('timesheets')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id);

          return {
            ...student,
            timesheets: [{ count: count || 0 }]
          };
        })
      );

      return NextResponse.json({ students: studentsWithCounts });
    }

    return NextResponse.json({ students: students || [] });
  } catch (error) {
    console.error('Error in company students GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}