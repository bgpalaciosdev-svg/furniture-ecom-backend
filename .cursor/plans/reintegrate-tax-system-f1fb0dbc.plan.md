<!-- f1fb0dbc-4f12-4999-a4ae-d01d44190f9a 15f81e5a-9607-4e4f-af14-d210646399af -->

# Reintegrate Tax System (Option C: Frontend Calculates)

## Backend Changes (3 simple additions)

### 1. Add Tax Field to Order Model

**File**: `furniture-ecom-backend/src/db/models/order.model.ts`

After `delivery_cost` field (line 122-126), add:

```typescript
tax: {
  type: Number,
  required: false,
  default: 0
},
```

### 2. Update Order Type Interface

**File**: `furniture-ecom-backend/src/types/order.type.ts`

Add to `IOrder` interface after `delivery_cost`:

```typescript
tax?: number;
```

### 3. Accept Tax in Order Controller

**File**: `furniture-ecom-backend/src/controllers/order.controller.ts`

Line 118-121, add `tax` to destructuring:

```typescript
const {
  // ... existing fields
  delivery_cost,
  distance_miles,
  delivery_zone_validated,
  tax, // ADD THIS
} = req.body;
```

Line 173-177, add `tax` to Order creation:

```typescript
subtotal,
  delivery_cost,
  distance_miles,
  delivery_zone_validated,
  tax, // ADD THIS
  total;
```

No calculation needed - backend just stores what frontend sends.

## Frontend Changes

### 4. Update Type Interfaces

**Files**:

- `furniture-frontend/src/services/order.service.ts` - Add `tax?: number;` to OrderResponse.order
- `furniture-frontend/src/types/order-tracking.types.ts` - Add `tax?: number;` to BackendOrderResponse.order

### 5. Checkout Page - Calculate and Send Tax

**File**: `furniture-frontend/src/app/checkout/page.tsx`

Line 99-101, restore tax calculation:

```typescript
const tax = Math.round(subtotal * 0.08); // 8% tax
const total = subtotal + shipping + tax;
```

Line 329, add tax to orderData:

```typescript
delivery_cost: shippingCost,
distance_miles: distanceMiles,
delivery_zone_validated: true,
tax: tax,  // ADD THIS
```

Line 724, uncomment tax display in order summary.

### 6. Restore Tax Display in All Pages

**Files to update** - uncomment existing tax display code:

- `furniture-frontend/src/app/order-success/page.tsx` (lines 390-398)
- `furniture-frontend/src/app/orders/[id]/page.tsx` (lines 481-489, restore mock data)
- `furniture-frontend/src/components/OrderTracking/OrderSummary.tsx` (lines 45-53)

Add `tax?: number;` to OrderDetails interface in order-success page.

## Summary

Backend: Accept and store tax (no calculation)

Frontend: Calculate 8% tax, send to backend, display everywhere

Formula: `total = subtotal + delivery_cost + tax`

Total changes: ~3 backend lines + restore commented frontend code

### To-dos

- [ ] Add tax field to Order model schema
- [ ] Update IOrder interface with tax field
- [ ] Add tax calculation and update total formula in order controller
- [ ] Update order service interfaces to include tax
- [ ] Update order tracking types with tax field
- [ ] Restore tax calculation and display in checkout page
- [ ] Restore tax display in order success page
- [ ] Restore tax display in order details page
- [ ] Restore tax display in OrderSummary component
- [ ] Build backend and lint frontend to verify all changes
