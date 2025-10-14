# Delivery Business Rules - Updated

## Delivery Zone

**We deliver to ALL addresses within Los Angeles, CA - no distance limit**

- ✅ **Los Angeles, CA addresses** - All accepted (regardless of distance from warehouse)
- ❌ **Non-LA addresses** - Rejected with error message

## Pricing Tiers

Delivery cost is based on distance from warehouse (Downtown LA: 34.0522, -118.2437):

| Distance Range | Delivery Cost |
|---------------|---------------|
| 0-5 miles     | $25           |
| 5-10 miles    | $50           |
| 10+ miles     | $100          |

## Free Delivery Rule

**Free delivery is granted when BOTH conditions are met:**

1. ✅ Order total ≥ $1,000
2. ✅ Distance < 10 miles

### Examples:

#### Free Delivery (✅ Eligible)
- 3 miles + $1,200 order = **FREE** (saves $25)
- 7 miles + $1,500 order = **FREE** (saves $50)
- 9.5 miles + $1,000 order = **FREE** (saves $50)

#### Paid Delivery (❌ Not Eligible)
- 3 miles + $800 order = **$25** (order too low)
- 7 miles + $900 order = **$50** (order too low)
- 11 miles + $2,000 order = **$100** (distance too far, even with high order)
- 15 miles + $5,000 order = **$100** (distance too far, even with very high order)
- 20 miles + $500 order = **$100** (distance far + order low)

## Summary Table

| Distance | Order Total | Delivery Cost | Free? | Reason |
|----------|-------------|---------------|-------|--------|
| 0-5 mi   | < $1,000    | $25           | ❌    | Order too low |
| 0-5 mi   | ≥ $1,000    | $0            | ✅    | Qualified |
| 5-10 mi  | < $1,000    | $50           | ❌    | Order too low |
| 5-10 mi  | ≥ $1,000    | $0            | ✅    | Qualified |
| 10+ mi   | < $1,000    | $100          | ❌    | Distance too far |
| 10+ mi   | ≥ $1,000    | $100          | ❌    | Distance too far |

## Key Points

1. **10 miles is the FREE DELIVERY THRESHOLD, not the delivery zone limit**
2. We deliver throughout ALL of Los Angeles (no maximum distance)
3. Beyond 10 miles, delivery is ALWAYS paid ($100), regardless of order amount
4. The $1,000 order threshold only applies to distances under 10 miles

## Configuration

All values are configurable via environment variables:

```bash
WAREHOUSE_LAT=34.0522              # Warehouse latitude (Downtown LA)
WAREHOUSE_LNG=-118.2437            # Warehouse longitude
FREE_DELIVERY_DISTANCE=10          # Distance threshold for free delivery eligibility (miles)
FREE_DELIVERY_THRESHOLD=1000       # Order amount threshold for free delivery ($)
NEAR_RANGE_DISTANCE=5              # Near range limit (miles)
NEAR_RANGE_COST=25                 # Cost for 0-5 miles ($)
MID_RANGE_DISTANCE=10              # Mid range limit (miles)
MID_RANGE_COST=50                  # Cost for 5-10 miles ($)
FAR_RANGE_COST=100                 # Cost for 10+ miles ($)
```

## API Behavior

### Validate Address Endpoint
- Returns `is_in_zone: true` for ALL LA addresses
- Returns actual distance in miles
- No distance-based rejection (only city/state validation)

### Calculate Cost Endpoint
- Accepts ALL LA addresses (any distance)
- Applies tiered pricing based on distance
- Applies free delivery rule only when distance < 10 miles AND order ≥ $1,000
- Returns detailed reason for the cost calculation

---

**Last Updated:** October 14, 2025  
**Version:** 2.0 (Updated with correct business rules)
