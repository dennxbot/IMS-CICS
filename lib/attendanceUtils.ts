// Attendance calculation utilities for multi-session support

/**
 * Calculate hours between check-in and check-out times
 */
export function calculateSessionHours(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0;

  const [inHours, inMinutes] = checkIn.split(':').map(Number);
  const [outHours, outMinutes] = checkOut.split(':').map(Number);

  const totalInMinutes = inHours * 60 + inMinutes;
  const totalOutMinutes = outHours * 60 + outMinutes;

  const hours = (totalOutMinutes - totalInMinutes) / 60;
  return Math.max(0, hours);
}

/**
 * Get session status based on check-in and check-out times
 */
export function getSessionStatus(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn && !checkOut) return 'absent';
  if (checkIn && !checkOut) return 'in-progress';
  if (checkIn && checkOut) return 'complete';
  return 'incomplete';
}

/**
 * Calculate late minutes compared to standard start time
 */
export function calculateLateMinutes(time: string | null, sessionType: 'morning' | 'afternoon'): number {
  if (!time) return 0;

  const standardStart = sessionType === 'morning' ? '08:00:00' : '13:00:00';

  if (time <= standardStart) return 0;

  const [timeHours, timeMinutes] = time.split(':').map(Number);
  const [stdHours, stdMinutes] = standardStart.split(':').map(Number);

  const timeInMinutes = timeHours * 60 + timeMinutes;
  const stdInMinutes = stdHours * 60 + stdMinutes;

  return Math.max(0, timeInMinutes - stdInMinutes);
}

/**
 * Format time for display (HH:MM format)
 */
export function formatTime(time: string | null): string {
  if (!time) return '--:--';

  // Parse time string (HH:MM:SS or HH:MM)
  const [hours, minutes] = time.split(':').map(Number);

  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Determine daily attendance status based on session data
 */
export function determineDailyStatus(
  morningHours: number,
  afternoonHours: number,
  totalHours: number
): 'present' | 'absent' | 'late' | 'half_day' | 'excused' {
  if (totalHours === 0) return 'absent';
  if (morningHours > 0 && afternoonHours === 0) return 'half_day';
  if (morningHours === 0 && afternoonHours > 0) return 'half_day';
  if (totalHours >= 7) return 'present';
  return 'half_day';
}

/**
 * Calculate total hours from morning and afternoon sessions
 */
export function calculateTotalHours(
  morningHours: number,
  afternoonHours: number
): number {
  return morningHours + afternoonHours;
}

/**
 * Enhanced attendance record interface
 */
export interface EnhancedAttendanceRecord {
  id: number;
  student_id: string;
  company_id: number;
  date: string;
  morning_check_in: string | null;
  morning_check_out: string | null;
  afternoon_check_in: string | null;
  afternoon_check_out: string | null;
  total_morning_hours: number;
  total_afternoon_hours: number;
  total_hours: number;
  morning_late_minutes: number;
  afternoon_late_minutes: number;
  check_in_method: string;
  location_verified: boolean;
  is_verified: boolean;
  remarks: string | null;
  users: {
    full_name: string;
    student_id: string;
    course: string;
    company_id: number;
  };
}

/**
 * Calculate complete attendance details for a record
 */
export function calculateAttendanceDetails(record: EnhancedAttendanceRecord) {
  const morningHours = calculateSessionHours(record.morning_check_in, record.morning_check_out);
  const afternoonHours = calculateSessionHours(record.afternoon_check_in, record.afternoon_check_out);
  const totalHours = calculateTotalHours(morningHours, afternoonHours);

  const morningStatus = getSessionStatus(record.morning_check_in, record.morning_check_out);
  const afternoonStatus = getSessionStatus(record.afternoon_check_in, record.afternoon_check_out);
  const dailyStatus = determineDailyStatus(morningHours, afternoonHours, totalHours);

  return {
    morning: {
      hours: morningHours,
      status: morningStatus,
      checkIn: record.morning_check_in,
      checkOut: record.morning_check_out,
      lateMinutes: record.morning_late_minutes
    },
    afternoon: {
      hours: afternoonHours,
      status: afternoonStatus,
      checkIn: record.afternoon_check_in,
      checkOut: record.afternoon_check_out,
      lateMinutes: record.afternoon_late_minutes
    },
    daily: {
      totalHours,
      status: dailyStatus,
      isVerified: record.is_verified
    }
  };
}

/**
 * Validate time format (HH:MM:SS)
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate time sequence (check-out after check-in)
 */
export function isValidTimeSequence(checkIn: string, checkOut: string): boolean {
  return checkOut > checkIn;
}

/**
 * Get attendance summary for multiple records
 */
export function getAttendanceSummary(records: EnhancedAttendanceRecord[]) {
  const summary = {
    totalRecords: records.length,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    totalHours: 0,
    averageHours: 0,
    lateArrivals: 0,
    sessions: {
      morningComplete: 0,
      afternoonComplete: 0,
      morningInProgress: 0,
      afternoonInProgress: 0
    }
  };

  records.forEach(record => {
    const details = calculateAttendanceDetails(record);

    // Count daily status
    if (details.daily.status === 'present') summary.presentDays++;
    else if (details.daily.status === 'absent') summary.absentDays++;
    else if (details.daily.status === 'half_day') summary.halfDays++;

    // Count hours
    summary.totalHours += details.daily.totalHours;

    // Count late arrivals
    if (record.morning_late_minutes > 0 || record.afternoon_late_minutes > 0) {
      summary.lateArrivals++;
    }

    // Count sessions
    if (details.morning.status === 'complete') summary.sessions.morningComplete++;
    if (details.afternoon.status === 'complete') summary.sessions.afternoonComplete++;
    if (details.morning.status === 'in-progress') summary.sessions.morningInProgress++;
    if (details.afternoon.status === 'in-progress') summary.sessions.afternoonInProgress++;
  });

  summary.averageHours = summary.totalHours / Math.max(1, summary.totalRecords);

  return summary;
}