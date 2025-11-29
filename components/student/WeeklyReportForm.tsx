"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    FileText,
    Calendar as CalendarIcon,
    Send,
    Loader2,
    Upload,
    File as FileIcon,
    AlertCircle,
    CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface WeeklyReportFormProps {
    studentId: string;
    weekStarting: string;
    weekEnding: string;
}

const ALLOWED_FILE_TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/pdf', // .pdf
    'text/plain' // .txt
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function WeeklyReportForm({ studentId, weekStarting: initialWeekStarting, weekEnding: initialWeekEnding }: WeeklyReportFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [submissionType, setSubmissionType] = useState<'form' | 'document' | 'both'>('form');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    // Date selection state
    const [date, setDate] = useState<Date | undefined>(new Date(initialWeekStarting));
    const [currentWeekStarting, setCurrentWeekStarting] = useState(initialWeekStarting);
    const [currentWeekEnding, setCurrentWeekEnding] = useState(initialWeekEnding);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        tasks_completed: '',
        problems_encountered: '',
        learnings_acquired: '',
        next_week_plan: ''
    });

    // Update week range when date changes
    useEffect(() => {
        if (date) {
            const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate difference to get to Monday

            const start = new Date(date);
            start.setDate(date.getDate() + diffToMonday);

            const end = new Date(start);
            end.setDate(start.getDate() + 6); // Sunday is 6 days after Monday

            setCurrentWeekStarting(start.toISOString().split('T')[0]);
            setCurrentWeekEnding(end.toISOString().split('T')[0]);
        }
    }, [date]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            alert('Please upload a Word document (.doc, .docx), PDF, or text file.');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            alert('File size must be less than 10MB.');
            return;
        }

        setUploadedFile(file);
        setUploadStatus('idle');
    };

    const uploadFile = async (file: File, reportId: string): Promise<string> => {
        try {
            const fileName = `${studentId}/${reportId}/${file.name}`;
            console.log('Uploading file:', file.name, 'to path:', fileName);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', fileName);
            formData.append('bucket', 'weekly-reports');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Upload API error:', errorData);
                throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('Upload successful:', responseData);

            if (!responseData.data || !responseData.data.publicUrl) {
                throw new Error('Invalid response from upload API - no public URL');
            }

            return responseData.data.publicUrl;
        } catch (error) {
            console.error('Upload file error:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // First, submit the basic report data
            const reportData = {
                student_id: studentId,
                week_starting: currentWeekStarting,
                week_ending: currentWeekEnding,
                tasks_completed: formData.tasks_completed,
                problems_encountered: formData.problems_encountered,
                learnings_acquired: formData.learnings_acquired,
                next_week_plan: formData.next_week_plan,
                submission_type: submissionType,
                ...(uploadedFile && {
                    document_name: uploadedFile.name,
                    document_type: uploadedFile.type,
                    document_size: uploadedFile.size,
                })
            };

            const response = await fetch('/api/student/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit report');
            }

            const { data: report } = await response.json();

            // If there's a file to upload, do it now
            if (uploadedFile && report?.id) {
                setUploadStatus('uploading');
                try {
                    const documentUrl = await uploadFile(uploadedFile, report.id.toString());

                    // Update the report with the document URL
                    await fetch(`/api/student/reports/${report.id}/document`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            document_url: documentUrl,
                        }),
                    });

                    setUploadStatus('success');
                } catch (uploadError) {
                    setUploadStatus('error');
                    console.error('File upload failed:', uploadError);
                    // Continue with the report submission even if file upload fails
                    alert('Report submitted successfully, but file upload failed. You can try uploading the file again later.');
                }
            }

            router.push('/student/reports');
            router.refresh();

        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to submit report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isFormValid = () => {
        if (submissionType === 'form' || submissionType === 'both') {
            return formData.tasks_completed.trim() &&
                formData.learnings_acquired.trim() &&
                formData.next_week_plan.trim();
        }
        if (submissionType === 'document') {
            return uploadedFile !== null;
        }
        return false;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            <span>Week Period:</span>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[280px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <span className="text-sm text-muted-foreground">
                            ({format(new Date(currentWeekStarting), 'MMM d')} - {format(new Date(currentWeekEnding), 'MMM d, yyyy')})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Submission Type Selection */}
                    <div className="space-y-4">
                        <Label>How would you like to submit your report?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                type="button"
                                variant={submissionType === 'form' ? 'default' : 'outline'}
                                onClick={() => setSubmissionType('form')}
                                className="justify-start"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Text Form Only
                            </Button>
                            <Button
                                type="button"
                                variant={submissionType === 'document' ? 'default' : 'outline'}
                                onClick={() => setSubmissionType('document')}
                                className="justify-start"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Document Upload
                            </Button>
                            <Button
                                type="button"
                                variant={submissionType === 'both' ? 'default' : 'outline'}
                                onClick={() => setSubmissionType('both')}
                                className="justify-start"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Both Form + Document
                            </Button>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    {(submissionType === 'document' || submissionType === 'both') && (
                        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                            <Label>Upload Document</Label>
                            <div className="space-y-2">
                                <Input
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
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose File
                                </Button>

                                {uploadedFile && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <FileIcon className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm text-blue-800">
                                            Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </div>
                                )}

                                {uploadStatus === 'uploading' && (
                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                                        <span className="text-sm text-yellow-800">Uploading document...</span>
                                    </div>
                                )}

                                {uploadStatus === 'success' && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-800">Document uploaded successfully!</span>
                                    </div>
                                )}

                                {uploadStatus === 'error' && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-sm text-red-800">Document upload failed. Please try again.</span>
                                    </div>
                                )}

                                <p className="text-sm text-gray-500">
                                    Accepted formats: Word (.doc, .docx), PDF, Text (.txt). Max size: 10MB
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form Fields (shown for 'form' and 'both' submission types) */}
                    {(submissionType === 'form' || submissionType === 'both') && (
                        <>
                            <div>
                                <Label htmlFor="tasks_completed" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Tasks Completed This Week
                                </Label>
                                <Textarea
                                    id="tasks_completed"
                                    value={formData.tasks_completed}
                                    onChange={(e) => handleInputChange('tasks_completed', e.target.value)}
                                    placeholder="Describe the tasks you completed this week..."
                                    className="min-h-[100px] mt-2"
                                    required={submissionType === 'form'}
                                />
                            </div>

                            <div>
                                <Label htmlFor="problems_encountered">
                                    Problems/Challenges Encountered
                                </Label>
                                <Textarea
                                    id="problems_encountered"
                                    value={formData.problems_encountered}
                                    onChange={(e) => handleInputChange('problems_encountered', e.target.value)}
                                    placeholder="Describe any problems or challenges you faced..."
                                    className="min-h-[100px] mt-2"
                                />
                            </div>

                            <div>
                                <Label htmlFor="learnings_acquired">
                                    Learnings and Skills Acquired
                                </Label>
                                <Textarea
                                    id="learnings_acquired"
                                    value={formData.learnings_acquired}
                                    onChange={(e) => handleInputChange('learnings_acquired', e.target.value)}
                                    placeholder="What did you learn this week? What new skills did you develop?"
                                    className="min-h-[100px] mt-2"
                                    required={submissionType === 'form'}
                                />
                            </div>

                            <div>
                                <Label htmlFor="next_week_plan">
                                    Plans for Next Week
                                </Label>
                                <Textarea
                                    id="next_week_plan"
                                    value={formData.next_week_plan}
                                    onChange={(e) => handleInputChange('next_week_plan', e.target.value)}
                                    placeholder="What are your goals and plans for next week?"
                                    className="min-h-[100px] mt-2"
                                    required={submissionType === 'form'}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !isFormValid()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Report
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
