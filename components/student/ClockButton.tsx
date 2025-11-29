'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { validateLocationWithAntiSpoofing } from "@/lib/antiSpoofingUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Helper function to format 12-hour time for display
function formatTimeForDisplay(timeStr: string): string {
  // If already in 12-hour format, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }

  // If in 24-hour format (HH:MM:SS), convert to 12-hour
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
}

// Helper function to format session time (HH:MM) to 12-hour format
function formatSessionTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface ClockButtonProps {
  session: 1 | 2;
  isActive: boolean;
  hasRecord: boolean;
  timeStart?: string;
  timeEnd?: string;
  totalHours?: number;
  sessionStartTime: string;
  sessionEndTime: string;
  isWorkingDay: boolean;
}

export function ClockButton({
  session,
  isActive,
  hasRecord,
  timeStart,
  timeEnd,
  totalHours,
  sessionStartTime,
  sessionEndTime,
  isWorkingDay
}: ClockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState<'in' | 'out'>('in');
  const router = useRouter();

  const handleClick = (type: 'in' | 'out') => {
    setActionType(type);
    setRemarks(""); // Reset remarks
    setIsDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    setIsLoading(true);
    try {
      if (actionType === 'in') {
        await executeClockIn();
      } else {
        await executeClockOut();
      }
      setIsDialogOpen(false);
    } catch {
      // Error is handled in execute functions
    } finally {
      setIsLoading(false);
    }
  };

  const executeClockIn = async () => {
    try {
      // Get current location - required for clock-in
      if (!navigator.geolocation) {
        throw new Error('🌐 Browser Location Support Required\n\nYour browser does not support location services. Please update your browser or use a different device that supports GPS/location services to clock in.');
      }

      let locationData;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        // Enhanced anti-spoofing validation (client-side)
        const antiSpoofingCheck = validateLocationWithAntiSpoofing(position);

        if (!antiSpoofingCheck.isValid) {
          throw new Error(`🚨 Location Security Check Failed\n\n${antiSpoofingCheck.message}\n\nDetails: ${antiSpoofingCheck.spoofingIndicators.join(', ')}`);
        }

        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Current location',
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
      } catch (error) {
        // Re-throw anti-spoofing errors as-is, otherwise show generic message
        if (error instanceof Error && error.message?.includes('Location Security Check Failed')) {
          throw error;
        }
        throw new Error('📍 Location Access Required\n\nTo clock in, you must share your location. This helps verify you are physically present at the company. Please allow location access and try again.');
      }

      const response = await fetch('/api/student/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          location: locationData,
          remarks: remarks.trim() || null, // Send remarks
        }),
      });

      if (response.ok) {
        toast.success(session === 1 ? 'Morning session clocked in successfully!' : 'Afternoon session clocked in successfully!');
        router.refresh(); // Refresh the page to update data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to clock in');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock in';
      toast.error(errorMessage);
      throw error;
    }
  };

  const executeClockOut = async () => {
    try {
      const response = await fetch('/api/student/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          remarks: remarks.trim() || null, // Send remarks
        }),
      });

      if (response.ok) {
        toast.success(session === 1 ? 'Morning session clocked out successfully!' : 'Afternoon session clocked out successfully!');
        router.refresh(); // Refresh the page to update data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to clock out');
      }
    } catch {
      toast.error('Failed to clock out');
    }
  };

  const sessionName = session === 1 ? 'Morning' : 'Afternoon';

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm {actionType === 'in' ? 'Clock In' : 'Clock Out'}</DialogTitle>
            <DialogDescription>
              {actionType === 'in'
                ? `You are about to clock in for the ${sessionName} session.`
                : `You are about to clock out for the ${sessionName} session.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="E.g., Late due to traffic, Early dismissal, etc."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2 sm:gap-0">
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{sessionName} Session</h3>
            <p className="text-xs text-gray-500">
              {formatSessionTime(sessionStartTime)} - {formatSessionTime(sessionEndTime)}
            </p>
          </div>
          {hasRecord && (
            <Badge variant={isActive ? "destructive" : "default"} className="text-xs sm:text-sm">
              {isActive ? "Active" : "Completed"}
            </Badge>
          )}
        </div>

        {hasRecord ? (
          <div className="space-y-1 mb-3">
            <p className="text-xs sm:text-sm text-gray-600">
              Start: {timeStart ? formatTimeForDisplay(timeStart) : 'N/A'}
            </p>
            {timeEnd && (
              <p className="text-xs sm:text-sm text-gray-600">
                End: {formatTimeForDisplay(timeEnd)}
              </p>
            )}
            {totalHours && totalHours > 0 && (
              <p className="text-xs sm:text-sm font-medium">
                Duration: {totalHours} hours
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-gray-500 mb-3">No session recorded</p>
        )}

        <div className="mt-3">
          {isActive ? (
            <Button
              onClick={() => handleClick('out')}
              variant="destructive"
              size="sm"
              disabled={isLoading}
              className="w-full sm:w-auto h-10 text-sm"
            >
              {isLoading ? 'Processing...' : 'Clock Out'}
            </Button>
          ) : (
            <>
              {(() => {
                // If session is already completed (hasRecord is true but not active), don't show any button
                if (hasRecord) {
                  return null;
                }

                // Check if it's a working day
                if (!isWorkingDay) {
                  return (
                    <Button
                      disabled
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto h-10 text-sm opacity-50 cursor-not-allowed"
                    >
                      Non-working Day
                    </Button>
                  );
                }

                // Check if it's too early for this session
                // Only apply this check if there's no record yet (initial clock in)
                const now = new Date();
                // Convert to Philippine time (UTC+8)
                const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
                const currentHour = philippineTime.getUTCHours();
                const currentMinute = philippineTime.getUTCMinutes();
                const currentTimeInMinutes = currentHour * 60 + currentMinute;

                const [startHour, startMinute] = sessionStartTime.split(':').map(Number);
                const startTimeInMinutes = startHour * 60 + startMinute;

                const [endHour, endMinute] = sessionEndTime.split(':').map(Number);
                const endTimeInMinutes = endHour * 60 + endMinute;

                if (currentTimeInMinutes < startTimeInMinutes) {
                  return (
                    <Button
                      disabled
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto h-10 text-sm opacity-50 cursor-not-allowed"
                    >
                      Available at {formatSessionTime(sessionStartTime)}
                    </Button>
                  );
                }

                if (currentTimeInMinutes > endTimeInMinutes) {
                  return (
                    <Button
                      disabled
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto h-10 text-sm opacity-50 cursor-not-allowed"
                    >
                      Session Ended
                    </Button>
                  );
                }

                return (
                  <Button
                    onClick={() => handleClick('in')}
                    size="sm"
                    disabled={isLoading}
                    className="w-full sm:w-auto h-10 text-sm"
                  >
                    {isLoading ? 'Processing...' : 'Clock In'}
                  </Button>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </>
  );
}