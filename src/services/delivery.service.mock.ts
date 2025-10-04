import {
  IDeliveryService,
  ValidateAddressRequest,
  ValidateAddressResponse,
  CalculateDeliveryCostRequest,
  CalculateDeliveryCostResponse,
  DeliveryErrorCode,
  DeliveryErrorResponse,
  Address,
} from '../types/delivery.types';

// Mock data: LA ZIP codes with realistic distances from Downtown LA (34.0522, -118.2437)
interface ZipCodeData {
  distance_miles: number;
  city: string;
  neighborhood?: string;
  is_valid: boolean;
}

const LA_ZIP_CODES: Record<string, ZipCodeData> = {
  // Downtown LA area (0-5 miles)
  '90012': { distance_miles: 1.1, city: 'Los Angeles', neighborhood: 'Downtown', is_valid: true },
  '90013': { distance_miles: 0.8, city: 'Los Angeles', neighborhood: 'Downtown', is_valid: true },
  '90014': { distance_miles: 0.5, city: 'Los Angeles', neighborhood: 'Downtown', is_valid: true },
  '90015': { distance_miles: 1.2, city: 'Los Angeles', neighborhood: 'Downtown', is_valid: true },
  '90017': { distance_miles: 1.8, city: 'Los Angeles', neighborhood: 'Westlake', is_valid: true },
  '90026': { distance_miles: 3.2, city: 'Los Angeles', neighborhood: 'Silver Lake', is_valid: true },
  '90027': { distance_miles: 4.1, city: 'Los Angeles', neighborhood: 'Los Feliz', is_valid: true },
  '90028': { distance_miles: 4.8, city: 'Los Angeles', neighborhood: 'Hollywood', is_valid: true },
  '90036': { distance_miles: 4.2, city: 'Los Angeles', neighborhood: 'Mid-City', is_valid: true },

  // Mid-range (5-10 miles) - Special free delivery zone for orders over $1000
  '90019': { distance_miles: 5.3, city: 'Los Angeles', neighborhood: 'Mid-City', is_valid: true },
  '90020': { distance_miles: 5.8, city: 'Los Angeles', neighborhood: 'Koreatown', is_valid: true },
  '90029': { distance_miles: 6.2, city: 'Los Angeles', neighborhood: 'East Hollywood', is_valid: true },
  '90038': { distance_miles: 6.8, city: 'Los Angeles', neighborhood: 'Hollywood', is_valid: true },
  '90046': { distance_miles: 7.1, city: 'Los Angeles', neighborhood: 'West Hollywood', is_valid: true },
  '90048': { distance_miles: 7.5, city: 'Los Angeles', neighborhood: 'Beverly Grove', is_valid: true },
  '90068': { distance_miles: 8.2, city: 'Los Angeles', neighborhood: 'Hollywood Hills', is_valid: true },
  '90069': { distance_miles: 8.9, city: 'Los Angeles', neighborhood: 'West Hollywood', is_valid: true },
  '90210': { distance_miles: 9.2, city: 'Beverly Hills', is_valid: true },
  '90211': { distance_miles: 9.8, city: 'Beverly Hills', is_valid: true },

  // Edge cases (close to 10 mile limit)
  '90024': { distance_miles: 9.9, city: 'Los Angeles', neighborhood: 'Westwood', is_valid: true },
  '90025': { distance_miles: 10.1, city: 'Los Angeles', neighborhood: 'West LA', is_valid: false }, // Just over limit
  '90401': { distance_miles: 15.2, city: 'Santa Monica', is_valid: false }, // Too far
  '90404': { distance_miles: 16.8, city: 'Santa Monica', is_valid: false }, // Too far

  // Non-LA areas (should be invalid)
  '94102': { distance_miles: 380.5, city: 'San Francisco', is_valid: false },
  '10001': { distance_miles: 2445.3, city: 'New York', is_valid: false },
  '60601': { distance_miles: 1745.8, city: 'Chicago', is_valid: false },
  '90501': { distance_miles: 22.1, city: 'Torrance', is_valid: false }, // LA County but too far
};

// Configuration constants matching backend
const CONFIG = {
  WAREHOUSE_LAT: 34.0522,
  WAREHOUSE_LNG: -118.2437,
  MAX_DELIVERY_DISTANCE_MILES: 10,
  FREE_DELIVERY_THRESHOLD: 1000,
  DELIVERY_COST_TIER_1: 25, // 0-5 miles
  DELIVERY_COST_TIER_2: 50, // 5-10 miles
  EXTENDED_RANGE_START: 5,
  API_DELAY_MIN: 100, // Minimum simulated delay (ms)
  API_DELAY_MAX: 800, // Maximum simulated delay (ms)
};

// Utility function to simulate API delay
const simulateDelay = (min: number = CONFIG.API_DELAY_MIN, max: number = CONFIG.API_DELAY_MAX): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Utility function to normalize address
const normalizeAddress = (address: Address): Address => ({
  ...address,
  city: address.city.trim(),
  state: address.state.trim().toUpperCase(),
  zip_code: address.zip_code.trim(),
  country: address.country || 'United States',
});

// Validate address format
const validateAddressFormat = (address: Address): { isValid: boolean; error?: string } => {
  if (!address.street?.trim()) {
    return { isValid: false, error: 'Street address is required' };
  }
  if (!address.city?.trim()) {
    return { isValid: false, error: 'City is required' };
  }
  if (!address.state?.trim()) {
    return { isValid: false, error: 'State is required' };
  }
  if (!address.zip_code?.trim()) {
    return { isValid: false, error: 'ZIP code is required' };
  }
  
  // Basic ZIP code format validation
  if (!/^\d{5}(-\d{4})?$/.test(address.zip_code.trim())) {
    return { isValid: false, error: 'Invalid ZIP code format' };
  }

  return { isValid: true };
};

// Check if address is in Los Angeles
const isLosAngelesAddress = (address: Address): boolean => {
  const normalizedCity = address.city.trim().toLowerCase();
  const validCities = ['los angeles', 'la', 'beverly hills']; // Include Beverly Hills as it's commonly delivered to
  
  return (
    address.state.trim().toUpperCase() === 'CA' &&
    validCities.some(city => normalizedCity === city)
  );
};

// Get ZIP code data or estimate distance for unknown ZIPs
const getZipCodeData = (zipCode: string): ZipCodeData => {
  const normalizedZip = zipCode.split('-')[0]; // Remove +4 extension if present
  
  if (LA_ZIP_CODES[normalizedZip]) {
    return LA_ZIP_CODES[normalizedZip];
  }

  // For unknown LA ZIP codes, estimate based on ZIP range
  const zipNum = parseInt(normalizedZip);
  
  if (zipNum >= 90001 && zipNum <= 90899) {
    // Likely LA area, estimate distance based on ZIP number
    const estimatedDistance = Math.min(
      Math.abs(zipNum - 90014) * 0.1 + Math.random() * 3, // Rough estimation
      15
    );
    
    return {
      distance_miles: Math.round(estimatedDistance * 10) / 10,
      city: 'Los Angeles',
      is_valid: estimatedDistance <= CONFIG.MAX_DELIVERY_DISTANCE_MILES,
    };
  }

  // Non-LA ZIP code
  return {
    distance_miles: 999,
    city: 'Unknown',
    is_valid: false,
  };
};

// Calculate delivery cost based on distance and order total
const calculateDeliveryCost = (
  distanceMiles: number,
  orderTotal: number
): { cost: number; isFree: boolean; reason: string; tier?: string } => {
  
  if (distanceMiles > CONFIG.MAX_DELIVERY_DISTANCE_MILES) {
    throw new Error('OUT_OF_DELIVERY_ZONE');
  }

  let baseCost = 0;
  let tier = '';
  
  // Determine base cost and tier
  if (distanceMiles <= CONFIG.EXTENDED_RANGE_START) {
    baseCost = CONFIG.DELIVERY_COST_TIER_1;
    tier = '0-5 miles';
  } else {
    baseCost = CONFIG.DELIVERY_COST_TIER_2;
    tier = '5-10 miles';
  }

  // Apply free delivery rules
  const qualifiesForFree = orderTotal >= CONFIG.FREE_DELIVERY_THRESHOLD;
  
  if (qualifiesForFree) {
    return {
      cost: 0,
      isFree: true,
      reason: distanceMiles <= CONFIG.EXTENDED_RANGE_START
        ? `Free delivery for orders over $${CONFIG.FREE_DELIVERY_THRESHOLD.toLocaleString()}`
        : `Free delivery for orders over $${CONFIG.FREE_DELIVERY_THRESHOLD.toLocaleString()} within 5-10 miles`,
      tier,
    };
  } else {
    const amountNeeded = CONFIG.FREE_DELIVERY_THRESHOLD - orderTotal;
    return {
      cost: baseCost,
      isFree: false,
      reason: `Delivery cost $${baseCost}. Add $${amountNeeded.toLocaleString()} more to qualify for free delivery${
        tier === '5-10 miles' ? ' (within 5-10 miles)' : ''
      }.`,
      tier,
    };
  }
};

// Mock Delivery Service Implementation
export class MockDeliveryService implements IDeliveryService {
  
  async validateAddress(request: ValidateAddressRequest): Promise<ValidateAddressResponse> {
    console.log('[MockDeliveryService] Validating address:', request.address);
    
    // Simulate API delay
    await simulateDelay();

    // Simulate occasional API failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('INTERNAL_SERVER_ERROR: Simulated API failure');
    }

    const normalizedAddress = normalizeAddress(request.address);
    
    // Validate address format
    const formatValidation = validateAddressFormat(normalizedAddress);
    if (!formatValidation.isValid) {
      return {
        address: normalizedAddress,
        is_valid: false,
        is_in_zone: false,
        distance_miles: 0,
        message: `Invalid address: ${formatValidation.error}`,
      };
    }

    // Check if address is in Los Angeles
    if (!isLosAngelesAddress(normalizedAddress)) {
      return {
        address: normalizedAddress,
        is_valid: true,
        is_in_zone: false,
        distance_miles: 0,
        message: 'Delivery is only available in Los Angeles, CA',
      };
    }

    // Get distance data for ZIP code
    const zipData = getZipCodeData(normalizedAddress.zip_code);
    
    if (!zipData.is_valid) {
      const message = zipData.distance_miles > CONFIG.MAX_DELIVERY_DISTANCE_MILES
        ? `Address is outside our delivery zone. We currently deliver within ${CONFIG.MAX_DELIVERY_DISTANCE_MILES} miles of Downtown LA.`
        : 'Delivery is only available in Los Angeles, CA';
        
      return {
        address: normalizedAddress,
        is_valid: true,
        is_in_zone: false,
        distance_miles: zipData.distance_miles > CONFIG.MAX_DELIVERY_DISTANCE_MILES 
          ? zipData.distance_miles 
          : 0,
        message,
      };
    }

    // Valid address in delivery zone
    return {
      address: normalizedAddress,
      is_valid: true,
      is_in_zone: true,
      distance_miles: zipData.distance_miles,
      message: `Address is valid and within delivery zone${
        zipData.neighborhood ? ` (${zipData.neighborhood})` : ''
      }`,
    };
  }

  async calculateDeliveryCost(request: CalculateDeliveryCostRequest): Promise<CalculateDeliveryCostResponse> {
    console.log('[MockDeliveryService] Calculating delivery cost:', request);
    
    // Simulate API delay
    await simulateDelay();

    // Simulate occasional API failures (3% chance)
    if (Math.random() < 0.03) {
      throw new Error('INTERNAL_SERVER_ERROR: Simulated API failure');
    }

    const normalizedAddress = normalizeAddress(request.address);
    
    // Validate required fields
    if (!request.order_total || request.order_total <= 0) {
      throw new Error('MISSING_REQUIRED_FIELDS: Order total is required and must be greater than 0');
    }

    // Validate address format
    const formatValidation = validateAddressFormat(normalizedAddress);
    if (!formatValidation.isValid) {
      throw new Error(`MISSING_REQUIRED_FIELDS: ${formatValidation.error}`);
    }

    // Check if address is in Los Angeles
    if (!isLosAngelesAddress(normalizedAddress)) {
      throw new Error('INVALID_ADDRESS: Delivery is only available in Los Angeles, CA');
    }

    // Get distance data
    const zipData = getZipCodeData(normalizedAddress.zip_code);
    
    if (!zipData.is_valid) {
      throw new Error('OUT_OF_DELIVERY_ZONE: Address is outside our delivery zone');
    }

    // Calculate delivery cost
    try {
      const costCalculation = calculateDeliveryCost(zipData.distance_miles, request.order_total);
      
      return {
        address: normalizedAddress,
        order_total: request.order_total,
        distance_miles: zipData.distance_miles,
        delivery_cost: costCalculation.cost,
        is_free: costCalculation.isFree,
        reason: costCalculation.reason,
        tier: costCalculation.tier,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'OUT_OF_DELIVERY_ZONE') {
        throw new Error('OUT_OF_DELIVERY_ZONE: Address is outside our delivery zone');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const mockDeliveryService = new MockDeliveryService();

// Export error handling utility for components
export const handleDeliveryError = (error: any): { code: DeliveryErrorCode; message: string } => {
  console.error('[MockDeliveryService] Error:', error);
  
  if (error instanceof Error) {
    const errorMessage = error.message;
    
    if (errorMessage.includes('INVALID_ADDRESS')) {
      return {
        code: DeliveryErrorCode.INVALID_ADDRESS,
        message: "We're sorry, we currently only deliver within Los Angeles. Check back soon as we expand!",
      };
    }
    
    if (errorMessage.includes('OUT_OF_DELIVERY_ZONE')) {
      return {
        code: DeliveryErrorCode.OUT_OF_DELIVERY_ZONE,
        message: "This address is outside our current delivery area (10 miles from Downtown LA)",
      };
    }
    
    if (errorMessage.includes('MISSING_REQUIRED_FIELDS')) {
      return {
        code: DeliveryErrorCode.MISSING_REQUIRED_FIELDS,
        message: "Please complete all required address fields",
      };
    }
    
    if (errorMessage.includes('INTERNAL_SERVER_ERROR')) {
      return {
        code: DeliveryErrorCode.INTERNAL_SERVER_ERROR,
        message: "Unable to validate delivery address. Please try again.",
      };
    }
  }
  
  return {
    code: DeliveryErrorCode.INTERNAL_SERVER_ERROR,
    message: "Something went wrong. Please try again.",
  };
};

// Export test utilities for development
export const MOCK_TEST_DATA = {
  VALID_LA_ADDRESSES: [
    { zip_code: '90012', expected_distance: 1.1, expected_tier: '0-5 miles' },
    { zip_code: '90028', expected_distance: 4.8, expected_tier: '0-5 miles' },
    { zip_code: '90020', expected_distance: 5.8, expected_tier: '5-10 miles' },
    { zip_code: '90210', expected_distance: 9.2, expected_tier: '5-10 miles' },
  ],
  INVALID_ADDRESSES: [
    { zip_code: '94102', city: 'San Francisco', state: 'CA' },
    { zip_code: '10001', city: 'New York', state: 'NY' },
    { zip_code: '90025', city: 'Los Angeles', state: 'CA' }, // Just over 10 miles
  ],
  ORDER_TOTALS: {
    LOW: 500,
    THRESHOLD: 1000,
    HIGH: 1500,
  },
} as const;
