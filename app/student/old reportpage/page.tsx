'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient } from '@/lib/auth-client';
import { getWeeklyReportsClient } from '@/lib/student-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Eye, Plus, Edit, Trash2, CheckCircle, RefreshCw, Clock, Info } from 'lucide-react';
import Link from 'next/link';
import { WeeklyReport, SystemSettings, isReportSubmissionAllowed } from '@/types/internship';
import { DocumentPreviewModal } from '@/components/student/DocumentPreviewModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'secondary';
  }
};

export default function WeeklyReports() {
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    documentUrl: string;
    documentName: string;
  }>({
    isOpen: false,
    documentUrl: '',
    documentName: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    reportId: number | null;
    documentName?: string;
    confirmed: boolean;
  }>({
    isOpen: false,
    reportId: null,
    documentName: '',
    confirmed: false
  });

  useEffect(() => {
    loadReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUserClient();
      
      if (!user || user.user_type !== 2) {
        router.push('/login');
        return;
      }

      // Load both reports and system settings
      const [weeklyReports, settingsResponse] = await Promise.all([
        getWeeklyReportsClient(user.id),
        fetch('/api/admin/system-settings')
      ]);

      setReports(weeklyReports);

      // Handle system settings
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSystemSettings(settingsData.settings);
      } else {
        console.warn('Failed to load system settings, allowing unrestricted submission');
        // If settings fail to load, allow unrestricted submission for better UX
        setSystemSettings(null);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewDocument = (documentUrl: string, documentName: string) => {
    setPreviewModal({
      isOpen: true,
      documentUrl,
      documentName
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      documentUrl: '',
      documentName: ''
    });
  };

  const handleEditReport = (reportId: number) => {
    router.push(`/student/reports/${reportId}/edit`);
  };

  const openDeleteConfirmation = (reportId: number, documentName?: string) => {
    setDeleteConfirmation({
      isOpen: true,
      reportId,
      documentName,
      confirmed: false
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      reportId: null,
      documentName: '',
      confirmed: false
    });
  };

  const canSubmitReport = () => {
    if (!systemSettings) {
      return true; // If settings failed to load, allow submission for better UX
    }
    return isReportSubmissionAllowed(systemSettings);
  };

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

  const handleDeleteReport = async () => {
    if (!deleteConfirmation.reportId || !deleteConfirmation.confirmed) {
      return;
    }

    try {
      // Immediately remove from UI for better UX (optimistic update)
      const deletedReportId = deleteConfirmation.reportId;
      setReports(prevReports => prevReports.filter(report => report.id !== deletedReportId));
      
      const response = await fetch(`/api/student/reports/${deletedReportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete report');
      }
      
      // Show success toast notification
      toast.success('Weekly report deleted successfully!');
    } catch (error) {
      console.error('Error deleting report:', error);
      // Revert the optimistic update on error
      await loadReports(); // Reload reports to get the correct state
      toast.error(error instanceof Error ? error.message : 'Failed to delete report. Please try again.');
    } finally {
      closeDeleteConfirmation();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
            <p className="text-gray-600">View and manage your weekly internship reports</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Submit New Report
            </Button>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
          <p className="text-gray-600">View and manage your weekly internship reports</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/student/reports/new">
            <Button disabled={!canSubmitReport()}>
              <Plus className="h-4 w-4 mr-2" />
              Submit New Report
            </Button>
          </Link>
        </div>
      </div>

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

      {reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Week of {new Date(report.week_starting).toLocaleDateString()} - {new Date(report.week_ending).toLocaleDateString()}
                  </div>
                  <Badge variant={getStatusBadgeVariant(report.status)}>
                    {report.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="font-semibold">{report.total_hours_worked} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-semibold">{new Date(report.submitted_at).toLocaleDateString()}</p>
                  </div>
                  {report.reviewed_at && (
                    <div>
                      <p className="text-sm text-gray-600">Reviewed</p>
                      <p className="font-semibold">{new Date(report.reviewed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                {report.document_url && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Uploaded Document:</span>
                        <span className="text-sm font-medium">{report.document_name}</span>
                      </div>
                      <Button
                        onClick={() => handlePreviewDocument(report.document_url!, report.document_name!)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                )}

                {(report.supervisor_comments || report.supervisor_rating) && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                    {report.reviewed_at && (
                      <div className="mt-2 text-xs text-blue-600">
                        Reviewed on {new Date(report.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditReport(report.id)}
                      variant="outline"
                      size="sm"
                      className={report.status === 'rejected' 
                        ? 'text-orange-600 border-orange-600 hover:bg-orange-50' 
                        : 'text-blue-600 border-blue-600 hover:bg-blue-50'
                      }
                    >
                      {report.status === 'rejected' ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Re-submit
                        </>
                      ) : (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => openDeleteConfirmation(report.id, report.document_name)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={report.status === 'approved' || report.status === 'rejected'}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <Link href={`/student/reports/${report.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-4">You haven&apos;t submitted any weekly reports yet.</p>
            
            {getSubmissionRestrictionMessage() && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-sm text-blue-800 whitespace-pre-line font-medium mb-3">
                    {getSubmissionRestrictionMessage()}
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
              <Button disabled={!canSubmitReport()}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Your First Report
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-2">Don&apos;t worry, you can start tracking your internship progress!</p>
          </CardContent>
        </Card>
      )}

      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreviewModal}
        documentUrl={previewModal.documentUrl}
        documentName={previewModal.documentName}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Weekly Report</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your weekly report
              {deleteConfirmation.documentName ? ` and the uploaded document &quot;${deleteConfirmation.documentName}&quot;` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirm-delete"
              checked={deleteConfirmation.confirmed}
              onCheckedChange={(checked) => 
                setDeleteConfirmation(prev => ({ ...prev, confirmed: checked as boolean }))
              }
            />
            <Label
              htmlFor="confirm-delete"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this action is permanent and cannot be undone
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              disabled={!deleteConfirmation.confirmed}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}