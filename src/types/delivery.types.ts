// Delivery API Types
// Based on API Contract v1.0

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export interface ValidateAddressRequest {
  address: Address;
}

export interface ValidateAddressResponse {
  address: Address;
  is_valid: boolean;
  is_in_zone: boolean;
  distance_miles: number;
  message?: string;
}

export interface CalculateDeliveryCostRequest {
  address: Address;
  order_total: number; // In USD dollars (e.g., 1200 = $1,200.00)
}

export interface CalculateDeliveryCostResponse {
  address: Address;
  order_total: number;
  distance_miles: number;
  delivery_cost: number;
  is_free: boolean;
  reason: string;
  tier?: string;
}

export interface DeliveryErrorResponse {
  error: string;
  message: string;
}

// Error codes from API contract
export enum DeliveryErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  OUT_OF_DELIVERY_ZONE = 'OUT_OF_DELIVERY_ZONE',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  DISTANCE_CALCULATION_FAILED = 'DISTANCE_CALCULATION_FAILED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

// Service interface that both mock and real implementations will follow
export interface IDeliveryService {
  validateAddress(request: ValidateAddressRequest): Promise<ValidateAddressResponse>;
  calculateDeliveryCost(request: CalculateDeliveryCostRequest): Promise<CalculateDeliveryCostResponse>;
}
