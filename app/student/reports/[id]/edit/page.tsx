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

export default function EditWeeklyReport() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    activities_completed: '',
    problems_encountered: '',
    learnings: '',
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
      setReport(data);
      setFormData({
        activities_completed: data.activities_completed || '',
        problems_encountered: data.problems_encountered || '',
        learnings: data.learnings || '',
        total_hours_worked: data.total_hours_worked || 0,
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

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('idle');
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `${report?.student_id}/${reportId}/${file.name}`);
      formData.append('bucket', 'weekly-reports');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const responseData = await response.json();
      if (!responseData.data?.publicUrl) {
        throw new Error('Invalid response from upload API');
      }

      return responseData.data.publicUrl;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.activities_completed.trim() || !formData.learnings.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.total_hours_worked <= 0) {
      alert('Please enter valid hours worked');
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare the update data
      const updateData: {
        activities_completed: string;
        problems_encountered: string;
        learnings: string;
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
          alert('Report updated successfully, but file upload failed. Please try uploading the file again.');
        }
      } else if (!existingDocument && report?.document_url) {
        // If existing document was removed, clear document fields
        updateData.document_url = null;
        updateData.document_name = null;
        updateData.document_type = null;
        updateData.document_size = null;
      }
      
      const response = await fetch(`/api/student/reports/${reportId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update report');
      }

      alert('Weekly report updated successfully!');
      router.push('/student/reports');
    } catch (error) {
      console.error('Error updating report:', error);
      alert(`Error updating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Check if report has been reviewed - prevent editing
  if (report.status === 'approved' || report.status === 'rejected') {
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
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {report.status === 'rejected' ? 'Report Rejected' : 'Report Approved'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-1" />
              Week of {new Date(report.week_starting).toLocaleDateString()} - {new Date(report.week_ending).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mb-4">
                {report.status === 'approved' ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                This report has been {report.status === 'approved' ? 'approved' : 'rejected'}
              </h3>
              
              {report.status === 'rejected' ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Your report was rejected. You can make corrections and resubmit it for review.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button 
                      onClick={() => router.push(`/student/reports/${reportId}/resubmit`)}
                      variant="default"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Resubmit Report
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  This report has been approved and cannot be edited.
                </p>
              )}
              
              {report.supervisor_comments && (
                <div className="bg-gray-50 rounded-lg p-4 mt-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Supervisor Comments:</h4>
                  <p className="text-gray-700">{report.supervisor_comments}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
            Edit Weekly Report
          </CardTitle>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-1" />
              Week of {new Date(report.week_starting).toLocaleDateString()} - {new Date(report.week_ending).toLocaleDateString()}
            </p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              report.status === 'approved' ? 'bg-green-100 text-green-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {report.status === 'pending' ? (
                <AlertCircle className="h-3 w-3 mr-1" />
              ) : report.status === 'approved' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="activities_completed">Activities Completed *</Label>
              <Textarea
                id="activities_completed"
                value={formData.activities_completed}
                onChange={(e) => setFormData({ ...formData, activities_completed: e.target.value })}
                placeholder="Describe the activities you completed this week..."
                rows={4}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="problems_encountered">Problems Encountered</Label>
              <Textarea
                id="problems_encountered"
                value={formData.problems_encountered}
                onChange={(e) => setFormData({ ...formData, problems_encountered: e.target.value })}
                placeholder="Describe any problems or challenges you encountered..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="learnings">Learnings *</Label>
              <Textarea
                id="learnings"
                value={formData.learnings}
                onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                placeholder="What did you learn this week?"
                rows={4}
                required
                className="mt-1"
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div>
                <Label>Submission Type</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={submissionType === 'form' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSubmissionType('form')}
                  >
                    Form Only
                  </Button>
                  <Button
                    type="button"
                    variant={submissionType === 'document' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSubmissionType('document')}
                  >
                    Document Only
                  </Button>
                  <Button
                    type="button"
                    variant={submissionType === 'both' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSubmissionType('both')}
                  >
                    Both
                  </Button>
                </div>
              </div>

              {(submissionType === 'document' || submissionType === 'both') && (
                <div className="space-y-3">
                  <Label>Document Upload</Label>
                  
                  {/* Existing Document Preview */}
                  {existingDocument && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <File className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium truncate">{existingDocument.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handlePreviewClick}
                            title="Preview document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveDocument}
                            title="Remove document"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Removed Indicator */}
                  {documentRemoved && !existingDocument && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Document has been removed. You can upload a new document below.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* New File Upload */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".doc,.docx,.pdf,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadStatus === 'uploading'}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadedFile ? 'Change File' : 'Upload Document'}
                    </Button>
                    
                    {uploadedFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <File className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        <span className="text-xs">({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    )}

                    {/* Upload Status */}
                    {uploadStatus === 'uploading' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                    {uploadStatus === 'success' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Upload successful!</span>
                      </div>
                    )}
                    {uploadStatus === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Upload failed. Please try again.</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Accepted formats: Word (.doc, .docx), PDF, Text (.txt). Max size: 10MB. PDF, Word docs, and text files can be previewed.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="total_hours_worked">Total Hours Worked *</Label>
              <Input
                id="total_hours_worked"
                type="number"
                value={formData.total_hours_worked}
                onChange={(e) => setFormData({ ...formData, total_hours_worked: parseInt(e.target.value) || 0 })}
                min="1"
                max="168"
                required
                className="mt-1"
              />
            </div>

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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {showPreview && existingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClosePreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              {existingDocument.type === 'application/pdf' ? (
                <iframe
                  src={existingDocument.url}
                  className="w-full h-[70vh] border-0"
                  title={existingDocument.name}
                />
              ) : existingDocument.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 existingDocument.type === 'application/msword' ? (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(existingDocument.url)}`}
                  className="w-full h-[70vh] border-0"
                  title={existingDocument.name}
                />
              ) : existingDocument.type.startsWith('text/') ? (
                <div className="w-full h-[70vh] overflow-auto border rounded p-4 bg-gray-50">
                  <pre className="whitespace-pre-wrap text-sm">
                    {previewContent || 'Loading text document...'}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    This document type cannot be previewed in the browser. Only PDF, Word documents, and text files are supported for preview.
                  </p>
                  <Button
                    onClick={() => window.open(existingDocument.url, '_blank')}
                    variant="outline"
                  >
                    Download Document
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-gray-600">{existingDocument.name}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(existingDocument.url, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Download
                </Button>
                <Button
                  onClick={handleClosePreview}
                  variant="default"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Toaster />
    </div>
  );
}