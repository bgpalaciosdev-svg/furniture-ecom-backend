<!-- d911b07c-3347-4e10-ad5d-80398deaf50c b64bb3cc-6729-41bf-a1d2-7615c0176c7d -->

# Dynamic Product Variations Implementation

## Overview

Transform the product variant system from hardcoded fields (size/color/material) to a flexible variation/attribute model where admins define the variation type and variant attributes.

## Backend Changes

### 1. Update Type Definitions (`furniture-ecom-backend/src/types/product.type.ts`)

- Add `variation?: string` field to `IProduct` interface
- Add `attribute?: string` field to `IProductVariant` interface
- Keep `color`, `material`, `size` fields for backwards compatibility but they won't be used in new products
- Add variation constants/enum:

```typescript
export const VARIATION_TYPES = [
  "Size",
  "Dimensions",
  "Weight",
  "Color",
  "Material",
  "Style",
] as const;
export type VariationType = (typeof VARIATION_TYPES)[number];
```

### 2. Update Database Model (`furniture-ecom-backend/src/db/models/product.model.ts`)

- Add `variation` field to ProductSchema (String, optional)
- Add `attribute` field to ProductVariantSchema (String, optional)
- Keep existing color/material/size fields for backwards compatibility

### 3. Update Controller (`furniture-ecom-backend/src/controllers/product.controller.ts`)

- In `createProduct`: Accept and save `variation` field from request body
- In `updateProduct`: Accept and save `variation` field from request body
- In `getProduct`: Include `variation` field in response
- In `getProducts`: Include `variation` field in response
- No changes needed to filtering logic (existing fields remain for backwards compatibility)

## Frontend Changes

### 4. Update Frontend Type Definitions (`furniture-frontend/src/types/product.types.ts`)

- Add `variation?: string` field to `Product` interface
- Add `attribute?: string` field to `ProductVariant` interface
- Add variation constants:

```typescript
export const VARIATION_TYPES = [
  "Size",
  "Dimensions",
  "Weight",
  "Color",
  "Material",
  "Style",
] as const;
export type VariationType = (typeof VARIATION_TYPES)[number];
```

- Update `CreateProductRequest` and `UpdateProductRequest` to include `variation` field
- Update `ProductDetails` interface - replace hardcoded size/color/finish variant structure with dynamic attribute-based structure

### 5. Update VariantManager Component (`furniture-frontend/src/components/VariantManager.tsx`)

- Add variation type selector dropdown (shows VARIATION_TYPES options) at the top of the component
- Add `selectedVariation` prop to component interface
- Add `onVariationChange` callback prop
- Replace `size` field input with `attribute` field input in VariantForm
- Comment out/remove `color` and `material` input fields completely from UI
- Update `VariantFormData` interface: replace `size` with `attribute`
- Update SKU generation to use `attribute` instead of size/color/material
- Update display of variants to show "Attribute" label instead of "Size"
- Disable "Add Variant" button if no variation type is selected

### 6. Update Admin Create Product Page (`furniture-frontend/src/app/admin/products/create/page.tsx`)

- Add `variation` field to `ProductFormData` interface
- Add variation type selector in Product Variants section (before VariantManager)
- Pass `variation` and `onVariationChange` to VariantManager component
- Update form validation to require `variation` field if variants exist
- Include `variation` in the productData payload sent to backend

### 7. Update Admin Edit Product Page (`furniture-frontend/src/app/admin/products/[id]/edit/page.tsx`)

- Add `variation` field to `ProductFormData` interface
- Load existing `variation` value from product data
- Add variation type selector in Product Variants section (before VariantManager)
- Pass `variation` and `onVariationChange` to VariantManager component
- Update form validation to require `variation` field if variants exist
- Include `variation` in the productData payload sent to backend

### 8. Update Product Details Page (`furniture-frontend/src/app/products/[id]/page.tsx`)

- Remove hardcoded size/color/finish variant structure
- Dynamically build variant selection UI based on product's `variation` field
- Update `selectedVariants` state to use dynamic attribute instead of size/color/finish
- Update variant selection logic to match based on `attribute` field instead of size
- Update image selection logic to use `attribute` matching
- Display variation label dynamically (e.g., if variation="Size", show "Size:" label)
- Update cart item structure to store selected attribute instead of size/color/finish

### 9. Update Product Service (`furniture-frontend/src/services/product.service.ts`)

- Ensure `variation` field is included in CreateProductRequest and UpdateProductRequest payloads
- No other changes needed (service already handles dynamic product structures)

## Implementation Notes

- Keep `color`, `material`, `size` fields in backend model for backwards compatibility with existing products
- New products will use `variation` and `attribute` fields
- Admin UI will only show the new attribute-based system
- Product details page will gracefully handle both old products (with size/color) and new products (with variation/attribute)

### To-dos

- [ ] Add variation field to IProduct and attribute field to IProductVariant in backend types
- [ ] Update Product and ProductVariant schemas to include variation and attribute fields
- [ ] Update product controller to handle variation field in create/update/get operations
- [ ] Add variation and attribute fields to frontend Product and ProductVariant types with constants
- [ ] Update VariantManager to support dynamic variation selection and attribute input instead of size
- [ ] Add variation selector to admin create product page in Product Variants section
- [ ] Add variation selector to admin edit product page in Product Variants section
- [ ] Update product details page to display dynamic variation and attributes instead of hardcoded size
