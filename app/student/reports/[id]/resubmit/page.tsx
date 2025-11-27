'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Loader2, FileText, Calendar, Upload, File, AlertCircle, CheckCircle, Eye, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { getCurrentUserClient } from '@/lib/auth-client';
import { WeeklyReport } from '@/types/internship';

export default function ResubmitWeeklyReport() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    tasks_completed: '',
    problems_encountered: '',
    learnings_acquired: '',
    total_hours_worked: 0,
  });
  const [submissionType, setSubmissionType] = useState<'form' | 'document' | 'both'>('form');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [documentRemoved, setDocumentRemoved] = useState(false);

  const handlePreviewClick = async () => {
    if (existingDocument?.type.startsWith('text/')) {
      try {
        const response = await fetch(existingDocument.url);
        const text = await response.text();
        setPreviewContent(text);
      } catch {
        setPreviewContent('Failed to load text content');
      }
    }
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewContent('');
  };

  const handleRemoveDocument = () => {
    toast.warning('Are you sure you want to remove this document?', {
      action: {
        label: 'Remove',
        onClick: () => {
          setExistingDocument(null);
          setUploadedFile(null);
          setDocumentRemoved(true);
          // Reset submission type to form if it was document only
          if (submissionType === 'document') {
            setSubmissionType('form');
          }
          toast.success('Document removed successfully');
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          toast.dismiss();
        },
      },
      duration: 5000,
    });
  };

  const loadReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUserClient();
      
      if (!user || user.user_type !== 2) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/student/reports/${reportId}/edit`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to load report');
      }

      const { data } = await response.json();
      
      // Only allow resubmission for rejected reports
      if (data.status !== 'rejected') {
        router.push(`/student/reports/${reportId}`);
        return;
      }
      
      setReport(data);
      setFormData({
        tasks_completed: data.tasks_completed || '',
        problems_encountered: data.problems_encountered || '',
        learnings_acquired: data.learnings_acquired || '',
        total_hours_worked: data.total_hours_worked ? Number(data.total_hours_worked) : 0,
      });
      
      // Set submission type based on existing data
      if (data.document_url && data.document_name) {
        setSubmissionType(data.submission_type || 'document');
        setExistingDocument({
          url: data.document_url,
          name: data.document_name,
          type: data.document_type || 'application/octet-stream'
        });
      } else {
        setSubmissionType(data.submission_type || 'form');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert(`Error loading report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    loadReport();
  }, [reportId, loadReport]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf', // .pdf
      'text/plain' // .txt
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a Word document (.doc, .docx), PDF, or text file.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploadedFile(file);
    setDocumentRemoved(false);
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      if (!report) {
        throw new Error('Report not loaded');
      }
      
      // Generate a unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `${report.student_id}/${reportId}/${fileName}`);
      formData.append('bucket', 'weekly-reports');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const { data } = await response.json();
      return data.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.tasks_completed.trim()) {
      alert('Please describe tasks completed.');
      return;
    }

    if (!formData.problems_encountered.trim()) {
      alert('Please describe any problems encountered.');
      return;
    }

    if (!formData.learnings_acquired.trim()) {
      alert('Please describe what you learned.');
      return;
    }

    if (formData.total_hours_worked === undefined || formData.total_hours_worked === null || formData.total_hours_worked <= 0) {
      alert('Please enter valid hours worked');
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare the update data
      const updateData: {
        tasks_completed: string;
        problems_encountered: string;
        learnings_acquired: string;
        total_hours_worked: number;
        submission_type: 'form' | 'document' | 'both';
        document_url?: string | null;
        document_name?: string | null;
        document_type?: string | null;
        document_size?: number | null;
      } = {
        ...formData,
        submission_type: submissionType,
      };

      console.log('Resubmit form: Prepared update data:', updateData);

      // If there's a new file to upload, handle it
        if (uploadedFile) {
          setUploadStatus('uploading');
          try {
            const documentUrl = await uploadFile(uploadedFile);
            updateData.document_url = documentUrl;
            updateData.document_name = uploadedFile.name;
            updateData.document_type = uploadedFile.type;
            updateData.document_size = uploadedFile.size;
            setUploadStatus('success');
          } catch (uploadError) {
            setUploadStatus('error');
            console.error('File upload failed:', uploadError);
            toast.error('File upload failed. Please try again or submit without the file.');
            return; // Stop submission if file upload fails
          }
        } else if (!existingDocument && report?.document_url) {
          // If existing document was removed, clear document fields
          updateData.document_url = null;
          updateData.document_name = null;
          updateData.document_type = null;
          updateData.document_size = null;
        }
      
      const response = await fetch(`/api/student/reports/${reportId}/resubmit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to resubmit report');
      }

      toast.success('Weekly report resubmitted successfully!');
      router.push('/student/reports');
    } catch (error) {
      console.error('Error resubmitting report:', error);
      toast.error(`Error resubmitting report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/student/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Report not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/student/reports">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resubmit Weekly Report
          </CardTitle>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-1" />
              Week of {new Date(report.week_starting).toLocaleDateString()} - {new Date(report.week_ending).toLocaleDateString()}
            </p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800`}>
              <AlertCircle className="h-3 w-3 mr-1" />
              Rejected
            </span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Report Rejected</h4>
                <p className="text-yellow-700 text-sm">
                  Please review the supervisor comments below and make the necessary corrections before resubmitting.
                </p>
              </div>
            </div>
          </div>
          {report.supervisor_comments && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-red-800 mb-2">Supervisor Comments:</h4>
              <p className="text-red-700">{report.supervisor_comments}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tasks_completed">Tasks Completed</Label>
              <Textarea
                id="tasks_completed"
                value={formData.tasks_completed}
                onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
                placeholder="Describe the tasks you completed this week..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problems_encountered">Problems Encountered</Label>
              <Textarea
                id="problems_encountered"
                value={formData.problems_encountered}
                onChange={(e) => setFormData({ ...formData, problems_encountered: e.target.value })}
                placeholder="Describe any problems or challenges you encountered..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learnings_acquired">Learnings Acquired</Label>
              <Textarea
                id="learnings_acquired"
                value={formData.learnings_acquired}
                onChange={(e) => setFormData({ ...formData, learnings_acquired: e.target.value })}
                placeholder="Describe what you learned this week..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_hours_worked">Total Hours Worked</Label>
              <Input
                id="total_hours_worked"
                type="number"
                value={formData.total_hours_worked}
                onChange={(e) => setFormData({ ...formData, total_hours_worked: parseInt(e.target.value) || 0 })}
                placeholder="Enter total hours worked this week"
                min="1"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Submission Type</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="submissionType"
                    value="form"
                    checked={submissionType === 'form'}
                    onChange={(e) => setSubmissionType(e.target.value as 'form' | 'document' | 'both')}
                    className="form-radio"
                  />
                  <span>Form Only</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="submissionType"
                    value="document"
                    checked={submissionType === 'document'}
                    onChange={(e) => setSubmissionType(e.target.value as 'form' | 'document' | 'both')}
                    className="form-radio"
                  />
                  <span>Document Only</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="submissionType"
                    value="both"
                    checked={submissionType === 'both'}
                    onChange={(e) => setSubmissionType(e.target.value as 'form' | 'document' | 'both')}
                    className="form-radio"
                  />
                  <span>Both Form and Document</span>
                </label>
              </div>
            </div>

            {(submissionType === 'document' || submissionType === 'both') && (
              <div className="space-y-4">
                <Label>Document Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".doc,.docx,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {existingDocument && !documentRemoved ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <File className="h-8 w-8 text-gray-400" />
                        <span className="text-sm font-medium">{existingDocument.name}</span>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handlePreviewClick}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveDocument}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <File className="h-8 w-8 text-green-500" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Word documents, PDFs, or text files up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                
                {uploadStatus === 'uploading' && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading file...</span>
                  </div>
                )}
                
                {uploadStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">File uploaded successfully</span>
                  </div>
                )}
                
                {uploadStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">File upload failed</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link href="/student/reports">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resubmitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Resubmit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Document Preview</h3>
              <Button variant="ghost" size="sm" onClick={handleClosePreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 max-h-80 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}