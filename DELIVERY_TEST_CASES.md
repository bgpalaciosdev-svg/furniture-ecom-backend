# Delivery API Test Cases

This document contains all test cases for the Delivery API endpoints based on the API Contract v1.0.

## Test Environment

**Base URL:** `http://localhost:8080/api`  
**Authentication:** None required (public endpoints)

---

## 1. Validate Address Endpoint Tests

### Test Case 1.1: Valid LA Address - Close Range (Downtown LA)
**Endpoint:** `POST /delivery/validate-address`

**Request:**
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012"
  }
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012",
    "country": "United States"
  },
  "is_valid": true,
  "is_in_zone": true,
  "distance_miles": 2.3,
  "message": "Address is valid and within delivery zone"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `is_valid` is true
- ✅ `is_in_zone` is true
- ✅ `distance_miles` is between 0 and 5
- ✅ Contains success message

---

### Test Case 1.2: Valid LA Address - Far Range (Hollywood)
**Endpoint:** `POST /delivery/validate-address`

**Request:**
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028"
  }
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028",
    "country": "United States"
  },
  "is_valid": true,
  "is_in_zone": true,
  "distance_miles": 6.2,
  "message": "Address is valid and within delivery zone"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `is_valid` is true
- ✅ `is_in_zone` is true
- ✅ `distance_miles` is between 5 and 10

---

### Test Case 1.3: Invalid - Outside LA (San Francisco)
**Endpoint:** `POST /delivery/validate-address`

**Request:**
```json
{
  "address": {
    "street": "123 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102"
  }
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "address": {
    "street": "123 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "country": "United States"
  },
  "is_valid": true,
  "is_in_zone": false,
  "distance_miles": 0,
  "message": "Delivery is only available in Los Angeles, CA"
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ `is_valid` is true (format is valid)
- ✅ `is_in_zone` is false
- ✅ Contains appropriate error message

---

### Test Case 1.4: Invalid - Too Far (Beverly Hills)
**Endpoint:** `POST /delivery/validate-address`

**Request:**
```json
{
  "address": {
    "street": "9876 Wilshire Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90210"
  }
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "address": {
    "street": "9876 Wilshire Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90210",
    "country": "United States"
  },
  "is_valid": true,
  "is_in_zone": false,
  "distance_miles": 12.5,
  "message": "Address is outside our delivery zone. We currently only deliver within 10 miles of Los Angeles."
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ `distance_miles` > 10
- ✅ `is_in_zone` is false

---

### Test Case 1.5: Invalid - Missing Fields
**Endpoint:** `POST /delivery/validate-address`

**Request:**
```json
{
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "zip_code": ""
  }
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "zip_code": "",
    "country": "United States"
  },
  "is_valid": false,
  "is_in_zone": false,
  "distance_miles": 0,
  "message": "Invalid address: street, city, state, and zip_code are required"
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ `is_valid` is false
- ✅ Contains validation error message

---

## 2. Calculate Delivery Cost Endpoint Tests

### Test Case 2.1: Free Delivery - Close Range, High Order
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012"
  },
  "order_total": 1200
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012",
    "country": "United States"
  },
  "order_total": 1200,
  "distance_miles": 2.3,
  "delivery_cost": 0,
  "is_free": true,
  "reason": "Free delivery for orders over $1,000",
  "tier": "0-5 miles"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `delivery_cost` is 0
- ✅ `is_free` is true
- ✅ `tier` is "0-5 miles"

---

### Test Case 2.2: Paid Delivery - Close Range, Low Order
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012"
  },
  "order_total": 500
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012",
    "country": "United States"
  },
  "order_total": 500,
  "distance_miles": 2.3,
  "delivery_cost": 25,
  "is_free": false,
  "reason": "Delivery cost $25 for 0-5 miles distance. Add $500.00 more to qualify for free delivery.",
  "tier": "0-5 miles"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `delivery_cost` is 25
- ✅ `is_free` is false
- ✅ Shows amount needed for free delivery

---

### Test Case 2.3: Free Delivery - Far Range, High Order (Special Rule)
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028"
  },
  "order_total": 1500
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028",
    "country": "United States"
  },
  "order_total": 1500,
  "distance_miles": 7.5,
  "delivery_cost": 0,
  "is_free": true,
  "reason": "Free delivery for orders over $1,000 within 5-10 miles",
  "tier": "5-10 miles"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `delivery_cost` is 0
- ✅ `is_free` is true
- ✅ `tier` is "5-10 miles"
- ✅ **SPECIAL RULE: Free for orders over $1000 even in far range**

---

### Test Case 2.4: Paid Delivery - Far Range, Low Order
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028"
  },
  "order_total": 800
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028",
    "country": "United States"
  },
  "order_total": 800,
  "distance_miles": 6.2,
  "delivery_cost": 50,
  "is_free": false,
  "reason": "Delivery cost $50 for 5-10 miles distance. Add $200.00 more to qualify for free delivery.",
  "tier": "5-10 miles"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `delivery_cost` is 50
- ✅ `is_free` is false
- ✅ `tier` is "5-10 miles"

---

### Test Case 2.5: Exact Threshold - $1000 Order
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "456 Broadway",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90015"
  },
  "order_total": 1000
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "456 Broadway",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90015",
    "country": "United States"
  },
  "order_total": 1000,
  "distance_miles": 1.5,
  "delivery_cost": 0,
  "is_free": true,
  "reason": "Free delivery for orders over $1,000",
  "tier": "0-5 miles"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `delivery_cost` is 0
- ✅ `is_free` is true
- ✅ **Threshold is inclusive (>= $1000)**

---

### Test Case 2.6: Just Under Threshold - $999.99 Order
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028"
  },
  "order_total": 999.99
}
```

**Expected Response:** `200 OK`
```json
{
  "address": {
    "street": "789 Sunset Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90028",
    "country": "United States"
  },
  "order_total": 999.99,
  "distance_miles": 6.2,
  "delivery_cost": 50,
  "is_free": false,
  "reason": "Delivery cost $50 for 5-10 miles distance. Add $0.01 more to qualify for free delivery.",
  "tier": "5-10 miles"
}
```

**Pass Criteria:** 
- ✅ Status code is 200
- ✅ `delivery_cost` is 50
- ✅ `is_free` is false
- ✅ Shows correct amount needed ($0.01)

---

### Test Case 2.7: Error - Outside Delivery Zone
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "123 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102"
  },
  "order_total": 1200
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "INVALID_ADDRESS",
  "message": "Delivery is only available in Los Angeles, CA"
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ Contains error code
- ✅ Contains user-friendly message

---

### Test Case 2.8: Error - Missing Order Total
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90012"
  }
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "MISSING_REQUIRED_FIELDS",
  "message": "Address and order total are required"
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ Error code is MISSING_REQUIRED_FIELDS

---

### Test Case 2.9: Error - Missing Address
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "order_total": 1200
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "MISSING_REQUIRED_FIELDS",
  "message": "Address and order total are required"
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ Error code is MISSING_REQUIRED_FIELDS

---

### Test Case 2.10: Edge Case - Too Far (>10 miles)
**Endpoint:** `POST /delivery/calculate-cost`

**Request:**
```json
{
  "address": {
    "street": "9876 Wilshire Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90210"
  },
  "order_total": 2000
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "OUT_OF_DELIVERY_ZONE",
  "message": "Address is outside our delivery zone. We currently only deliver within 10 miles of Los Angeles."
}
```

**Pass Criteria:** 
- ✅ Status code is 400
- ✅ Error code is OUT_OF_DELIVERY_ZONE
- ✅ Rejected even with high order total

---

## Summary

**Total Test Cases:** 19

**Validate Address:** 5 test cases
**Calculate Delivery Cost:** 14 test cases

**Coverage:**
- ✅ Valid addresses (close and far range)
- ✅ Invalid addresses (outside LA, too far)
- ✅ Missing/invalid fields
- ✅ Free delivery scenarios
- ✅ Paid delivery scenarios
- ✅ Threshold edge cases
- ✅ Error handling
- ✅ Special rules (free delivery 5-10 miles with high order)

---

## Running Tests

### Using curl:
```bash
# Test validate address
curl -X POST http://localhost:8080/api/delivery/validate-address \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "123 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90012"
    }
  }'

# Test calculate cost
curl -X POST http://localhost:8080/api/delivery/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "123 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90012"
    },
    "order_total": 1200
  }'
```

### Using Postman:
Import the updated `Furniture_eCommerce_API.postman_collection.json` file which includes all test cases.
