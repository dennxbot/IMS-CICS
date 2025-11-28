/**
 * Enhanced location verification with anti-spoofing measures
 * Client-side utilities only - no server dependencies
 */

export interface LocationVerificationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  spoofingIndicators: string[];
  message: string;
  movementAnalysis?: {
    distanceFromPrevious: number;
    timeDifference: number;
    requiredSpeed: number;
    isPossible: boolean;
  };
}

/**
 * Detect potential GPS spoofing based on various indicators
 */
export function detectGPSSpoofing(position: GeolocationPosition): LocationVerificationResult {
  const indicators: string[] = [];
  
  // Check for suspicious timestamp (too old or too new)
  const now = Date.now();
  const positionAge = now - position.timestamp;
  if (positionAge > 30000 || positionAge < -5000) { // 30 seconds old or 5 seconds in future
    indicators.push('GPS timestamp appears manipulated');
  }

  // Check for suspicious accuracy (too perfect for real GPS)
  if (position.coords.accuracy && position.coords.accuracy < 1) {
    indicators.push('Unrealistically high GPS accuracy');
  }

  // Check for missing altitude when it should be available
  if (position.coords.altitude === null && position.coords.altitudeAccuracy !== null) {
    indicators.push('Inconsistent altitude data');
  }

  // Check for suspicious speed (impossible movement)
  if (position.coords.speed !== null && position.coords.speed > 50) { // > 180 km/h
    indicators.push('Impossible movement speed detected');
  }

  // Check for suspicious heading (should be null when speed is 0)
  if (position.coords.speed === 0 && position.coords.heading !== null) {
    indicators.push('Inconsistent heading data');
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let message = '✅ Location appears authentic';

  if (indicators.length >= 2) {
    confidence = 'low';
    message = '🚨 High risk of GPS spoofing detected';
  } else if (indicators.length === 1) {
    confidence = 'medium';
    message = '⚠️ Potential GPS spoofing indicators detected';
  }

  return {
    isValid: indicators.length === 0,
    confidence,
    spoofingIndicators: indicators,
    message
  };
}

/**
 * Validate location with enhanced anti-spoofing checks (client-side only)
 * For server-side validation with database lookup, use antiSpoofingServer.ts
 */
export function validateLocationWithAntiSpoofing(
  position: GeolocationPosition,
  previousPosition?: GeolocationPosition
): LocationVerificationResult {
  // Basic spoofing detection
  const basicCheck = detectGPSSpoofing(position);
  
  // If we have a previous position, check for impossible movement
  if (previousPosition) {
    const timeDiff = position.timestamp - previousPosition.timestamp;
    const distance = calculateDistance(
      previousPosition.coords.latitude,
      previousPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );
    
    // Calculate speed (m/s)
    const speed = distance / (timeDiff / 1000);
    
    // Convert to km/h for easier interpretation
    const speedKmh = speed * 3.6;
    
    // Store movement analysis
    basicCheck.movementAnalysis = {
      distanceFromPrevious: Math.round(distance),
      timeDifference: timeDiff,
      requiredSpeed: Math.round(speedKmh * 10) / 10,
      isPossible: speed <= 278 // Max 1000 km/h (278 m/s)
    };
    
    // Impossible speed check (> 1000 km/h or 278 m/s)
    if (speed > 278) {
      basicCheck.spoofingIndicators.push(`Impossible location jump: ${Math.round(distance)}m in ${Math.round(timeDiff/1000)}s (${Math.round(speedKmh)} km/h)`);
      basicCheck.isValid = false;
      basicCheck.confidence = 'low';
      basicCheck.message = '🚨 Impossible movement detected - location appears spoofed';
    } else if (speed > 83) { // > 300 km/h
      basicCheck.spoofingIndicators.push(`Suspicious movement: ${Math.round(distance)}m in ${Math.round(timeDiff/1000)}s (${Math.round(speedKmh)} km/h)`);
      basicCheck.confidence = 'medium';
      if (basicCheck.isValid) {
        basicCheck.message = '⚠️ Suspicious movement detected - please verify your location';
      }
    }
  }

  return basicCheck;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

