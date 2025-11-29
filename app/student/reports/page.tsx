import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWeeklyReports } from "@/lib/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Clock, Edit, Eye, Plus, CheckCircle, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatPhilippineDateDisplay } from "@/lib/timeUtils";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { SystemSettings, isReportSubmissionAllowed } from "@/types/internship";
import { DeleteReportButton } from "@/components/student/DeleteReportButton";
import { DocumentPreviewButton } from "@/components/student/DocumentPreviewButton";

// Helper function to get system settings
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

// Helper function to get submission restriction message
function getSubmissionRestrictionMessage(settings: SystemSettings | null): string | null {
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

export default async function StudentReportsPage() {
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

  // Fetch reports and system settings
  const [reports, systemSettings] = await Promise.all([
    getWeeklyReports(user.id),
    getSystemSettings()
  ]);

  // Check if report submission is allowed
  const canSubmitReport = () => {
    if (!systemSettings) {
      return true; // No restrictions if settings failed to load
    }
    return isReportSubmissionAllowed(systemSettings);
  };

  const restrictionMessage = getSubmissionRestrictionMessage(systemSettings);
  const isSubmissionAllowed = canSubmitReport();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Arrow */}
        <div className="mb-4">
          <Link href="/student/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          {(() => {
            // Calculate current week start (Monday)
            const manilaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
            const today = new Date(manilaTime);
            const dayOfWeek = today.getDay();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
            const currentWeekStarting = weekStart.toISOString().split('T')[0];

            const hasPendingReport = reports.some(r => r.status === 'pending');
            const hasReportForThisWeek = reports.some(r => r.week_starting === currentWeekStarting);

            const isDisabled = !isSubmissionAllowed || hasPendingReport || hasReportForThisWeek;

            return (
              <div className="flex flex-col gap-2">
                <Link href="/student/reports/new" className={isDisabled ? "pointer-events-none" : ""}>
                  <Button
                    disabled={isDisabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit New Report
                  </Button>
                </Link>
                {hasPendingReport && (
                  <p className="text-sm text-orange-600">
                    You have a pending report. Please wait for it to be reviewed or delete it before submitting a new one.
                  </p>
                )}
                {!hasPendingReport && hasReportForThisWeek && (
                  <p className="text-sm text-blue-600">
                    You have already submitted a report for this week.
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-600 mb-6">You haven&apos;t submitted any weekly reports yet.</p>

              {/* Submission Restriction Warning in Empty State */}
              {restrictionMessage && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm max-w-md mx-auto">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <Info className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="text-sm text-blue-800 whitespace-pre-line font-medium mb-3">
                      {restrictionMessage}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        <Calendar className="w-3 h-3 mr-1" />
                        Schedule Info
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Manila Time
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <Link href="/student/reports/new">
                <Button
                  disabled={!isSubmissionAllowed}
                >
                  Submit Your First Report
                </Button>
              </Link>
              {!isSubmissionAllowed && (
                <p className="text-sm text-orange-600 mt-2">
                  Don&apos;t worry, you can start tracking your internship progress!
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Week Starting {formatPhilippineDateDisplay(new Date(report.week_starting))}
                    </CardTitle>
                    <Badge
                      variant={report.status === 'approved' ? 'default' : report.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Week Ending: {formatPhilippineDateDisplay(new Date(report.week_ending))}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Hours Rendered: {report.total_hours_worked}h</span>
                    </div>

                    {report.document_url && report.document_name && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-600">Uploaded Document:</span>
                            <span className="text-sm font-medium">{report.document_name}</span>
                          </div>
                          <DocumentPreviewButton
                            documentUrl={report.document_url}
                            documentName={report.document_name}
                          />
                        </div>
                      </div>
                    )}

                    {(report.supervisor_comments || report.supervisor_rating) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-sm text-blue-900 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Coordinator Review
                        </h4>
                        {report.supervisor_rating && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-blue-800">Rating: </span>
                            <span className="text-sm text-blue-700">{report.supervisor_rating}/5</span>
                          </div>
                        )}
                        {report.supervisor_comments && (
                          <div>
                            <span className="text-sm font-medium text-blue-800">Comments: </span>
                            <span className="text-sm text-blue-700">{report.supervisor_comments}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link href={`/student/reports/${report.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>

                    {report.status === 'pending' && (
                      <>
                        <Link href={`/student/reports/${report.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>

                        <DeleteReportButton
                          reportId={report.id}
                          weekStarting={report.week_starting}
                        />
                      </>
                    )}

                    {report.status === 'rejected' && (
                      <Link href={`/student/reports/${report.id}/resubmit`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-1" />
                          Resubmit
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}