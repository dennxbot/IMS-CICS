import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTodayAttendance, getWeeklyStats, getWeeklyReports } from "@/lib/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, CheckCircle, Timer, Info } from "lucide-react";
import Link from "next/link";
import { ClockButton } from "@/components/student/ClockButton";
import { DashboardHeader } from "@/components/student/DashboardHeader";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { createClient } from "@/utils/supabase/server";
import { formatPhilippineDateDisplay, getPhilippineDayOfWeek } from "@/lib/timeUtils";
import { SystemSettings, isReportSubmissionAllowed } from "@/types/internship";

// Helper function to get system settings from database
async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.warn('Failed to load system settings:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.warn('Error fetching system settings:', error);
    return null;
  }
}

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.user_type !== 2) {
    // Redirect to appropriate dashboard based on user type
    switch (user.user_type) {
      case 1:
        redirect('/admin/dashboard');
        break;
      default:
        redirect('/login');
    }
  }

  // Fetch dashboard data and system settings
  const [todayAttendance, weeklyStats, recentReports, systemSettings] = await Promise.all([
    getTodayAttendance(user.id),
    getWeeklyStats(user.id),
    getWeeklyReports(user.id),
    getSystemSettings()
  ]);

  // Get company-specific hour requirements
  let companySettings = {
    total_required_hours: 500, // Default fallback
    working_days: '1,2,3,4,5',
    daily_hours_limit: 8.0,
    max_weekly_hours: 40.0
  };

  if (user.company_id) {
    const supabase = createClient();
    const { data: companyData } = await supabase
      .from('companies')
      .select('total_required_hours, working_days, daily_hours_limit, max_weekly_hours')
      .eq('id', user.company_id)
      .single();

    if (companyData) {
      companySettings = {
        total_required_hours: companyData.total_required_hours || 500,
        working_days: companyData.working_days || '1,2,3,4,5',
        daily_hours_limit: companyData.daily_hours_limit || 8.0,
        max_weekly_hours: companyData.max_weekly_hours || 40.0
      };
    }
  }

  const hasMorningSession = todayAttendance.find(sheet => sheet.session === 1);
  const hasAfternoonSession = todayAttendance.find(sheet => sheet.session === 2);
  const morningActive = hasMorningSession?.timer_status === 1;
  const afternoonActive = hasAfternoonSession?.timer_status === 1;

  // Helper function to check if report submission is allowed
  const canSubmitReport = () => {
    if (!systemSettings) {
      return true; // No restrictions if settings failed to load
    }
    return isReportSubmissionAllowed(systemSettings);
  };

  // Helper function to get submission restriction message
  const getSubmissionRestrictionMessage = () => {
    if (!systemSettings || !systemSettings.restrict_report_submission) {
      return null;
    }

    const allowedDays = systemSettings.report_submission_days.split(',').map(day => parseInt(day.trim()));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const allowedDayNames = allowedDays.map(day => dayNames[day]).join(', ');

    // Get current date/time in Manila timezone
    const manilaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    const currentDate = new Date(manilaTime);
    const currentDayName = dayNames[currentDate.getDay()];
    const currentTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Find next available submission date
    let nextSubmissionDate = null;
    let daysToAdd = 1;

    while (!nextSubmissionDate && daysToAdd <= 14) { // Look ahead up to 2 weeks
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + daysToAdd);
      const futureDay = futureDate.getDay();

      if (allowedDays.includes(futureDay)) {
        nextSubmissionDate = futureDate;
      }
      daysToAdd++;
    }

    let message = `Report submission is restricted to: ${allowedDayNames}`;
    message += `\n\nCurrent date and time: ${currentDayName}, ${currentDate.toLocaleDateString()} ${currentTime}`;

    if (nextSubmissionDate) {
      const nextDayName = dayNames[nextSubmissionDate.getDay()];
      message += `\n\nNext submission available: ${nextDayName}, ${nextSubmissionDate.toLocaleDateString()}`;
    }

    return message;
  };

  // Calculate if today is a working day
  const currentDay = getPhilippineDayOfWeek();
  const workingDays = companySettings.working_days.split(',').map(day => parseInt(day.trim()));
  const isWorkingDay = workingDays.includes(currentDay);

  // Calculate current week start (Monday) for report checking
  const manilaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  const today = new Date(manilaTime);
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
  const currentWeekStarting = weekStart.toISOString().split('T')[0];

  const hasPendingReport = recentReports.some(r => r.status === 'pending');
  const hasReportForThisWeek = recentReports.some(r => r.week_starting === currentWeekStarting);
  const isSubmissionDisabled = !canSubmitReport() || hasPendingReport || hasReportForThisWeek;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Hours This Week</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{weeklyStats.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Required: {companySettings.total_required_hours} hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed Sessions</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{weeklyStats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Weekly Progress</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {companySettings.total_required_hours > 0 ? Math.round((weeklyStats.totalHours / companySettings.total_required_hours) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Of required hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {recentReports.filter(report => report.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
            Today&apos;s Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ClockButton
              session={1}
              isActive={morningActive}
              hasRecord={!!hasMorningSession}
              timeStart={hasMorningSession?.time_start}
              timeEnd={hasMorningSession?.time_end}
              totalHours={hasMorningSession?.total_hours}
              sessionStartTime={systemSettings?.morning_checkin_time || '07:45'}
              sessionEndTime={systemSettings?.morning_checkout_time || '11:45'}
              isWorkingDay={isWorkingDay}
            />
            <ClockButton
              session={2}
              isActive={afternoonActive}
              hasRecord={!!hasAfternoonSession}
              timeStart={hasAfternoonSession?.time_start}
              timeEnd={hasAfternoonSession?.time_end}
              totalHours={hasAfternoonSession?.total_hours}
              sessionStartTime={systemSettings?.afternoon_checkin_time || '12:45'}
              sessionEndTime={systemSettings?.afternoon_checkout_time || '16:45'}
              isWorkingDay={isWorkingDay}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Weekly Reports */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Recent Weekly Reports
          </CardTitle>
          <Link href="/student/reports/new" className={isSubmissionDisabled ? "pointer-events-none" : ""}>
            <Button size="sm" disabled={isSubmissionDisabled} className="w-full sm:w-auto h-10 text-sm">Submit New Report</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {getSubmissionRestrictionMessage() && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-blue-800 whitespace-pre-line font-medium mb-2 sm:mb-3">
                  {getSubmissionRestrictionMessage()}
                </div>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs sm:text-sm">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Schedule Info
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 text-xs sm:text-sm">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Manila Time
                  </Badge>
                </div>
              </div>
            </div>
          )}
          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.slice(0, 3).map((report) => (
                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2 sm:gap-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">
                      Week of {formatPhilippineDateDisplay(new Date(report.week_starting))}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {report.total_hours_worked} hours • Submitted {formatPhilippineDateDisplay(new Date(report.submitted_at))}
                    </p>
                  </div>
                  <Badge
                    variant={
                      report.status === 'approved' ? 'default' :
                        report.status === 'rejected' ? 'destructive' :
                          'secondary'
                    }
                    className="self-start sm:self-center text-xs sm:text-sm"
                  >
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No weekly reports submitted yet</p>
              <Link href="/student/reports/new" className={isSubmissionDisabled ? "pointer-events-none" : ""}>
                <Button className="mt-3" size="sm" disabled={isSubmissionDisabled}>Submit Your First Report</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}