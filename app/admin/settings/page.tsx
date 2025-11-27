'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';


const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [systemName, setSystemName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [minWeeklyHours, setMinWeeklyHours] = useState(40);
  const [maxDailyHours, setMaxDailyHours] = useState(8);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [attendanceVerificationRequired, setAttendanceVerificationRequired] = useState(true);
  const [restrictReportSubmission, setRestrictReportSubmission] = useState(false);
  const [reportSubmissionDays, setReportSubmissionDays] = useState<string[]>(['6']); // Default to Saturday

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/system-settings');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      const systemSettings = data.settings;
      
      setSystemName(systemSettings.name || '');
      setLogoUrl(systemSettings.logo_url || '');
      setPrimaryColor(systemSettings.primary_color || '#3B82F6');
      setSecondaryColor(systemSettings.secondary_color || '#10B981');
      setMinWeeklyHours(systemSettings.min_weekly_hours || 40);
      setMaxDailyHours(systemSettings.max_daily_hours || 8);
      setEmailNotifications(systemSettings.email_notifications || true);
      setAttendanceVerificationRequired(systemSettings.attendance_verification_required || true);
      setRestrictReportSubmission(systemSettings.restrict_report_submission || false);
      setReportSubmissionDays(systemSettings.report_submission_days ? systemSettings.report_submission_days.split(',') : ['6']);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      const payload = {
        name: systemName,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        min_weekly_hours: minWeeklyHours,
        max_daily_hours: maxDailyHours,
        email_notifications: emailNotifications,
        attendance_verification_required: attendanceVerificationRequired,
        restrict_report_submission: restrictReportSubmission,
        report_submission_days: reportSubmissionDays.join(',')
      };
      
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      await response.json();
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDayToggle = (dayNumber: string) => {
    setReportSubmissionDays(prev => {
      if (prev.includes(dayNumber)) {
        return prev.filter(day => day !== dayNumber);
      } else {
        return [...prev, dayNumber].sort();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your internship management system</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure your internship management system</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="Enter system name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Enter logo URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Submission Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="restrictReportSubmission">Restrict Report Submission</Label>
                <p className="text-sm text-gray-500">
                  Enable to restrict when students can submit reports
                </p>
              </div>
              <Switch
                id="restrictReportSubmission"
                checked={restrictReportSubmission}
                onCheckedChange={setRestrictReportSubmission}
              />
            </div>

            {restrictReportSubmission && (
              <div className="space-y-4 border-l-2 border-blue-500 pl-4">
                <Label>Allowed Submission Days</Label>
                <p className="text-sm text-gray-500">
                  Select the days when students can submit reports
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {dayNames.map((dayName, index) => {
                    const dayNumber = (index + 1).toString();
                    return (
                      <div key={dayNumber} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${dayNumber}`}
                          checked={reportSubmissionDays.includes(dayNumber)}
                          onCheckedChange={() => handleDayToggle(dayNumber)}
                        />
                        <Label htmlFor={`day-${dayNumber}`} className="text-sm">
                          {dayName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {reportSubmissionDays.length === 0 && (
                  <p className="text-sm text-red-500">
                    Please select at least one day for report submission
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minWeeklyHours">Minimum Weekly Hours</Label>
              <Input
                id="minWeeklyHours"
                type="number"
                step="0.5"
                value={minWeeklyHours}
                onChange={(e) => setMinWeeklyHours(parseFloat(e.target.value) || 0)}
                placeholder="Enter minimum weekly hours"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxDailyHours">Maximum Daily Hours</Label>
              <Input
                id="maxDailyHours"
                type="number"
                step="0.5"
                value={maxDailyHours}
                onChange={(e) => setMaxDailyHours(parseFloat(e.target.value) || 0)}
                placeholder="Enter maximum daily hours"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailNotifications"
                checked={emailNotifications}
                onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
              />
              <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attendanceVerification"
                checked={attendanceVerificationRequired}
                onCheckedChange={(checked) => setAttendanceVerificationRequired(checked as boolean)}
              />
              <Label htmlFor="attendanceVerification">Require Attendance Verification</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={loadSettings}>Reset</Button>
          <Button onClick={handleSaveSettings} disabled={isSaving || (restrictReportSubmission && reportSubmissionDays.length === 0)}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}