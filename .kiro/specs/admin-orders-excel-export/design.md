# Design Document

## Overview

This feature adds Excel export functionality to the admin orders page. The backend will provide a new API endpoint that generates an Excel file containing all order data using the ExcelJS library. The frontend will have an export button that triggers the download.

## Architecture

### Backend Components
- **New Route**: `/api/admin/orders/export` - GET endpoint for Excel export
- **Controller Method**: `exportOrdersToExcel` in admin controller
- **Service**: Excel generation logic using ExcelJS library
- **Dependencies**: ExcelJS npm package for Excel file generation

### Frontend Integration
- **Export Button**: Simple button in the admin orders table interface
- **Download Trigger**: Direct file download via browser

## Components and Interfaces

### Backend API Endpoint
```typescript
GET /api/admin/orders/export
Response: Excel file download (.xlsx)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### Excel File Structure
- **Filename**: `orders.xlsx`
- **Worksheet Name**: "Orders"
- **Columns**:
  - Order Number
  - Customer Email
  - Customer Phone
  - Status
  - Payment Method
  - Payment Status
  - Items Summary (product names and quantities)
  - Subtotal
  - Delivery Cost
  - Total
  - Shipping Address
  - Created Date
  - Updated Date

### Data Flow
1. Admin clicks export button in frontend
2. Frontend makes GET request to `/api/admin/orders/export`
3. Backend fetches all orders from database with populated product data
4. Backend generates Excel file using ExcelJS
5. Backend streams Excel file as response
6. Browser downloads the file

## Data Models

### Order Data for Export
```typescript
interface OrderExportData {
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  itemsSummary: string; // "Product A (2x), Product B (1x)"
  subtotal: number;
  deliveryCost: number;
  total: number;
  shippingAddress: string; // Formatted address string
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

- **Database Errors**: Return 500 with error message
- **No Orders**: Generate empty Excel with headers only
- **Excel Generation Errors**: Return 500 with appropriate error message

## Testing Strategy

- **Unit Tests**: Test Excel generation logic with mock order data
- **Integration Tests**: Test full API endpoint with database
- **Manual Testing**: Verify Excel file opens correctly and contains expected data

## Implementation Notes

### ExcelJS Usage
- Use ExcelJS workbook and worksheet creation
- Apply basic formatting (headers in bold)
- Set appropriate column widths
- Format dates and currency properly
- Handle order items aggregation for summary column

### Data Processing
- Generate order numbers from order IDs (format: `ORD-{last6chars}`)
- Aggregate order items into readable summary format
- Format shipping address as single string
- Handle missing customer data gracefully

### Frontend Design Recommendations
Since the furniture-frontend project is not detected, here are the frontend implementation guidelines:

#### Export Button Component
```jsx
// Add to admin orders table component
<button 
  onClick={handleExportOrders}
  className="export-btn"
  disabled={isExporting}
>
  {isExporting ? 'Exporting...' : 'Export to Excel'}
</button>
```

#### Export Handler Function
```javascript
const handleExportOrders = async () => {
  setIsExporting(true);
  try {
    const response = await fetch('/api/admin/orders/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Export failed:', error);
    // Show error message to user
  } finally {
    setIsExporting(false);
  }
};
```

#### CSS Styling
```css
.export-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.export-btn:hover {
  background-color: #218838;
}

.export-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
```

### Dependencies Required
- **Backend**: `npm install exceljs` (if not already installed from products export)
- **Frontend**: No additional dependencies needed (uses native fetch API)