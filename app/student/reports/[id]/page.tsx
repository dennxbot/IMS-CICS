'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, Calendar, Clock, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUserClient } from '@/lib/auth-client';
import { WeeklyReport } from '@/types/internship';
import { formatPhilippineDate } from '@/lib/timeUtils';

// Safe date formatting function
const safeFormatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  try {
    return formatPhilippineDate(new Date(dateString));
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'secondary';
  }
};

export default function ViewWeeklyReport() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUserClient();
      
      if (!user || user.user_type !== 2) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/student/reports/${reportId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to load report');
      }

      const data = await response.json();
      setReport(data.data);
    } catch (error) {
      console.error('Error loading report:', error);
      // Redirect back to reports list if there's an error
      router.push('/student/reports');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Report not found</p>
              <Button 
                onClick={() => router.push('/student/reports')}
                variant="outline" 
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => router.push('/student/reports')}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        
        {report.status === 'pending' && (
          <Link href={`/student/reports/${report.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Report
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Weekly Report Details</CardTitle>
            </div>
            <Badge variant={getStatusBadgeVariant(report.status)}>
              {report.status?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Week Starting</p>
                <p className="text-sm text-muted-foreground">{safeFormatDate(report.week_starting)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Week Ending</p>
                <p className="text-sm text-muted-foreground">{safeFormatDate(report.week_ending)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Hours</p>
                <p className="text-sm text-muted-foreground">{report.total_hours_worked} hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Submission Type</p>
                <p className="text-sm text-muted-foreground capitalize">{report.submission_type || 'form'}</p>
              </div>
            </div>
          </div>

          {/* Tasks Completed */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Tasks Completed
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.tasks_completed || 'No tasks recorded'}</p>
            </div>
          </div>

          {/* Problems Encountered */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Problems Encountered</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.problems_encountered || 'No problems recorded'}</p>
            </div>
          </div>

          {/* Learnings Acquired */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Learnings Acquired</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.learnings_acquired || 'No learnings recorded'}</p>
            </div>
          </div>

          {/* Next Week Plan */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Next Week Plan</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.next_week_plan || 'No plans recorded'}</p>
            </div>
          </div>

          {/* Coordinator Review */}
          {(report.supervisor_comments || report.supervisor_rating) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Coordinator Review</h3>
              {report.supervisor_comments && (
                <div className="bg-muted p-4 rounded-lg mb-3">
                  <p className="text-sm whitespace-pre-wrap">{report.supervisor_comments}</p>
                </div>
              )}
              {report.supervisor_rating && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (report.supervisor_rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Document */}
          {report.document_url && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Attached Document</h3>
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{report.document_name}</p>
                  <p className="text-xs text-muted-foreground">{report.document_type}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="border-t pt-6 text-sm text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="font-medium">Created</p>
                <p>{safeFormatDate(report.created_at)}</p>
              </div>
              {report.updated_at !== report.created_at && (
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p>{safeFormatDate(report.updated_at)}</p>
                </div>
              )}
              {report.reviewed_at && (
                <div>
                  <p className="font-medium">Reviewed</p>
                  <p>{safeFormatDate(report.reviewed_at)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}