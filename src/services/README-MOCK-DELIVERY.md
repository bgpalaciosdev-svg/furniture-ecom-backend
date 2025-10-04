# Mock Delivery Service Usage Guide

## Overview

The mock delivery service provides realistic simulation of the delivery validation and cost calculation APIs while you develop the frontend independently of backend development.

## Files Created

- `src/types/delivery.types.ts` - TypeScript interfaces matching API contract
- `src/services/delivery.service.mock.ts` - Mock implementation with realistic data
- `src/services/delivery.service.ts` - Main service that switches between mock/real

## Quick Start

### 1. Install (if needed)
No additional dependencies required - uses standard TypeScript/JavaScript.

### 2. Environment Setup
Add to your `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_DELIVERY=true
```

### 3. Basic Usage
```typescript
import DeliveryService from '@/services/delivery.service';

// Validate address
const validation = await DeliveryService.validateAddress({
  address: {
    street: "123 Main St",
    city: "Los Angeles", 
    state: "CA",
    zip_code: "90012"
  }
});

// Calculate delivery cost
const cost = await DeliveryService.calculateDeliveryCost({
  address: { /* same as above */ },
  order_total: 1200
});
```

## Test Data Available

### Valid LA Addresses (Will Work)
- `90012` - Downtown LA (1.1 miles) - Tier 1
- `90028` - Hollywood (4.8 miles) - Tier 1  
- `90020` - Koreatown (5.8 miles) - Tier 2, FREE if order ≥ $1000
- `90210` - Beverly Hills (9.2 miles) - Tier 2, FREE if order ≥ $1000

### Invalid Addresses (Will Fail)
- `94102` - San Francisco (wrong city)
- `10001` - New York (wrong state)
- `90025` - West LA (too far, >10 miles)

### Test Order Amounts
- `$500` - Below free delivery threshold
- `$1000` - Exactly at threshold (should be free)
- `$1500` - Above threshold (should be free)

## Realistic Features Included

### ✅ Business Logic
- Exact same pricing tiers as backend will use
- Free delivery rules for 5-10 mile zone
- ZIP code validation for LA area
- Distance calculations based on real LA geography

### ✅ Error Handling
- Invalid address formats
- Non-LA addresses  
- Addresses outside 10-mile radius
- Missing required fields
- Simulated API failures (5% chance)

### ✅ Performance Simulation
- Random API delays (100-800ms)
- Realistic response times
- Loading states for UI testing

### ✅ Developer Experience
- Console logging for debugging
- Test data constants exported
- Error handling utilities
- TypeScript support throughout

## Example Responses

### Valid Address Response
```json
{
  "address": {
    "street": "123 Main St",
    "city": "Los Angeles",
    "state": "CA", 
    "zip_code": "90012",
    "country": "United States"
  },
  "is_valid": true,
  "is_in_zone": true,
  "distance_miles": 1.1,
  "message": "Address is valid and within delivery zone (Downtown)"
}
```

### Cost Calculation Response (Free Delivery)
```json
{
  "address": { /* same as above */ },
  "order_total": 1200,
  "distance_miles": 7.5,
  "delivery_cost": 0,
  "is_free": true,
  "reason": "Free delivery for orders over $1,000 within 5-10 miles",
  "tier": "5-10 miles"
}
```

### Error Response
```json
{
  "error": "INVALID_ADDRESS",
  "message": "Delivery is only available in Los Angeles, CA"
}
```

## Error Handling in Components

```typescript
import DeliveryService, { handleDeliveryError } from '@/services/delivery.service';

try {
  const result = await DeliveryService.validateAddress(request);
  // Handle success
} catch (error) {
  const { code, message } = handleDeliveryError(error);
  // Show user-friendly message
  setErrorMessage(message);
}
```

## Switching to Real API

When backend is ready:

1. **Create real service file:**
   ```typescript
   // src/services/delivery.service.real.ts
   export class RealDeliveryService implements IDeliveryService {
     async validateAddress(request) {
       const response = await fetch('/api/delivery/validate-address', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(request)
       });
       return response.json();
     }
     // ... etc
   }
   ```

2. **Update main service:**
   ```typescript
   // src/services/delivery.service.ts
   import { realDeliveryService } from './delivery.service.real';
   
   // Replace mock with real service
   this.service = USE_MOCK_DELIVERY ? mockDeliveryService : realDeliveryService;
   ```

3. **Change environment variable:**
   ```
   NEXT_PUBLIC_USE_MOCK_DELIVERY=false
   ```

**Total time to switch: ~15 minutes**

## Testing Scenarios

Use these test cases to verify your UI handles all scenarios:

```typescript
import { MOCK_TEST_DATA } from '@/services/delivery.service';

// Test free delivery in 5-10 mile zone
const testFreeDelivery = {
  address: { 
    street: "123 Test St",
    city: "Los Angeles", 
    state: "CA", 
    zip_code: "90020" // 5.8 miles
  },
  order_total: 1200 // Above $1000 threshold
};
// Expected: delivery_cost = 0, is_free = true

// Test paid delivery in same zone
const testPaidDelivery = {
  ...testFreeDelivery,
  order_total: 800 // Below threshold
};
// Expected: delivery_cost = 50, is_free = false
```

## Benefits of This Approach

1. **Parallel Development** - Don't wait for backend
2. **Realistic Testing** - Same business logic as production
3. **Easy Integration** - Swap implementation in minutes
4. **Better UX** - Test all edge cases and error states
5. **Future Proof** - Keep mocks for testing and development

## Support

If you need additional test scenarios or mock data, the mock service can be easily extended by adding more ZIP codes to the `LA_ZIP_CODES` object or adjusting the business logic in the calculation functions.
