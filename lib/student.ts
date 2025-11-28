import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { Timesheet, WeeklyReport } from "@/types/internship";
import { formatPhilippineDate, formatPhilippineTime12Hour, getPhilippineDayOfWeek, parsePhilippineTime, getPhilippineTime } from "@/lib/timeUtils";
import { validateLocationProximity } from "@/lib/locationUtils";
import { detect_impossible_movement, storeLocationHistory } from "@/lib/antiSpoofingServer";

// Get today's attendance for a student
export async function getTodayAttendance(studentId: string): Promise<Timesheet[]> {
  const supabase = createClient();
  const today = formatPhilippineDate(); // Use Philippine Standard Time

  const { data, error } = await supabase
    .from('timesheets')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .order('session', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Timesheet[];
}

// Get weekly statistics
export async function getWeeklyStats(studentId: string, days: number = 7): Promise<{
  totalHours: number;
  completedSessions: number;
  dailyBreakdown: Array<{
    date: string;
    sessions: number;
    hours: number;
  }>;
}> {
  const supabase = createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = formatPhilippineDate(startDate); // Use Philippine Standard Time

  const { data, error } = await supabase
    .from('timesheets')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', startDateStr)
    .eq('timer_status', 0) // Only completed sessions
    .order('date', { ascending: true });

  if (error || !data) {
    return { totalHours: 0, completedSessions: 0, dailyBreakdown: [] };
  }

  const timesheets = data as Timesheet[];
  const dailyBreakdown: Record<string, { date: string; sessions: number; hours: number }> = {};

  let totalHours = 0;
  let completedSessions = 0;

  timesheets.forEach(sheet => {
    if (!dailyBreakdown[sheet.date]) {
      dailyBreakdown[sheet.date] = { date: sheet.date, sessions: 0, hours: 0 };
    }
    dailyBreakdown[sheet.date].sessions++;
    dailyBreakdown[sheet.date].hours += sheet.total_hours;
    totalHours += sheet.total_hours;
    completedSessions++;
  });

  return {
    totalHours,
    completedSessions,
    dailyBreakdown: Object.values(dailyBreakdown)
  };
}

// Clock in/out functionality
export async function clockIn(studentId: string, session: 1 | 2, location?: {
  latitude: number;
  longitude: number;
  address: string;
  timestamp?: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}, remarks?: string | null) {
  const supabase = createClient();
  const today = formatPhilippineDate(); // Use Philippine Standard Time for date
  const now = formatPhilippineTime12Hour(); // Use Philippine Standard Time with 12-hour format

  // Get student's company to check working days
  const { data: studentData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', studentId)
    .single();

  if (!studentData?.company_id) {
    throw new Error('Student is not assigned to a company');
  }

  // Validate location FIRST - required for clock-in
  if (!location?.latitude || !location?.longitude) {
    throw new Error('📍 Location Data Missing\n\nTo clock in, your device must share its location. Please enable location services in your browser settings and allow this website to access your location, then try again.');
  }

  let locationVerified = false;
  // Get company GPS coordinates and radius for location validation
  const { data: companyLocationData } = await supabase
    .from('companies')
    .select('latitude, longitude, radius')
    .eq('id', studentData.company_id)
    .single();

  if (!companyLocationData?.latitude || !companyLocationData?.longitude) {
    throw new Error('🏢 Company Location Setup Required\n\nYour company has not set up their location coordinates yet. Please contact your administrator or HR department to configure the company GPS location before you can clock in.');
  }

  const validation = validateLocationProximity(
    location.latitude,
    location.longitude,
    companyLocationData.latitude,
    companyLocationData.longitude,
    (companyLocationData.radius || 100) + 20 // Add 20m tolerance
  );

  if (!validation.isValid) {
    throw new Error(`Location validation failed: ${validation.message}`);
  }
  locationVerified = true;

  // Enhanced movement validation - check for impossible location jumps
  const currentTimestamp = location.timestamp || Date.now();
  const movementCheck = await detect_impossible_movement(
    studentId,
    location.latitude,
    location.longitude,
    currentTimestamp,
    200.0 // Max 200 km/h (reasonable for travel scenarios)
  );

  if (!movementCheck.is_possible) {
    throw new Error(`🚨 Movement Validation Failed\n\nImpossible movement detected: ${movementCheck.distance_meters.toFixed(0)}m in ${movementCheck.time_diff_seconds}s would require ${movementCheck.required_speed_kmh.toFixed(1)} km/h. This suggests GPS spoofing or manipulation.`);
  }

  // Get company working days
  const { data: companyData } = await supabase
    .from('companies')
    .select('working_days')
    .eq('id', studentData.company_id)
    .single();

  if (companyData?.working_days) {
    const workingDays = companyData.working_days.split(',').map((day: string) => parseInt(day.trim()));
    const currentDay = getPhilippineDayOfWeek(); // Use Philippine Standard Time for day of week

    if (!workingDays.includes(currentDay)) {
      throw new Error('Cannot clock in on non-working days');
    }
  }

  // Validate session time is appropriate for the session type
  const timeValidation = await validateSessionTime(session);
  if (!timeValidation.valid) {
    throw new Error(timeValidation.message);
  }

  // Check if already clocked in for this session
  const { data: existing } = await supabase
    .from('timesheets')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('session', session)
    .single();

  if (existing) {
    throw new Error('Already clocked in for this session');
  }

  const { data, error } = await supabase
    .from('timesheets')
    .insert({
      student_id: studentId,
      date: today,
      session,
      time_start: now,
      timer_status: 1, // Running
      location_latitude: location?.latitude,
      location_longitude: location?.longitude,
      location_address: location?.address,
      location_verified: locationVerified,
      location_accuracy: location?.accuracy,
      location_altitude: location?.altitude,
      location_altitude_accuracy: location?.altitudeAccuracy,
      location_heading: location?.heading,
      location_speed: location?.speed,
      location_timestamp: location?.timestamp || Date.now(),
      remarks: remarks || null, // Store remarks
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Store location history for future movement validation
  try {
    await storeLocationHistory(studentId, {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitudeAccuracy,
      heading: location.heading,
      speed: location.speed,
      timestamp: location.timestamp || Date.now(),
    }, data.id);
  } catch (historyError) {
    console.error('Failed to store location history:', historyError);
    // Don't fail the clock-in if history storage fails
  }

  return data as Timesheet;
}

export async function clockOut(studentId: string, session: 1 | 2, remarks?: string | null) {
  const supabase = createClient();
  const today = formatPhilippineDate(); // Use Philippine Standard Time for date
  const now = formatPhilippineTime12Hour(); // Use Philippine Standard Time with 12-hour format

  // Get student's company to check working days
  const { data: studentData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', studentId)
    .single();

  if (!studentData?.company_id) {
    throw new Error('Student is not assigned to a company');
  }

  // Get company working days
  const { data: companyData } = await supabase
    .from('companies')
    .select('working_days')
    .eq('id', studentData.company_id)
    .single();

  if (companyData?.working_days) {
    const workingDays = companyData.working_days.split(',').map((day: string) => parseInt(day.trim()));
    const currentDay = getPhilippineDayOfWeek(); // Use Philippine Standard Time for day of week

    if (!workingDays.includes(currentDay)) {
      throw new Error('Cannot clock out on non-working days');
    }
  }

  // Get the running timesheet
  const { data: timesheet } = await supabase
    .from('timesheets')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('session', session)
    .eq('timer_status', 1) // Running
    .single();

  if (!timesheet) {
    throw new Error('No active session found');
  }

  // Calculate total hours using Philippine time
  if (!timesheet.time_start) {
    throw new Error('Invalid timesheet: missing start time');
  }

  console.log('DEBUG: clockOut - today:', today);
  console.log('DEBUG: clockOut - now:', now);
  console.log('DEBUG: clockOut - time_start:', timesheet.time_start);

  let timeStart, timeEnd;
  try {
    timeStart = parsePhilippineTime(today, timesheet.time_start);
    console.log('DEBUG: clockOut - parsed timeStart:', timeStart);

    timeEnd = parsePhilippineTime(today, now);
    console.log('DEBUG: clockOut - parsed timeEnd:', timeEnd);
  } catch (e) {
    console.error('DEBUG: clockOut - parsing error:', e);
    throw e;
  }

  const totalHours = (timeEnd.getTime() - timeStart.getTime()) / (1000 * 60 * 60);
  console.log('DEBUG: clockOut - totalHours:', totalHours);

  // Use service role client for update to ensure we can write to the table
  // regardless of RLS policies that might be restrictive on updates
  const serviceSupabase = createServiceRoleClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    time_end: now,
    timer_status: 0, // Stopped
    total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
    updated_at: new Date().toISOString()
  };

  if (remarks) {
    updateData.remarks = remarks;
  }

  const { data, error } = await serviceSupabase
    .from('timesheets')
    .update(updateData)
    .eq('id', timesheet.id)
    .select()
    .single();

  if (error) {
    console.error('DEBUG: clockOut - update error:', error);
    throw error;
  }

  console.log('DEBUG: clockOut - update success:', data);
  return data as Timesheet;
}

// Get weekly reports
export async function getWeeklyReports(studentId: string): Promise<WeeklyReport[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('student_id', studentId)
    .order('week_starting', { ascending: false })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data as WeeklyReport[];
}

// Submit weekly report with document support
export async function submitWeeklyReport(studentId: string, report: {
  week_starting: string;
  week_ending: string;
  tasks_completed: string;
  problems_encountered: string;
  learnings_acquired: string;
  next_week_plan: string;
  submission_type?: 'form' | 'document' | 'both';
  document_name?: string | null;
  document_type?: string | null;
  document_size?: number | null;
  document_url?: string | null;
}) {
  const supabase = createClient();

  // Calculate total hours for the week
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('total_hours')
    .eq('student_id', studentId)
    .gte('date', report.week_starting)
    .lte('date', report.week_ending)
    .eq('timer_status', 0);

  const totalHours = timesheets?.reduce((sum, sheet) => sum + (sheet.total_hours || 0), 0) || 0;

  const { data, error } = await supabase
    .from('weekly_reports')
    .insert({
      student_id: studentId,
      ...report,
      total_hours_worked: Math.round(totalHours * 100) / 100,
      status: 'pending',
      submission_type: report.submission_type || 'form',
      document_name: report.document_name || null,
      document_type: report.document_type || null,
      document_size: report.document_size || null,
      document_url: report.document_url || null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as WeeklyReport;
}

// Helper function to validate session time is appropriate for the session
async function validateSessionTime(session: 1 | 2): Promise<{ valid: boolean; message?: string }> {
  const philippineTime = getPhilippineTime();
  const currentHour = philippineTime.getUTCHours();
  const currentMinute = philippineTime.getUTCMinutes();
  const timeInMinutes = currentHour * 60 + currentMinute;

  console.log('DEBUG: Philippine time:', philippineTime.toISOString());
  console.log('DEBUG: Current hour:', currentHour);
  console.log('DEBUG: Current minute:', currentMinute);
  console.log('DEBUG: Time in minutes:', timeInMinutes);

  // Parse time string to minutes since midnight
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get session configuration from system settings - use service role client for full access
  const serviceSupabase = createServiceRoleClient();
  const { data: systemSettings, error: settingsError } = await serviceSupabase
    .from('system_settings')
    .select('*')
    .single();

  console.log('DEBUG: System settings:', systemSettings);
  console.log('DEBUG: Settings error:', settingsError);

  if (!systemSettings || settingsError) {
    console.log('System settings not found or error:', settingsError, 'Using fallback times');
    // Fallback to hardcoded times if settings not found
    const fallbackSettings = {
      morning_checkin_time: '07:45',
      morning_checkout_time: '11:45',
      afternoon_checkin_time: '12:45',
      afternoon_checkout_time: '16:45'
    };

    if (session === 1) {
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
        if (!(timeInMinutes >= afternoonStart || timeInMinutes <= afternoonEnd)) {
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

  if (session === 1) {
    const morningStart = parseTime(systemSettings.morning_checkin_time || '07:45');
    const morningEnd = parseTime(systemSettings.morning_checkout_time || '11:45');

    console.log('DEBUG: Morning session validation:');
    console.log('DEBUG: Morning start (minutes):', morningStart);
    console.log('DEBUG: Morning end (minutes):', morningEnd);
    console.log('DEBUG: Current time (minutes):', timeInMinutes);
    console.log('DEBUG: Is before start?', timeInMinutes < morningStart);
    console.log('DEBUG: Is after end?', timeInMinutes > morningEnd);

    if (timeInMinutes < morningStart) {
      return { valid: false, message: `Morning session check-in cannot be before ${systemSettings.morning_checkin_time || '07:45'}` };
    }
    if (timeInMinutes > morningEnd) {
      return { valid: false, message: `Morning session check-in cannot be after ${systemSettings.morning_checkout_time || '11:45'}` };
    }
  } else {
    const afternoonStart = parseTime(systemSettings.afternoon_checkin_time || '12:45');
    const afternoonEnd = parseTime(systemSettings.afternoon_checkout_time || '16:45');

    // Handle overnight sessions (e.g., 11:13 PM to 12:45 AM)
    if (afternoonEnd <= afternoonStart) {
      // Session spans midnight - valid time is after start OR before end
      if (!(timeInMinutes >= afternoonStart || timeInMinutes <= afternoonEnd)) {
        return { valid: false, message: `Afternoon session check-in must be between ${systemSettings.afternoon_checkin_time || '12:45'} and ${systemSettings.afternoon_checkout_time || '16:45'}` };
      }
    } else {
      // Normal session (doesn't span midnight)
      if (timeInMinutes < afternoonStart) {
        return { valid: false, message: `Afternoon session check-in cannot be before ${systemSettings.afternoon_checkin_time || '12:45'}` };
      }
      if (timeInMinutes > afternoonEnd) {
        return { valid: false, message: `Afternoon session check-in cannot be after ${systemSettings.afternoon_checkout_time || '16:45'}` };
      }
    }
  }

  return { valid: true };
}