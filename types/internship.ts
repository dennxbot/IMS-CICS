// Enhanced auth types for internship management system
export interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: 1 | 2 | 3; // 1: Admin, 2: Student, 3: Coordinator
  student_id?: string;
  course?: string;
  year_level?: number;
  required_duration?: number; // @deprecated - Use company time allocation instead
  company_id?: number;
  coordinator_id?: string;
  contact_number?: string;
  address?: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_number?: string;
  industry_type?: string;
  company_size?: string;
  website?: string;
  description?: string;
  total_required_hours?: number; // Total internship hours required for students
  working_days?: string; // Comma-separated working days (1=Monday, 7=Sunday)
  daily_hours_limit?: number; // Maximum hours per day
  max_weekly_hours?: number; // Maximum hours per week
  latitude?: number;
  longitude?: number;
  radius?: number; // Geofence radius in meters
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: number;
  student_id: string;
  date: string;
  session: 1 | 2; // 1: Morning, 2: Afternoon
  time_start?: string;
  time_end?: string;
  timer_status: 0 | 1; // 0: Stopped, 1: Running
  remarks?: string;
  total_hours: number;
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReport {
  id: number;
  student_id: string;
  week_starting: string;
  week_ending: string;
  tasks_completed?: string;
  problems_encountered?: string;
  learnings_acquired?: string;
  next_week_plan?: string;
  total_hours_worked: number;
  supervisor_comments?: string;
  supervisor_rating?: number;
  status: 'pending' | 'approved' | 'rejected';
  submission_type: 'form' | 'document' | 'both';
  document_url?: string;
  document_name?: string;
  document_type?: string;
  document_size?: number;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  related_id?: number;
  related_type?: string;
  created_at: string;
}

export interface SystemSettings {
  id: number;
  name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  email_notifications: boolean;
  attendance_verification_required: boolean;
  min_weekly_hours: number;
  max_daily_hours: number;
  restrict_report_submission: boolean; // New field to enable/disable report submission restriction
  report_submission_days: string; // Comma-separated days when reports can be submitted (1=Monday, 7=Sunday)
  morning_checkin_time: string; // Morning session check-in time (HH:MM format)
  morning_checkout_time: string; // Morning session check-out time (HH:MM format)
  morning_duration: number; // Morning session duration in hours
  afternoon_checkin_time: string; // Afternoon session check-in time (HH:MM format)
  afternoon_checkout_time: string; // Afternoon session check-out time (HH:MM format)
  afternoon_duration: number; // Afternoon session duration in hours
  created_at: string;
  updated_at: string;
}

// Role-based type guards
export const isAdmin = (user: User): boolean => user.user_type === 1;
export const isStudent = (user: User): boolean => user.user_type === 2;
export const isCoordinator = (user: User): boolean => user.user_type === 3;

// Company time allocation helper type
export interface CompanyTimeSettings {
  total_required_hours: number;
  working_days: string;
  daily_hours_limit: number;
  max_weekly_hours: number;
}

// Helper function to parse working days
export const parseWorkingDays = (workingDays: string): number[] => {
  return workingDays.split(',').map(day => parseInt(day.trim())).filter(day => day >= 1 && day <= 7);
};

// Helper function to check if a day is a working day
export const isWorkingDay = (workingDays: string, dayOfWeek: number): boolean => {
  const days = parseWorkingDays(workingDays);
  return days.includes(dayOfWeek);
};

// Helper function to get current day in ISO format (1=Monday, 7=Sunday)
export const getCurrentISODay = (): number => {
  // Use Philippine Standard Time (Manila Time) for consistency
  const manilaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  const day = new Date(manilaTime).getDay(); // 0=Sunday, 1=Monday, etc.
  return day === 0 ? 7 : day; // Convert to 1-7 format
};

// Helper function to check if report submission is allowed today
export const isReportSubmissionAllowed = (settings: SystemSettings): boolean => {
  if (!settings.restrict_report_submission) {
    return true; // No restriction, allow submission any day
  }
  
  const currentDay = getCurrentISODay();
  const allowedDays = parseWorkingDays(settings.report_submission_days);
  return allowedDays.includes(currentDay);
};

// Dashboard statistics
export interface DashboardStats {
  totalHours: number;
  completedSessions: number;
  pendingReports: number;
  weeklyProgress: number;
  recentActivities: Timesheet[];
  upcomingDeadlines: WeeklyReport[];
}