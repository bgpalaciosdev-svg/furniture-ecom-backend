/**
 * Distance Calculator using Haversine Formula
 * Calculates the great-circle distance between two points on Earth
 * given their latitude and longitude coordinates.
 */

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_MILES = 3959; // Earth's radius in miles
  
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLatRad = toRadians(lat2 - lat1);
  const deltaLonRad = toRadians(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in miles
  const distance = EARTH_RADIUS_MILES * c;
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Validates that coordinates are valid
 */
export function areValidCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}
