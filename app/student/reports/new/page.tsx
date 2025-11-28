import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WeeklyReportFormWithFileUpload } from "@/components/student/WeeklyReportFormWithFileUpload";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isReportSubmissionAllowed, SystemSettings } from "@/types/internship";
import { Info, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Helper function to get submission restriction message
function getSubmissionRestrictionMessage(settings: SystemSettings) {
  if (!settings || !settings.restrict_report_submission) {
    return null;
  }
  
  const allowedDays = settings.report_submission_days.split(',').map(day => parseInt(day.trim()));
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
}

export default async function NewWeeklyReport() {
  const user = await getCurrentUser();
  
  if (!user || user.user_type !== 2) {
    redirect('/login');
  }

  // Check if report submission is allowed today
  const supabase = createServiceRoleClient();
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .single();

  const isSubmissionAllowed = !settings || isReportSubmissionAllowed(settings);
  const restrictionMessage = settings ? getSubmissionRestrictionMessage(settings) : null;

  // Calculate current week dates using Manila time
  const manilaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  const today = new Date(manilaTime);
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday

  // Format dates as YYYY-MM-DD
  const weekStarting = weekStart.toISOString().split('T')[0];
  const weekEnding = weekEnd.toISOString().split('T')[0];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/reports">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Weekly Report</h1>
          <p className="text-gray-600">Report your internship activities for the week</p>
        </div>
      </div>

      {restrictionMessage && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-blue-800 whitespace-pre-line font-medium mb-2 sm:mb-3">
              {restrictionMessage}
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

      {isSubmissionAllowed && (
        <WeeklyReportFormWithFileUpload 
          studentId={user.id}
          weekStarting={weekStarting}
          weekEnding={weekEnding}
        />
      )}
    </div>
  );
}