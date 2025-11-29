import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { calculateSessionHours } from '@/lib/attendanceUtils';
import { getPhilippineTime } from '@/lib/timeUtils';
import { validateLocationProximity } from '@/lib/locationUtils';

// Enhanced GET: Fetch attendance records with multi-session support
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const studentId = searchParams.get('student_id');

    const serviceSupabase = createServiceRoleClient();

    // Build the query with new multi-session columns
    let query = serviceSupabase
      .from('timesheets')
      .select(`
        *,
        users!timesheets_student_id_fkey!inner(
          full_name,
          student_id,
          course,
          company_id
        )
      `)
      .order('date', { ascending: false });

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

    // Transform data to consolidate sessions into single daily records
    interface AttendanceRecord {
      student_id: string;
      date: string;
      session: number;
      time_start: string | null;
      time_end: string | null;
      total_hours: number;
      morning_late_minutes?: number;
      afternoon_late_minutes?: number;
      is_verified?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any; // Allow other fields from the join
    }

    const consolidatedData: AttendanceRecord[] = [];
    const recordMap = new Map<string, AttendanceRecord>();

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.forEach((record: any) => {
        const key = `${record.student_id}-${record.date}`;

        if (!recordMap.has(key)) {
          // Initialize new consolidated record
          const newRecord = { ...record };

          // If this is a session-specific row (from student clock-in), map fields
          if (record.session === 1) {
            newRecord.morning_check_in = record.time_start;
            newRecord.morning_check_out = record.time_end;
            newRecord.total_morning_hours = record.total_hours;
            // Clear afternoon data initially if this is a morning record
            newRecord.afternoon_check_in = null;
            newRecord.afternoon_check_out = null;
            newRecord.total_afternoon_hours = 0;
          } else if (record.session === 2) {
            newRecord.afternoon_check_in = record.time_start;
            newRecord.afternoon_check_out = record.time_end;
            newRecord.total_afternoon_hours = record.total_hours;
            // Clear morning data initially if this is an afternoon record
            newRecord.morning_check_in = null;
            newRecord.morning_check_out = null;
            newRecord.total_morning_hours = 0;
          }

          recordMap.set(key, newRecord);
          consolidatedData.push(newRecord);
        } else {
          // Merge into existing record
          const existingRecord = recordMap.get(key);

          if (existingRecord) {
            if (record.session === 1) {
              existingRecord.morning_check_in = record.time_start;
              existingRecord.morning_check_out = record.time_end;
              existingRecord.total_morning_hours = record.total_hours;
              // Merge other fields if needed (e.g., lateness)
              if (record.morning_late_minutes) existingRecord.morning_late_minutes = record.morning_late_minutes;
            } else if (record.session === 2) {
              existingRecord.afternoon_check_in = record.time_start;
              existingRecord.afternoon_check_out = record.time_end;
              existingRecord.total_afternoon_hours = record.total_hours;
              // Merge other fields
              if (record.afternoon_late_minutes) existingRecord.afternoon_late_minutes = record.afternoon_late_minutes;
            }

            // Update total hours
            existingRecord.total_hours = (existingRecord.total_morning_hours || 0) + (existingRecord.total_afternoon_hours || 0);

            // Prefer verified status if either is verified
            if (record.is_verified) existingRecord.is_verified = true;
          }
        }
      });
    }

    return NextResponse.json({ attendance: consolidatedData });
  } catch (error) {
    console.error('Error in attendance GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Enhanced POST: Create or update attendance record with session support
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      date,
      session_type, // 'morning' or 'afternoon'
      action, // 'check_in' or 'check_out'
      time, // HH:MM:SS format
      check_in_method = 'manual',
      location_lat,
      location_lng,
      remarks
    } = body;

    if (!student_id || !date || !session_type || !action || !time) {
      return NextResponse.json(
        { error: 'Student ID, date, session type, action, and time are required' },
        { status: 400 }
      );
    }

    // Validate session time is appropriate for the session type (only for check-in)
    if (action === 'check_in') {
      const timeValidation = await validateSessionTime(time, session_type);
      if (!timeValidation.valid) {
        return NextResponse.json(
          { error: timeValidation.message },
          { status: 400 }
        );
      }
    }

    const serviceSupabase = createServiceRoleClient();

    // Get existing attendance record for the date
    const { data: existingRecord } = await serviceSupabase
      .from('timesheets')
      .select('*')
      .eq('student_id', student_id)
      .eq('date', date)
      .single();

    let result;

    if (existingRecord) {
      // Update existing record
      interface UpdateData {
        updated_at: string;
        is_verified?: boolean;
        remarks?: string;
        location_verified?: boolean;
        [key: string]: string | number | boolean | undefined;
      }

      const updateData: UpdateData = {
        updated_at: getPhilippineTime().toISOString()
      };

      if (action === 'check_in') {
        // Check if already checked in for this session
        const existingCheckIn = existingRecord[`${session_type}_check_in`];
        if (existingCheckIn) {
          return NextResponse.json(
            { error: `Already checked in for ${session_type} session at ${existingCheckIn}` },
            { status: 400 }
          );
        }

        updateData[`${session_type}_check_in`] = time;
        updateData.check_in_method = check_in_method;

        // Validate location if provided
        if (location_lat && location_lng) {
          const isValidLocation = await validateLocation(location_lat, location_lng, student_id);
          updateData.location_verified = isValidLocation;
        }

        // Calculate late minutes
        const lateMinutes = calculateLateMinutes(time, session_type);
        updateData[`${session_type}_late_minutes`] = lateMinutes;

      } else if (action === 'check_out') {
        // Check if checked in for this session
        const existingCheckIn = existingRecord[`${session_type}_check_in`];
        if (!existingCheckIn) {
          return NextResponse.json(
            { error: `Cannot check out for ${session_type} session without check-in` },
            { status: 400 }
          );
        }

        // Check if already checked out for this session
        const existingCheckOut = existingRecord[`${session_type}_check_out`];
        if (existingCheckOut) {
          return NextResponse.json(
            { error: `Already checked out for ${session_type} session at ${existingCheckOut}` },
            { status: 400 }
          );
        }

        // Validate time sequence
        if (time <= existingCheckIn) {
          return NextResponse.json(
            { error: 'Check-out time must be after check-in time' },
            { status: 400 }
          );
        }

        updateData[`${session_type}_check_out`] = time;

        // Calculate session hours
        const sessionHours = calculateSessionHours(existingCheckIn, time);
        updateData[`total_${session_type}_hours`] = sessionHours;

        // Update total hours
        const morningHours = session_type === 'morning' ? sessionHours : (existingRecord.total_morning_hours || 0);
        const afternoonHours = session_type === 'afternoon' ? sessionHours : (existingRecord.total_afternoon_hours || 0);
        updateData.total_hours = morningHours + afternoonHours;

        // Update verification status
        updateData.is_verified = (updateData.total_hours as number) > 0;
      }

      if (remarks) {
        updateData.remarks = remarks;
      }

      const { data, error } = await serviceSupabase
        .from('timesheets')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

    } else {
      // Create new record
      if (action === 'check_out') {
        return NextResponse.json(
          { error: 'Cannot check out without existing attendance record' },
          { status: 400 }
        );
      }

      interface NewRecord {
        student_id: string;
        date: string;
        session: number;
        check_in_method: string;
        total_morning_hours: number;
        total_afternoon_hours: number;
        total_hours: number;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        [key: string]: string | number | boolean | undefined;
      }

      const newRecord: NewRecord = {
        student_id,
        date,
        session: 1, // Keep for backward compatibility
        [`${session_type}_check_in`]: time,
        check_in_method,
        total_morning_hours: 0,
        total_afternoon_hours: 0,
        total_hours: 0,
        is_verified: false,
        created_at: getPhilippineTime().toISOString(),
        updated_at: getPhilippineTime().toISOString()
      };

      // Validate location if provided
      if (location_lat && location_lng) {
        const isValidLocation = await validateLocation(location_lat, location_lng, student_id);
        newRecord.location_verified = isValidLocation;
      }

      // Calculate late minutes
      const lateMinutes = calculateLateMinutes(time, session_type);
      newRecord[`${session_type}_late_minutes`] = lateMinutes;

      if (remarks) {
        newRecord.remarks = remarks;
      }

      const { data, error } = await serviceSupabase
        .from('timesheets')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      attendance: result,
      message: `${session_type} ${action.replace('_', '-')} recorded successfully`
    });

  } catch (error) {
    console.error('Error in attendance POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate late minutes
function calculateLateMinutes(time: string, sessionType: 'morning' | 'afternoon'): number {
  const standardStart = sessionType === 'morning' ? '08:00:00' : '13:00:00';

  if (time <= standardStart) return 0;

  const [timeHours, timeMinutes] = time.split(':').map(Number);
  const [stdHours, stdMinutes] = standardStart.split(':').map(Number);

  const timeInMinutes = timeHours * 60 + timeMinutes;
  const stdInMinutes = stdHours * 60 + stdMinutes;

  return Math.max(0, timeInMinutes - stdInMinutes);
}

// Helper function to validate location against company location
async function validateLocation(
  studentLat: number,
  studentLng: number,
  studentId: string
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();

    // Get student's company information
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.company_id) {
      console.error('Error fetching student company:', studentError);
      return false;
    }

    // Get company GPS coordinates and radius
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('latitude, longitude, radius')
      .eq('id', student.company_id)
      .single();

    if (companyError || !company?.latitude || !company?.longitude) {
      console.error('Error fetching company location:', companyError);
      return false;
    }

    // Validate location proximity with 20m tolerance
    const validation = validateLocationProximity(
      studentLat,
      studentLng,
      company.latitude,
      company.longitude,
      (company.radius || 100) + 20 // Add 20m tolerance
    );

    return validation.isValid;
  } catch (error) {
    console.error('Error validating location:', error);
    return false;
  }
}

// Helper function to validate check-in time is appropriate for session type
async function validateSessionTime(time: string, sessionType: 'morning' | 'afternoon'): Promise<{ valid: boolean; message?: string }> {
  const supabase = createServiceRoleClient();
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;

  // Parse time string to minutes since midnight
  const parseTime = (timeStr: string): number => {
    const [timeHours, timeMinutes] = timeStr.split(':').map(Number);
    return timeHours * 60 + timeMinutes;
  };

  // Get session configuration from system settings
  const { data: systemSettings } = await supabase
    .from('system_settings')
    .select('morning_checkin_time, morning_checkout_time, afternoon_checkin_time, afternoon_checkout_time')
    .single();

  if (!systemSettings) {
    console.log('System settings not found in admin attendance API, using fallback times');
    // Fallback to admin-configured defaults if settings not found
    const fallbackSettings = {
      morning_checkin_time: '07:45',
      morning_checkout_time: '11:45',
      afternoon_checkin_time: '12:45',
      afternoon_checkout_time: '16:45'
    };

    if (sessionType === 'morning') {
      const morningStart = parseTime(fallbackSettings.morning_checkin_time);
      const morningEnd = parseTime(fallbackSettings.morning_checkout_time);

      if (timeInMinutes < morningStart) {
        return { valid: false, message: `Morning session check-in cannot be before ${fallbackSettings.morning_checkin_time}` };
      }
      if (timeInMinutes > morningEnd) {
        return { valid: false, message: `Morning session check-in cannot be after ${fallbackSettings.morning_checkout_time}` };
      }
    } else {
      const afternoonStart = parseTime(fallbackSettings.afternoon_checkin_time);
      const afternoonEnd = parseTime(fallbackSettings.afternoon_checkout_time);

      // Handle overnight sessions in fallback
      if (afternoonEnd <= afternoonStart) {
        if (timeInMinutes < afternoonStart && timeInMinutes > afternoonEnd) {
          return { valid: false, message: `Afternoon session check-in must be between ${fallbackSettings.afternoon_checkin_time} and ${fallbackSettings.afternoon_checkout_time}` };
        }
      } else {
        if (timeInMinutes < afternoonStart) {
          return { valid: false, message: `Afternoon session check-in cannot be before ${fallbackSettings.afternoon_checkin_time}` };
        }
        if (timeInMinutes > afternoonEnd) {
          return { valid: false, message: `Afternoon session check-in cannot be after ${fallbackSettings.afternoon_checkout_time}` };
        }
      }
    }
    return { valid: true };
  }

  if (sessionType === 'morning') {
    const morningStart = parseTime(systemSettings.morning_checkin_time || '07:45');
    const morningEnd = parseTime(systemSettings.morning_checkout_time || '11:45');

    if (timeInMinutes < morningStart) {
      return { valid: false, message: `Morning session check-in cannot be before ${systemSettings.morning_checkin_time || '07:45'}` };
    }
    if (timeInMinutes > morningEnd) {
      return { valid: false, message: `Morning session check-in cannot be after ${systemSettings.morning_checkout_time || '11:45'}` };
    }
  } else {
    const afternoonStart = parseTime(systemSettings.afternoon_checkin_time || '12:45');
    const afternoonEnd = parseTime(systemSettings.afternoon_checkout_time || '16:45');

    if (timeInMinutes < afternoonStart) {
      return { valid: false, message: `Afternoon session check-in cannot be before ${systemSettings.afternoon_checkin_time || '12:45'}` };
    }
    if (timeInMinutes > afternoonEnd) {
      return { valid: false, message: `Afternoon session check-in cannot be after ${systemSettings.afternoon_checkout_time || '16:45'}` };
    }
  }

  return { valid: true };
}