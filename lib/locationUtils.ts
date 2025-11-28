/**
 * Calculate distance between two GPS coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert degrees to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if a location is within the allowed radius of a company location
 * @param studentLat - Student's latitude
 * @param studentLng - Student's longitude
 * @param companyLat - Company's latitude
 * @param companyLng - Company's longitude
 * @param radius - Allowed radius in meters (company radius + tolerance)
 * @returns Object with validation result and distance
 */
export function validateLocationProximity(
  studentLat: number,
  studentLng: number,
  companyLat: number,
  companyLng: number,
  radius: number
): { isValid: boolean; distance: number; message: string } {
  const distance = calculateDistance(studentLat, studentLng, companyLat, companyLng);
  const isValid = distance <= radius;

  return {
    isValid,
    distance,
    message: isValid
      ? `✅ Location verified - you're at the company (${distance.toFixed(0)}m away)`
      : `📍 Location Check Failed\n\nYou are ${distance.toFixed(0)} meters away from the company, but you need to be within ${radius} meters to clock in. Please move closer to the company location and try again.`,
  };
}