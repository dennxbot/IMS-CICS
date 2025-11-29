import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { getPhilippineTime, formatPhilippineDate } from '@/lib/timeUtils';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        // Check authentication
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user data to verify admin status
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', authUser.id)
            .single();

        if (userError || !userData || userData.user_type !== 1) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!companyId || companyId === 'all') {
            return NextResponse.json({ missingReports: [] });
        }

        // Determine current week's start (Monday) and end (Sunday)
        const now = getPhilippineTime();
        const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday

        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const weekStarting = formatPhilippineDate(monday);
        const weekEnding = formatPhilippineDate(sunday);

        // 1. Get all active students in the company
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, full_name, student_id, email, course, companies(name)')
            .eq('company_id', companyId)
            .eq('user_type', 2)
            .eq('is_active', true);

        if (studentsError) {
            throw studentsError;
        }

        // 2. Get all reports for this week for these students
        const { data: reports, error: reportsError } = await supabase
            .from('weekly_reports')
            .select('student_id')
            .in('student_id', students.map(s => s.id))
            .gte('week_starting', weekStarting)
            .lte('week_starting', weekEnding); // Check if a report exists for this week start

        if (reportsError) {
            throw reportsError;
        }

        // 3. Find students who haven't submitted
        const submittedStudentIds = new Set(reports?.map(r => r.student_id));
        const missingReports = students.filter(student => !submittedStudentIds.has(student.id));

        return NextResponse.json({
            weekStarting,
            weekEnding,
            missingReports
        });

    } catch (error) {
        console.error('Error fetching missing reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
