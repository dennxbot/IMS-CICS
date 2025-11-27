import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET: Export attendance data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const format = searchParams.get('format') || 'json'; // json, csv

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // Get attendance data with student and company information
    const { data, error } = await serviceSupabase
      .from('timesheets')
      .select(`
        *,
        users!inner(
          full_name,
          student_id,
          course,
          companies!inner(name)
        )
      `)
      .eq('users.company_id', parseInt(companyId))
      .gte('date', startDate || '2000-01-01')
      .lte('date', endDate || '2099-12-31')
      .order('date', { ascending: false })
      .order('users.full_name', { ascending: true })
      .order('session', { ascending: true });

    if (error) {
      console.error('Error fetching attendance data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance data' },
        { status: 500 }
      );
    }

    // Transform data for export
    const exportData = data.map(record => ({
      date: record.date,
      student_name: record.users.full_name,
      student_id: record.users.student_id,
      course: record.users.course,
      company: record.users.companies.name,
      session: record.session === 1 ? 'Morning' : 'Afternoon',
      time_in: record.time_start || 'N/A',
      time_out: record.time_end || 'N/A',
      status: record.is_verified ? 'Present' : 'Absent',
      total_hours: record.total_hours || 0,
      remarks: record.remarks || '',
      verified: record.is_verified ? 'Yes' : 'No',
    }));

    if (format === 'csv') {
      // Generate CSV content
      const headers = ['Date', 'Student Name', 'Student ID', 'Course', 'Company', 'Session', 'Time In', 'Time Out', 'Status', 'Total Hours', 'Remarks', 'Verified'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => [
          row.date,
          `"${row.student_name}"`,
          row.student_id,
          row.course,
          `"${row.company}"`,
          row.session,
          row.time_in,
          row.time_out,
          row.status,
          row.total_hours,
          `"${row.remarks}"`,
          row.verified
        ].join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance_${companyId}_${startDate || 'all'}_${endDate || 'all'}.csv"`,
        },
      });
    }

    return NextResponse.json({ 
      attendance: exportData,
      summary: {
        total_records: exportData.length,
        present_count: exportData.filter(r => r.status === 'Present').length,
        absent_count: exportData.filter(r => r.status === 'Absent').length,
        date_range: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    console.error('Error in attendance export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}