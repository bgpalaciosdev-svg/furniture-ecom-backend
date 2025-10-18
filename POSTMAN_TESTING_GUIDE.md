# Postman Testing Guide - Delivery API

## 📋 Table of Contents
1. [Setup](#setup)
2. [Import Collection & Environment](#import)
3. [Configure Environment](#configure)
4. [Test Scenarios](#test-scenarios)
5. [Expected Results](#expected-results)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup

### Prerequisites
- ✅ Postman installed (Desktop or Web)
- ✅ Server running on `http://localhost:8080`
- ✅ Environment variables configured (see `.env.example`)

### Start Your Server
```bash
# In your project root
npm run dev
```

**Expected output:**
```
Server running on port 8080
Connected to MongoDB
```

---

## 📥 Import Collection & Environment

### Step 1: Import Postman Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Furniture_eCommerce_API.postman_collection.json`
5. Click **Import**

### Step 2: Import Environment
1. Click **Import** again
2. Select `Furniture_eCommerce_Environment.postman_environment.json`
3. Click **Import**

### Step 3: Activate Environment
1. Click the **Environment dropdown** (top right)
2. Select **Furniture eCommerce Environment**
3. Verify `baseUrl` is set to `http://localhost:8080`

---

## ⚙️ Configure Environment

### Check Environment Variables
1. Click the **Eye icon** (👁️) next to environment dropdown
2. Verify these values:
   - `baseUrl`: `http://localhost:8080`
   - `authToken`: (will be set after login)

### If baseUrl is wrong:
1. Click **Furniture eCommerce Environment**
2. Click **Edit**
3. Update `INITIAL VALUE` and `CURRENT VALUE` to `http://localhost:8080`
4. Click **Save**

---

## 🧪 Test Scenarios

### Scenario 1: Validate Close Address (0-5 miles)
**What it tests:** Address validation for nearby location

**Steps:**
1. Expand **🚚 Delivery** folder
2. Click **Validate Address - Downtown LA (Valid)**
3. Review the request body:
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
4. Click **Send**

**Expected Response (200 OK):**
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
  "distance_miles": 2.3
}
```

**✅ Success criteria:**
- Status: `200 OK`
- `is_valid`: `true`
- `is_in_zone`: `true`
- `distance_miles`: ~2-3 miles

---

### Scenario 2: Validate Far Address (15+ miles)
**What it tests:** Address validation for distant LA location

**Steps:**
1. Click **Validate Address - Far Range (San Pedro)**
2. Review the request body:
   ```json
   {
     "address": {
       "street": "1000 Harbor Blvd",
       "city": "Los Angeles",
       "state": "CA",
       "zip_code": "90731"
     }
   }
   ```
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {
    "street": "1000 Harbor Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90731",
    "country": "United States"
  },
  "is_valid": true,
  "is_in_zone": true,
  "distance_miles": 18.2
}
```

**✅ Success criteria:**
- Status: `200 OK`
- `is_valid`: `true`
- `is_in_zone`: `true` (Still in LA!)
- `distance_miles`: ~18 miles

---

### Scenario 3: Validate Non-LA Address (Should Fail)
**What it tests:** Rejection of non-LA addresses

**Steps:**
1. Click **Validate Address - Outside LA (Invalid)**
2. Review the request body (San Francisco):
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
3. Click **Send**

**Expected Response (400 Bad Request):**
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

**✅ Success criteria:**
- Status: `400 Bad Request`
- `is_valid`: `true` (format is valid)
- `is_in_zone`: `false` (not in LA)
- Error message explains the issue

---

### Scenario 4: Free Delivery - Close + High Order ✅
**What it tests:** Free delivery for order ≥$1000 within 10 miles

**Steps:**
1. Click **Calculate Cost - Free Delivery (Close, High Order)**
2. Review the request:
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
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {...},
  "order_total": 1200,
  "distance_miles": 2.3,
  "delivery_cost": 0,
  "is_free": true,
  "reason": "Free delivery for orders over $1,000 within 10 miles",
  "tier": "0-5 miles"
}
```

**✅ Success criteria:**
- `delivery_cost`: `0`
- `is_free`: `true`
- `tier`: `"0-5 miles"`
- Reason explains free delivery

---

### Scenario 5: Paid Delivery - Close + Low Order 💵
**What it tests:** $25 delivery fee for <$1000 order within 5 miles

**Steps:**
1. Click **Calculate Cost - Paid Delivery ($25)**
2. Review the request:
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
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {...},
  "order_total": 500,
  "distance_miles": 2.3,
  "delivery_cost": 25,
  "is_free": false,
  "reason": "Delivery cost $25 for 0-5 miles distance. Add $500.00 more to qualify for free delivery.",
  "tier": "0-5 miles"
}
```

**✅ Success criteria:**
- `delivery_cost`: `25`
- `is_free`: `false`
- Helpful reason with amount needed

---

### Scenario 6: Free Delivery - Mid Range + High Order ✅
**What it tests:** Free delivery for order ≥$1000 at 5-10 miles

**Steps:**
1. Click **Calculate Cost - Free Far Range ($50 saved!)**
2. Review the request (Hollywood area):
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
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {...},
  "order_total": 1500,
  "distance_miles": 6.2,
  "delivery_cost": 0,
  "is_free": true,
  "reason": "Free delivery for orders over $1,000 within 10 miles",
  "tier": "5-10 miles"
}
```

**✅ Success criteria:**
- `delivery_cost`: `0` (saved $50!)
- `is_free`: `true`
- `tier`: `"5-10 miles"`

---

### Scenario 7: Paid Delivery - Mid Range + Low Order 💵
**What it tests:** $50 delivery fee for <$1000 order at 5-10 miles

**Steps:**
1. Click **Calculate Cost - Paid Far Range ($50)**
2. Review the request:
   ```json
   {
     "address": {
       "street": "456 Hollywood Blvd",
       "city": "Los Angeles",
       "state": "CA",
       "zip_code": "90028"
     },
     "order_total": 800
   }
   ```
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {...},
  "order_total": 800,
  "distance_miles": 6.2,
  "delivery_cost": 50,
  "is_free": false,
  "reason": "Delivery cost $50 for 5-10 miles distance. Add $200.00 more to qualify for free delivery.",
  "tier": "5-10 miles"
}
```

**✅ Success criteria:**
- `delivery_cost`: `50`
- `is_free`: `false`
- `tier`: `"5-10 miles"`

---

### Scenario 8: Paid Delivery - Far Range + High Order 💵
**What it tests:** $100 delivery fee for 10+ miles (even with high order!)

**Steps:**
1. Click **Calculate Cost - Far Range ($100) High Order**
2. Review the request (San Pedro - ~18 miles):
   ```json
   {
     "address": {
       "street": "1000 Harbor Blvd",
       "city": "Los Angeles",
       "state": "CA",
       "zip_code": "90731"
     },
     "order_total": 2000
   }
   ```
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {...},
  "order_total": 2000,
  "distance_miles": 18.2,
  "delivery_cost": 100,
  "is_free": false,
  "reason": "Delivery cost $100 for 10+ miles distance within Los Angeles.",
  "tier": "10+ miles"
}
```

**✅ Success criteria:**
- `delivery_cost`: `100`
- `is_free`: `false` (NO free delivery beyond 10 miles!)
- `tier`: `"10+ miles"`
- Even $2000 order doesn't get free delivery

---

### Scenario 9: Paid Delivery - Far Range + Low Order 💵
**What it tests:** $100 delivery fee for 10+ miles with low order

**Steps:**
1. Click **Calculate Cost - Far Range ($100) Low Order**
2. Review the request (Pacoima - ~16 miles):
   ```json
   {
     "address": {
       "street": "8500 Van Nuys Blvd",
       "city": "Los Angeles",
       "state": "CA",
       "zip_code": "91331"
     },
     "order_total": 600
   }
   ```
3. Click **Send**

**Expected Response (200 OK):**
```json
{
  "address": {...},
  "order_total": 600,
  "distance_miles": 16.5,
  "delivery_cost": 100,
  "is_free": false,
  "reason": "Delivery cost $100 for 10+ miles distance within Los Angeles.",
  "tier": "10+ miles"
}
```

**✅ Success criteria:**
- `delivery_cost`: `100`
- `is_free`: `false`
- `tier`: `"10+ miles"`

---

### Scenario 10: Error - Outside LA
**What it tests:** Proper error handling for non-LA addresses

**Steps:**
1. Click **Calculate Cost - Error (Outside Zone)**
2. Click **Send**

**Expected Response (400 Bad Request):**
```json
{
  "error": "INVALID_ADDRESS",
  "message": "Delivery is only available in Los Angeles, CA"
}
```

**✅ Success criteria:**
- Status: `400 Bad Request`
- Clear error code and message

---

## 📊 Expected Results Summary

| Test | Distance | Order | Expected Cost | Free? |
|------|----------|-------|---------------|-------|
| 1. Validate Close | 2.3 mi | N/A | N/A | Valid ✅ |
| 2. Validate Far | 18 mi | N/A | N/A | Valid ✅ |
| 3. Validate Non-LA | N/A | N/A | N/A | Invalid ❌ |
| 4. Close + High | 2.3 mi | $1200 | $0 | ✅ FREE |
| 5. Close + Low | 2.3 mi | $500 | $25 | ❌ Paid |
| 6. Mid + High | 6.2 mi | $1500 | $0 | ✅ FREE |
| 7. Mid + Low | 6.2 mi | $800 | $50 | ❌ Paid |
| 8. Far + High | 18 mi | $2000 | $100 | ❌ Paid |
| 9. Far + Low | 16 mi | $600 | $100 | ❌ Paid |
| 10. Non-LA | N/A | $1200 | Error | ❌ Error |

---

## 🐛 Troubleshooting

### Issue: "Could not send request"
**Cause:** Server not running  
**Solution:**
```bash
npm run dev
```

### Issue: "404 Not Found"
**Cause:** Wrong base URL  
**Solution:**
1. Check environment: Should be `http://localhost:8080`
2. Verify server is on port 8080
3. Check for `/api` prefix in URL

### Issue: "500 Internal Server Error"
**Cause:** Server error or missing dependencies  
**Solution:**
1. Check server console for errors
2. Verify all env variables are set
3. Check MongoDB connection

### Issue: Wrong delivery cost calculated
**Cause:** Environment variables not loaded  
**Solution:**
1. Copy `.env.example` to `.env`
2. Restart server: `npm run dev`
3. Verify console shows: "Server running on port 8080"

### Issue: "Cannot find module" errors
**Cause:** Missing dependencies  
**Solution:**
```bash
npm install
npm run dev
```

---

## 📝 Testing Checklist

Before declaring tests complete, verify:

- [ ] All 10 scenarios tested
- [ ] All responses have correct status codes
- [ ] Free delivery works correctly (< 10 miles + ≥ $1000)
- [ ] Paid delivery calculates correct amounts ($25/$50/$100)
- [ ] Far distances (10+ miles) never get free delivery
- [ ] Non-LA addresses properly rejected
- [ ] Distance calculations are reasonable
- [ ] Error messages are clear and helpful
- [ ] Console logs show distance calculations

---

## 🎯 Quick Test Sequence

**Run these 5 tests to verify core functionality:**

1. **Free Close** - Downtown LA, $1200 → Expect: $0 ✅
2. **Paid Close** - Downtown LA, $500 → Expect: $25 💵
3. **Free Mid** - Hollywood, $1500 → Expect: $0 ✅
4. **Paid Far** - San Pedro, $2000 → Expect: $100 💵
5. **Error** - San Francisco, $1200 → Expect: Error ❌

If all 5 pass, your implementation is working correctly!

---

## 🔗 Related Documentation

- **Business Rules:** `DELIVERY_BUSINESS_RULES.md`
- **Test Cases:** `DELIVERY_TEST_CASES.md`
- **Acceptance Criteria:** `DELIVERY_ACCEPTANCE_CRITERIA.md`
- **Quick Start:** `DELIVERY_QUICKSTART.md`

---

**Happy Testing! 🚀**
