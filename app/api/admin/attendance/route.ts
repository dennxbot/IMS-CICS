import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

// GET: Fetch attendance records with company-based filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const studentId = searchParams.get('student_id');

    const serviceSupabase = createServiceRoleClient();

    // Build the query
    let query = serviceSupabase
      .from('timesheets')
      .select(`
        *,
        users!timesheets_student_id_fkey(
          full_name,
          student_id,
          course,
          company_id
        )
      `)
      .order('date', { ascending: false })
      .order('session', { ascending: true });

    // Apply filters
    if (companyId) {
      query = query.eq('users.company_id', parseInt(companyId));
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      query = query.eq('date', startDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance: data });
  } catch (error) {
    console.error('Error in attendance GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, date, session, status, time_start, time_end, remarks } = body;

    if (!student_id || !date || !session) {
      return NextResponse.json(
        { error: 'Student ID, date, and session are required' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // Check if attendance record already exists
    const { data: existingRecord } = await serviceSupabase
      .from('timesheets')
      .select('id')
      .eq('student_id', student_id)
      .eq('date', date)
      .eq('session', session)
      .single();

    let result;

    if (existingRecord) {
      // Update existing record
      const { data, error } = await serviceSupabase
        .from('timesheets')
        .update({
          time_start: time_start || null,
          time_end: time_end || null,
          remarks: remarks || null,
          is_verified: status === 'present',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json(
          { error: 'Failed to update attendance record' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new record
      const { data, error } = await serviceSupabase
        .from('timesheets')
        .insert({
          student_id,
          date,
          session: parseInt(session),
          time_start: time_start || null,
          time_end: time_end || null,
          remarks: remarks || null,
          is_verified: status === 'present',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating attendance:', error);
        return NextResponse.json(
          { error: 'Failed to create attendance record' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({ attendance: result });
  } catch (error) {
    console.error('Error in attendance POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}