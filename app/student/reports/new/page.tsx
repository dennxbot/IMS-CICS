import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WeeklyReportFormWithFileUpload } from "@/components/student/WeeklyReportFormWithFileUpload";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { isReportSubmissionAllowed } from "@/types/internship";

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

  if (settings && !isReportSubmissionAllowed(settings)) {
    redirect('/student/reports?restriction=active');
  }

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

      <WeeklyReportFormWithFileUpload 
        studentId={user.id}
        weekStarting={weekStarting}
        weekEnding={weekEnding}
      />
    </div>
  );
}