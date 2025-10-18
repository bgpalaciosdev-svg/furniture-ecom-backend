/**
 * Los Angeles ZIP Code Lookup Table
 * Maps LA ZIP codes to approximate coordinates for distance calculation
 * 
 * Source: LA ZIP code ranges (90001-90899)
 * Coordinates are approximate center points for each ZIP code area
 */

export interface ZipCodeCoordinates {
  zip: string;
  lat: number;
  lng: number;
  area?: string;
}

// Comprehensive LA ZIP code mapping
// Using real LA ZIP codes with approximate coordinates
export const LA_ZIP_CODES: ZipCodeCoordinates[] = [
  // Central LA
  { zip: "90001", lat: 33.9731, lng: -118.2479, area: "South LA" },
  { zip: "90002", lat: 33.9499, lng: -118.2468, area: "South LA" },
  { zip: "90003", lat: 33.9642, lng: -118.2728, area: "South LA" },
  { zip: "90004", lat: 34.0769, lng: -118.3092, area: "Mid-City" },
  { zip: "90005", lat: 34.0599, lng: -118.3089, area: "Mid-City" },
  { zip: "90006", lat: 34.0481, lng: -118.2929, area: "Koreatown" },
  { zip: "90007", lat: 34.0303, lng: -118.2843, area: "University Park" },
  { zip: "90008", lat: 34.0114, lng: -118.3414, area: "Crenshaw" },
  { zip: "90010", lat: 34.0617, lng: -118.2917, area: "Koreatown" },
  { zip: "90011", lat: 34.0073, lng: -118.2581, area: "South LA" },
  { zip: "90012", lat: 34.0653, lng: -118.2377, area: "Downtown LA" },
  { zip: "90013", lat: 34.0443, lng: -118.2468, area: "Downtown LA" },
  { zip: "90014", lat: 34.0440, lng: -118.2527, area: "Downtown LA" },
  { zip: "90015", lat: 34.0402, lng: -118.2661, area: "Downtown LA" },
  { zip: "90016", lat: 34.0302, lng: -118.3524, area: "West LA" },
  { zip: "90017", lat: 34.0540, lng: -118.2654, area: "Downtown LA" },
  { zip: "90018", lat: 34.0293, lng: -118.3088, area: "Mid-City" },
  { zip: "90019", lat: 34.0456, lng: -118.3420, area: "Mid-City" },
  { zip: "90020", lat: 34.0667, lng: -118.3094, area: "Koreatown" },
  { zip: "90021", lat: 34.0321, lng: -118.2380, area: "Fashion District" },
  { zip: "90022", lat: 34.0245, lng: -118.1551, area: "East LA" },
  { zip: "90023", lat: 34.0302, lng: -118.2071, area: "East LA" },
  { zip: "90024", lat: 34.0634, lng: -118.4410, area: "Westwood" },
  { zip: "90025", lat: 34.0500, lng: -118.4313, area: "West LA" },
  { zip: "90026", lat: 34.0774, lng: -118.2655, area: "Echo Park" },
  { zip: "90027", lat: 34.0986, lng: -118.2951, area: "Los Feliz" },
  { zip: "90028", lat: 34.1016, lng: -118.3287, area: "Hollywood" },
  { zip: "90029", lat: 34.0896, lng: -118.2870, area: "East Hollywood" },
  { zip: "90031", lat: 34.0840, lng: -118.2109, area: "Lincoln Heights" },
  { zip: "90032", lat: 34.0639, lng: -118.1803, area: "El Sereno" },
  { zip: "90033", lat: 34.0583, lng: -118.2098, area: "Boyle Heights" },
  { zip: "90034", lat: 34.0273, lng: -118.3998, area: "Palms" },
  { zip: "90035", lat: 34.0525, lng: -118.3773, area: "Mid-City" },
  { zip: "90036", lat: 34.0700, lng: -118.3548, area: "Fairfax" },
  { zip: "90037", lat: 34.0088, lng: -118.2852, area: "South LA" },
  { zip: "90038", lat: 34.0908, lng: -118.3270, area: "Hollywood" },
  { zip: "90039", lat: 34.1130, lng: -118.2626, area: "Silver Lake" },
  { zip: "90041", lat: 34.1387, lng: -118.2065, area: "Eagle Rock" },
  { zip: "90042", lat: 34.1134, lng: -118.1971, area: "Highland Park" },
  { zip: "90043", lat: 33.9891, lng: -118.3299, area: "Leimert Park" },
  { zip: "90044", lat: 33.9533, lng: -118.2923, area: "South LA" },
  { zip: "90045", lat: 33.9581, lng: -118.3889, area: "Westchester" },
  { zip: "90046", lat: 34.1013, lng: -118.3624, area: "Hollywood Hills" },
  { zip: "90047", lat: 33.9596, lng: -118.3093, area: "South LA" },
  { zip: "90048", lat: 34.0726, lng: -118.3747, area: "Fairfax" },
  { zip: "90049", lat: 34.0753, lng: -118.4751, area: "Brentwood" },
  { zip: "90056", lat: 33.9896, lng: -118.3586, area: "Ladera Heights" },
  { zip: "90057", lat: 34.0612, lng: -118.2734, area: "Westlake" },
  { zip: "90058", lat: 33.9879, lng: -118.2334, area: "Vernon" },
  { zip: "90059", lat: 33.9288, lng: -118.2434, area: "South LA" },
  { zip: "90061", lat: 33.9234, lng: -118.2797, area: "South LA" },
  { zip: "90062", lat: 33.9880, lng: -118.3086, area: "South LA" },
  { zip: "90063", lat: 34.0452, lng: -118.1827, area: "East LA" },
  { zip: "90064", lat: 34.0361, lng: -118.4236, area: "West LA" },
  { zip: "90065", lat: 34.1081, lng: -118.2281, area: "Glassell Park" },
  { zip: "90066", lat: 33.9959, lng: -118.4284, area: "Mar Vista" },
  { zip: "90067", lat: 34.0582, lng: -118.4169, area: "Century City" },
  { zip: "90068", lat: 34.1161, lng: -118.3293, area: "Hollywood Hills" },
  { zip: "90069", lat: 34.0906, lng: -118.3843, area: "West Hollywood" },
  { zip: "90071", lat: 34.0519, lng: -118.2514, area: "Downtown LA" },
  { zip: "90077", lat: 34.0996, lng: -118.4531, area: "Bel Air" },
  { zip: "90089", lat: 34.0224, lng: -118.2851, area: "USC Area" },
  { zip: "90094", lat: 33.9608, lng: -118.4170, area: "Playa Vista" },
  { zip: "90201", lat: 33.9731, lng: -118.1704, area: "Bell Gardens" },
  { zip: "90210", lat: 34.0901, lng: -118.4065, area: "Beverly Hills" },
  { zip: "90211", lat: 34.0679, lng: -118.3856, area: "Beverly Hills" },
  { zip: "90212", lat: 34.0661, lng: -118.4015, area: "Beverly Hills" },
  { zip: "90230", lat: 34.0150, lng: -118.3946, area: "Culver City" },
  { zip: "90232", lat: 34.0200, lng: -118.3918, area: "Culver City" },
  { zip: "90240", lat: 33.9701, lng: -118.1365, area: "Downey" },
  { zip: "90241", lat: 33.9401, lng: -118.1331, area: "Downey" },
  { zip: "90242", lat: 33.9668, lng: -118.1037, area: "Downey" },
  { zip: "90245", lat: 33.8958, lng: -118.3798, area: "El Segundo" },
  { zip: "90247", lat: 33.9017, lng: -118.3083, area: "Gardena" },
  { zip: "90248", lat: 33.8883, lng: -118.2919, area: "Gardena" },
  { zip: "90249", lat: 33.8819, lng: -118.3264, area: "Gardena" },
  { zip: "90250", lat: 33.8636, lng: -118.3209, area: "Hawthorne" },
  { zip: "90254", lat: 33.8458, lng: -118.3089, area: "Hermosa Beach" },
  { zip: "90255", lat: 34.0033, lng: -118.1668, area: "Huntington Park" },
  { zip: "90260", lat: 33.9172, lng: -118.3539, area: "Lawndale" },
  { zip: "90262", lat: 33.9172, lng: -118.1765, area: "Lynwood" },
  { zip: "90270", lat: 33.9364, lng: -118.1451, area: "Maywood" },
  { zip: "90272", lat: 34.0475, lng: -118.5001, area: "Pacific Palisades" },
  { zip: "90274", lat: 33.7447, lng: -118.3882, area: "Palos Verdes" },
  { zip: "90275", lat: 33.7669, lng: -118.3870, area: "Rancho Palos Verdes" },
  { zip: "90277", lat: 33.8408, lng: -118.3851, area: "Redondo Beach" },
  { zip: "90278", lat: 33.8747, lng: -118.3584, area: "Redondo Beach" },
  { zip: "90280", lat: 33.8898, lng: -118.2303, area: "South Gate" },
  { zip: "90290", lat: 34.0139, lng: -118.4601, area: "Topanga" },
  { zip: "90291", lat: 33.9844, lng: -118.4670, area: "Venice" },
  { zip: "90292", lat: 33.9984, lng: -118.4807, area: "Marina del Rey" },
  { zip: "90293", lat: 33.9528, lng: -118.4517, area: "Playa del Rey" },
  { zip: "90301", lat: 33.8958, lng: -118.3931, area: "Inglewood" },
  { zip: "90302", lat: 33.8797, lng: -118.3870, area: "Inglewood" },
  { zip: "90303", lat: 33.9022, lng: -118.3434, area: "Inglewood" },
  { zip: "90304", lat: 33.8570, lng: -118.3559, area: "Inglewood" },
  { zip: "90305", lat: 33.9597, lng: -118.3931, area: "Inglewood" },
  { zip: "90401", lat: 34.0195, lng: -118.4912, area: "Santa Monica" },
  { zip: "90402", lat: 34.0322, lng: -118.4965, area: "Santa Monica" },
  { zip: "90403", lat: 34.0278, lng: -118.4853, area: "Santa Monica" },
  { zip: "90404", lat: 34.0289, lng: -118.4701, area: "Santa Monica" },
  { zip: "90405", lat: 34.0053, lng: -118.4590, area: "Santa Monica" },
  
  // Far range examples (10+ miles from warehouse)
  { zip: "90710", lat: 33.8417, lng: -118.0697, area: "Long Beach Border" }, // ~15 miles
  { zip: "90731", lat: 33.7361, lng: -118.2925, area: "San Pedro" }, // ~18 miles
  { zip: "91331", lat: 34.2597, lng: -118.4619, area: "Pacoima" }, // ~16 miles
];

/**
 * Checks if a ZIP code is in the LA delivery zone
 */
export function isLAZipCode(zipCode: string): boolean {
  const zip = zipCode.trim();
  
  // First check if it's in our lookup table
  const found = LA_ZIP_CODES.find(z => z.zip === zip);
  if (found) return true;
  
  // Fallback: check if in primary LA range (90001-90899)
  const zipNum = parseInt(zip, 10);
  return zipNum >= 90001 && zipNum <= 90899;
}

/**
 * Gets coordinates for a LA ZIP code
 * Returns null if ZIP code not found
 */
export function getZipCodeCoordinates(zipCode: string): { lat: number; lng: number } | null {
  const zip = zipCode.trim();
  const found = LA_ZIP_CODES.find(z => z.zip === zip);
  
  if (found) {
    return { lat: found.lat, lng: found.lng };
  }
  
  // If not in our table but in valid LA range, use Downtown LA as approximation
  if (isLAZipCode(zip)) {
    return { lat: 34.0522, lng: -118.2437 }; // Downtown LA
  }
  
  return null;
}

/**
 * Validates if address is in Los Angeles
 */
export function isLosAngelesAddress(city: string, state: string, zipCode: string): boolean {
  const normalizedCity = city.trim().toLowerCase();
  const normalizedState = state.trim().toUpperCase();
  
  // City must be "Los Angeles" (case-insensitive, allowing variations)
  const validCities = ["los angeles", "la", "l.a.", "l.a"];
  const isCityValid = validCities.indexOf(normalizedCity) !== -1;
  
  // State must be CA
  const isStateValid = normalizedState === "CA";
  
  // ZIP must be in LA range
  const isZipValid = isLAZipCode(zipCode);
  
  return isCityValid && isStateValid && isZipValid;
}
