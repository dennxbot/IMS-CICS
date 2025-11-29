"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/student/DocumentPreviewModal';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  course: string;
  year_level: string;
  companies: { name: string } | null;
}

interface WeeklyReport {
  id: number;
  week_starting: string;
  week_ending: string;
  tasks_completed: string;
  problems_encountered: string;
  learnings_acquired: string;
  next_week_plan: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submission_type: 'form' | 'document' | 'both';
  document_name: string | null;
  document_url: string | null;
  document_type: string | null;
  total_hours_worked: number;
  supervisor_comments: string | null;
  supervisor_rating: number | null;
}

interface AdminStudentReportsClientProps {
  student: Student;
  initialReports: WeeklyReport[];
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'secondary';
  }
};

export function AdminStudentReportsClient({ initialReports }: AdminStudentReportsClientProps) {
  const [reports, setReports] = useState<WeeklyReport[]>(initialReports);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    documentUrl: string;
    documentName: string;
  }>({
    isOpen: false,
    documentUrl: '',
    documentName: ''
  });
  const [loading, setLoading] = useState<number | null>(null);
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    reportId: number | null;
    comments: string;
    rating: number;
  }>({
    isOpen: false,
    reportId: null,
    comments: '',
    rating: 5
  });

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    reportId: number | null;
    comments: string;
  }>({
    isOpen: false,
    reportId: null,
    comments: ''
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    reportId: number | null;
    reportTitle: string;
    confirmationText: string;
  }>({
    isOpen: false,
    reportId: null,
    reportTitle: '',
    confirmationText: ''
  });
  const supabase = createClient();

  const handlePreviewDocument = (documentUrl: string, documentName: string) => {
    setPreviewModal({
      isOpen: true,
      documentUrl,
      documentName
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleApproveReject = async (reportId: number, action: 'approve' | 'reject', comments?: string, rating?: number) => {
    setLoading(reportId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/admin/reports/${reportId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action,
          comments,
          rating
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      const result = await response.json();

      // Update the local state
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId
            ? {
              ...report,
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewed_by: result.report.reviewed_by,
              reviewed_at: result.report.reviewed_at,
              supervisor_comments: result.report.supervisor_comments,
              supervisor_rating: result.report.supervisor_rating
            }
            : report
        )
      );

      // Close the approval/reject modal if open
      if (action === 'approve') {
        setApproveModal({
          isOpen: false,
          reportId: null,
          comments: '',
          rating: 5
        });
      } else if (action === 'reject') {
        setRejectModal({
          isOpen: false,
          reportId: null,
          comments: ''
        });
      }

      // Show success message using Sonner toast
      toast.success(`Report ${action}d successfully!`, {
        description: comments ? `${action === 'approve' ? 'Comments' : 'Reason'}: ${comments}` : undefined
      });
    } catch (error) {
      console.error(`Error ${action}ing report:`, error);
      toast.error(`Failed to ${action} report`, {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleApproveWithModal = () => {
    if (approveModal.reportId) {
      handleApproveReject(approveModal.reportId, 'approve', approveModal.comments, approveModal.rating);
    }
  };

  const handleRejectWithModal = () => {
    if (rejectModal.reportId) {
      handleApproveReject(rejectModal.reportId, 'reject', rejectModal.comments);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    setLoading(reportId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Remove the report from local state
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));

      toast.success('Report deleted successfully!', {
        description: 'The weekly report has been permanently removed.'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report', {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setLoading(null);
      setDeleteModal({ isOpen: false, reportId: null, reportTitle: '', confirmationText: '' });
    }
  };

  const openDeleteModal = (report: WeeklyReport) => {
    const reportTitle = `Week of ${formatDate(report.week_starting)} - ${formatDate(report.week_ending)}`;
    setDeleteModal({
      isOpen: true,
      reportId: report.id,
      reportTitle,
      confirmationText: ''
    });
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500">This student has not submitted any weekly reports yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(report.week_starting)} - {formatDate(report.week_ending)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(report.status)}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </Badge>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => setApproveModal({
                        isOpen: true,
                        reportId: report.id,
                        comments: '',
                        rating: 5
                      })}
                      disabled={loading === report.id}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => setRejectModal({
                        isOpen: true,
                        reportId: report.id,
                        comments: ''
                      })}
                      disabled={loading === report.id}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Delete button - available for all statuses */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => openDeleteModal(report)}
                  disabled={loading === report.id}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.submission_type !== 'document' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Tasks Completed</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {report.tasks_completed}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Problems Encountered</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {report.problems_encountered || 'None'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Learnings Acquired</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {report.learnings_acquired}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Next Week Plan</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {report.next_week_plan}
                  </p>
                </div>
              </div>
            )}

            {report.total_hours_worked && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  <strong>Total Hours:</strong> {report.total_hours_worked}h
                </span>
              </div>
            )}

            {report.supervisor_comments && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Coordinator Comments</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {report.supervisor_comments}
                </p>
              </div>
            )}

            {report.supervisor_rating && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  <strong>Coordinator Rating:</strong> {report.supervisor_rating}/5
                </span>
              </div>
            )}

            {report.submission_type === 'document' && report.document_url && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{report.document_name}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreviewDocument(
                    report.document_url!,
                    report.document_name!
                  )}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Submitted: {formatDate(report.submitted_at)}
                {report.reviewed_at && (
                  <span className="ml-2">
                    | Reviewed: {formatDate(report.reviewed_at)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        documentUrl={previewModal.documentUrl}
        documentName={previewModal.documentName}
      />

      {/* Approval Modal */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Approve Weekly Report</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinator Comments (Optional)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add your comments about this report..."
                  value={approveModal.comments}
                  onChange={(e) => setApproveModal(prev => ({ ...prev, comments: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5)
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={approveModal.rating}
                  onChange={(e) => setApproveModal(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>
                      {rating} - {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setApproveModal({ isOpen: false, reportId: null, comments: '', rating: 5 })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveWithModal}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={loading === approveModal.reportId}
              >
                {loading === approveModal.reportId ? 'Approving...' : 'Approve Report'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Weekly Report</h3>
                <p className="text-sm text-gray-500">Provide feedback to the student</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Explain why this report is being rejected..."
                  value={rejectModal.comments}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, comments: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This feedback will be visible to the student to help them improve their next submission.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setRejectModal({ isOpen: false, reportId: null, comments: '' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectWithModal}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading === rejectModal.reportId}
              >
                {loading === rejectModal.reportId ? 'Rejecting...' : 'Reject Report'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Weekly Report</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Report:</strong> {deleteModal.reportTitle}
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This report will be permanently deleted. All associated data, including any uploaded documents, will be removed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type &quot;DELETE&quot; to confirm
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="DELETE"
                  value={deleteModal.confirmationText}
                  onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmationText: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ isOpen: false, reportId: null, reportTitle: '', confirmationText: '' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteModal.reportId && handleDeleteReport(deleteModal.reportId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={loading === deleteModal.reportId || deleteModal.confirmationText !== 'DELETE'}
              >
                {loading === deleteModal.reportId ? 'Deleting...' : 'Delete Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}