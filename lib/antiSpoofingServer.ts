/**
 * Server-side anti-spoofing utilities
 * This file contains server-only functions for enhanced location validation
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/server-admin";

/**
 * Server-side movement validation using database functions
 */
export async function detect_impossible_movement(
  studentId: string,
  newLatitude: number,
  newLongitude: number,
  newTimestamp: number,
  maxSpeedKmh: number = 200.0
): Promise<{
  is_possible: boolean;
  required_speed_kmh: number;
  time_diff_seconds: number;
  distance_meters: number;
}> {
  try {
    const supabase = createClient();
    
    // Call the PostgreSQL function to detect impossible movement
    const { data, error } = await supabase
      .rpc('detect_impossible_movement', {
        p_student_id: studentId,
        p_new_latitude: newLatitude,
        p_new_longitude: newLongitude,
        p_new_timestamp: newTimestamp,
        p_max_speed_kmh: maxSpeedKmh
      });

    if (error) {
      console.error('Error detecting impossible movement:', error);
      // If the function fails, assume movement is possible (fail open)
      return {
        is_possible: true,
        required_speed_kmh: 0,
        time_diff_seconds: 0,
        distance_meters: 0
      };
    }

    return {
      is_possible: data[0].is_possible,
      required_speed_kmh: parseFloat(data[0].required_speed_kmh),
      time_diff_seconds: parseInt(data[0].time_diff_seconds),
      distance_meters: parseFloat(data[0].distance_meters)
    };
  } catch (error) {
    console.error('Exception in detect_impossible_movement:', error);
    // Fail open - assume movement is possible if we can't validate
    return {
      is_possible: true,
      required_speed_kmh: 0,
      time_diff_seconds: 0,
      distance_meters: 0
    };
  }
}

/**
 * Store location history for future movement validation
 */
export async function storeLocationHistory(
  studentId: string,
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: number;
  },
  timesheetId?: number
): Promise<void> {
  try {
    // Use admin client to bypass RLS for server-side operations
    const supabase = createAdminClient();
    
    await supabase.from('student_location_history').insert({
      student_id: studentId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitude_accuracy: location.altitudeAccuracy,
      heading: location.heading,
      speed: location.speed,
      timestamp: location.timestamp,
      timesheet_id: timesheetId,
    });
  } catch (error) {
    console.error('Failed to store location history:', error);
    // Don't throw - this is a best-effort operation
  }
}