import { createClient } from "@/utils/supabase/server";
import { Timesheet, WeeklyReport } from "@/types/internship";
import { formatPhilippineDate, formatPhilippineTime12Hour, getPhilippineDayOfWeek, parsePhilippineTime } from "@/lib/timeUtils";

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
}) {
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
      throw new Error('Cannot clock in on non-working days');
    }
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
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Timesheet;
}

export async function clockOut(studentId: string, session: 1 | 2) {
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
  const timeStart = parsePhilippineTime(today, timesheet.time_start);
  const timeEnd = parsePhilippineTime(today, now);
  const totalHours = (timeEnd.getTime() - timeStart.getTime()) / (1000 * 60 * 60);

  const { data, error } = await supabase
    .from('timesheets')
    .update({
      time_end: now,
      timer_status: 0, // Stopped
      total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
      updated_at: new Date().toISOString()
    })
    .eq('id', timesheet.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

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