'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

// Function to immediately update theme colors without reload
const updateThemeImmediately = (primaryColor: string, secondaryColor: string) => {
  // Update primary color
  if (primaryColor) {
    const primaryHsl = hexToHsl(primaryColor);
    document.documentElement.style.setProperty('--primary-hue', primaryHsl.h.toString());
    document.documentElement.style.setProperty('--primary-saturation', `${primaryHsl.s}%`);
    document.documentElement.style.setProperty('--primary-lightness', `${primaryHsl.l}%`);
    
    const primaryForeground = primaryHsl.l > 50 ? '10%' : '98%';
    document.documentElement.style.setProperty('--primary-foreground-lightness', primaryForeground);
  }
  
  // Update secondary color
  if (secondaryColor) {
    const secondaryHsl = hexToHsl(secondaryColor);
    document.documentElement.style.setProperty('--secondary-hue', secondaryHsl.h.toString());
    document.documentElement.style.setProperty('--secondary-saturation', `${secondaryHsl.s}%`);
    document.documentElement.style.setProperty('--secondary-lightness', `${secondaryHsl.l}%`);
    
    const secondaryForeground = secondaryHsl.l > 50 ? '10%' : '98%';
    document.documentElement.style.setProperty('--secondary-foreground-lightness', secondaryForeground);
  }
  
  // Force browser to recalculate styles
    document.documentElement.style.display = 'none';
    void document.documentElement.offsetHeight; // Force reflow
    document.documentElement.style.display = '';
};

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): HSL {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 222.2, s: 47.4, l: 11.2 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let hue = 0;
  if (diff !== 0) {
    if (max === r) {
      hue = ((g - b) / diff) % 6;
    } else if (max === g) {
      hue = (b - r) / diff + 2;
    } else {
      hue = (r - g) / diff + 4;
    }
  }
  
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  const lightness = (max + min) / 2;
  
  if (diff === 0) return { h: hue, s: 0, l: lightness * 100 };
  
  const saturation = diff / (1 - Math.abs(2 * lightness - 1));
  
  return {
    h: hue,
    s: saturation * 100,
    l: lightness * 100
  };
}


const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper function to calculate duration between two times (HH:MM format)
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // Convert to total minutes
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Calculate duration in minutes
  let durationMinutes = endTotalMinutes - startTotalMinutes;
  
  // Handle cases where end time is on the next day (e.g., 23:00 to 01:00)
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60; // Add 24 hours
  }
  
  // Convert to hours with 0.5 hour precision
  const durationHours = durationMinutes / 60;
  return Math.round(durationHours * 2) / 2; // Round to nearest 0.5
}

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
  
  // Session time configuration
  const [morningCheckinTime, setMorningCheckinTime] = useState('07:45');
  const [morningCheckoutTime, setMorningCheckoutTime] = useState('11:45');
  const [morningDuration, setMorningDuration] = useState(4.0);
  const [afternoonCheckinTime, setAfternoonCheckinTime] = useState('12:45');
  const [afternoonCheckoutTime, setAfternoonCheckoutTime] = useState('16:45');
  const [afternoonDuration, setAfternoonDuration] = useState(4.0);

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
      
      // Load session time settings
      setMorningCheckinTime(systemSettings.morning_checkin_time || '07:45');
      setMorningCheckoutTime(systemSettings.morning_checkout_time || '11:45');
      setMorningDuration(systemSettings.morning_duration || 4.0);
      setAfternoonCheckinTime(systemSettings.afternoon_checkin_time || '12:45');
      setAfternoonCheckoutTime(systemSettings.afternoon_checkout_time || '16:45');
      setAfternoonDuration(systemSettings.afternoon_duration || 4.0);
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
        report_submission_days: reportSubmissionDays.join(','),
        morning_checkin_time: morningCheckinTime,
        morning_checkout_time: morningCheckoutTime,
        morning_duration: morningDuration,
        afternoon_checkin_time: afternoonCheckinTime,
        afternoon_checkout_time: afternoonCheckoutTime,
        afternoon_duration: afternoonDuration
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
      
      // Reload settings from server to ensure UI reflects latest changes
      await loadSettings();
      
      // Immediately update theme colors without page reload
      updateThemeImmediately(primaryColor, secondaryColor);
      
      // Dispatch event for any theme updater components
      window.dispatchEvent(new CustomEvent('theme-update', {
        detail: { primaryColor, secondaryColor }
      }));
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

            <div className="space-y-2">
              <Label>Theme Preview</Label>
              <div className="flex gap-2">
                <Button className="flex-1">Primary Button</Button>
                <Button variant="secondary" className="flex-1">Secondary Button</Button>
              </div>
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
            <CardTitle>Session Time Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🌅</span> Morning Session
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="morningCheckinTime">Check-in Time</Label>
                  <Input
                    id="morningCheckinTime"
                    type="time"
                    value={morningCheckinTime}
                    onChange={(e) => {
                      const newCheckinTime = e.target.value;
                      setMorningCheckinTime(newCheckinTime);
                      // Auto-calculate duration
                      const newDuration = calculateDuration(newCheckinTime, morningCheckoutTime);
                      setMorningDuration(newDuration);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morningCheckoutTime">Check-out Time</Label>
                  <Input
                    id="morningCheckoutTime"
                    type="time"
                    value={morningCheckoutTime}
                    onChange={(e) => {
                      const newCheckoutTime = e.target.value;
                      setMorningCheckoutTime(newCheckoutTime);
                      // Auto-calculate duration
                      const newDuration = calculateDuration(morningCheckinTime, newCheckoutTime);
                      setMorningDuration(newDuration);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morningDuration">Duration (hours)</Label>
                  <Input
                    id="morningDuration"
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={morningDuration}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🌞</span> Afternoon Session
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="afternoonCheckinTime">Check-in Time</Label>
                  <Input
                    id="afternoonCheckinTime"
                    type="time"
                    value={afternoonCheckinTime}
                    onChange={(e) => {
                      const newCheckinTime = e.target.value;
                      setAfternoonCheckinTime(newCheckinTime);
                      // Auto-calculate duration
                      const newDuration = calculateDuration(newCheckinTime, afternoonCheckoutTime);
                      setAfternoonDuration(newDuration);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="afternoonCheckoutTime">Check-out Time</Label>
                  <Input
                    id="afternoonCheckoutTime"
                    type="time"
                    value={afternoonCheckoutTime}
                    onChange={(e) => {
                      const newCheckoutTime = e.target.value;
                      setAfternoonCheckoutTime(newCheckoutTime);
                      // Auto-calculate duration
                      const newDuration = calculateDuration(afternoonCheckinTime, newCheckoutTime);
                      setAfternoonDuration(newDuration);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="afternoonDuration">Duration (hours)</Label>
                  <Input
                    id="afternoonDuration"
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={afternoonDuration}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium">Session Configuration:</p>
              <p>These settings define the official clock-in and clock-out times for student attendance. Students can only check in/out during the configured session times.</p>
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