<!-- fd7bc951-5807-4359-9438-5a7e918934c5 58dff5b9-2911-4aae-8c20-27846a5376b0 -->

# Fix Order Details to Handle Variants Properly

## Problem

Order Details page shows parent product data instead of variant-specific data (wrong images, missing variant attributes). Orders don't store variant snapshots for historical accuracy.

## Solution

Store `variant_id` + snapshot fields in orders for historical accuracy, then use fallback pattern in Order Details.

## Implementation Steps

### 1. Backend - Update Order Model

**File:** `furniture-ecom-backend/src/db/models/order.model.ts`

Add variant snapshot fields to `OrderItemSchema`:

```typescript
const OrderItemSchema = new Schema({
  product_id: { type: String, required: true, ref: "Product" },
  variant_id: { type: String, required: false },
  // Add snapshot fields for historical accuracy
  variant_image: { type: String, required: false },
  variant_color: { type: String, required: false },
  variant_material: { type: String, required: false },
  variant_size: { type: String, required: false },
  variant_attribute: { type: String, required: false },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
});
```

### 2. Frontend - Update Cart Context

**File:** `furniture-frontend/src/contexts/CartContext.tsx`

Update `CartItem` interface to include `variant_id`:

```typescript
export interface CartItem {
  id: string; // product_id
  cartId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
  category: string;
  availability: "in-stock" | "out-of-stock" | "on-order";
  variant_id?: string; // Add this - MongoDB ObjectId of variant
  variants?: {
    size?: string;
    color?: string;
    finish?: string;
  };
}
```

### 3. Frontend - Update Product Page addToCart

**File:** `furniture-frontend/src/app/products/[id]/page.tsx`

Lines ~446-482: Modify addToCart call to find and include `variant_id`:

```typescript
// Find the matching variant to get its _id
const matchingVariant = productDetails?.rawVariants?.find((v) => {
  if (v.attribute) return v.attribute === selectedVariants.size;
  return v.size === selectedVariants.size;
});

addToCart(
  {
    id: displayProduct.id,
    cartId: `${displayProduct.id}-${selectedVariants.size}...`,
    variant_id: matchingVariant?._id, // Add this
    // ... rest of fields
  },
  quantity,
);
```

### 4. Frontend - Update Checkout to Send Variant Data

**File:** `furniture-frontend/src/app/checkout\page.tsx`

Lines ~326-331: Update orderData.items to include variant snapshot:

```typescript
items: cartItems.map((item) => ({
  product_id: item.id,
  variant_id: item.variant_id, // Add this
  variant_image: item.image, // Snapshot
  variant_color: item.variants?.color, // Snapshot
  variant_size: item.variants?.size, // Snapshot
  // variant_material and variant_attribute from item.variants
  quantity: item.quantity,
  price: item.price,
  name: item.name,
}));
```

### 5. Frontend - Update Order Details Page

**File:** `furniture-frontend/src/app/admin/orders/[id]/page.tsx`

Update `OrderItemDisplay` component (lines ~88-252) to use snapshot data with fallback:

**Primary approach:** Use snapshot data from order

- Display `variant_image` if available
- Show variant details from snapshots (color, material, size, attribute)
- Display product_id and variant_id

**Fallback approach:** Only fetch product if needed for additional context

- Use when snapshot missing
- Find variant by variant_id in product.variants array
- Use variant images and attributes

Key changes:

- Check for snapshot fields first before fetching product
- Use variant_image directly if available
- Only fetch product data when absolutely needed
- Show both product_id and variant_id for debugging

### 6. Backend Types - Update Order Types

**File:** `furniture-ecom-backend/src/types/order.type.ts`

Add variant snapshot fields to `IOrderItem` interface to match schema.

## Fallback Pattern Summary

```
Display Priority:
1. variant_image (snapshot) → guaranteed correct historical data
2. variant_id lookup in fetched product → current variant data
3. product images → fallback if variant deleted
4. placeholder image → last resort
```
