'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

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

interface ClockButtonProps {
  studentId: string;
  session: 1 | 2;
  isActive: boolean;
  hasRecord: boolean;
  timeStart?: string;
  timeEnd?: string;
  totalHours?: number;
}

export function ClockButton({ 
  session, 
  isActive, 
  hasRecord,
  timeStart,
  timeEnd,
  totalHours
}: ClockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/student/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          // Optional: Add location data here if needed
        }),
      });

      if (response.ok) {
        router.refresh(); // Refresh the page to update data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to clock in');
      }
    } catch {
      alert('Failed to clock in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/student/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
        }),
      });

      if (response.ok) {
        router.refresh(); // Refresh the page to update data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to clock out');
      }
    } catch {
      alert('Failed to clock out');
    } finally {
      setIsLoading(false);
    }
  };

  const sessionName = session === 1 ? 'Morning' : 'Afternoon';

  return (
    <div className="border rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2 sm:gap-0">
        <h3 className="font-semibold text-sm sm:text-base">{sessionName} Session</h3>
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
            onClick={handleClockOut} 
            variant="destructive" 
            size="sm"
            disabled={isLoading}
            className="w-full sm:w-auto h-10 text-sm"
          >
            {isLoading ? 'Processing...' : 'Clock Out'}
          </Button>
        ) : (
          <Button 
            onClick={handleClockIn} 
            size="sm"
            disabled={isLoading}
            className="w-full sm:w-auto h-10 text-sm"
          >
            {isLoading ? 'Processing...' : 'Clock In'}
          </Button>
        )}
      </div>
    </div>
  );
}