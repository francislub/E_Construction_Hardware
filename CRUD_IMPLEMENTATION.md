# Hardware E-Commerce - CRUD Implementation Guide

## Overview
This document lists all the CRUD (Create, Read, Update, Delete) operations and pages implemented for the hardware e-commerce system.

---

## API ENDPOINTS - CRUD OPERATIONS

### Categories Management
- **POST** `/api/categories/manage` - Create category (Admin only)
- **GET** `/api/categories/manage` - List all categories
- **GET** `/api/categories/[id]` - Get category details
- **PUT** `/api/categories/[id]` - Update category (Admin only)
- **DELETE** `/api/categories/[id]` - Delete category (Admin only)

### Products Management
- **POST** `/api/products/manage` - Create product (Supplier/Admin)
- **GET** `/api/products` - List all products with search/filter
- **GET** `/api/products/[id]` - Get product details
- **PUT** `/api/products/[id]/manage` - Update product (Owner/Admin)
- **DELETE** `/api/products/[id]/manage` - Delete product (Owner/Admin)

### Addresses Management
- **GET** `/api/addresses` - List customer addresses (Authenticated)
- **POST** `/api/addresses` - Create address (Customer)
- **GET** `/api/addresses/[id]` - Get address details (Owner)
- **PUT** `/api/addresses/[id]` - Update address (Owner)
- **DELETE** `/api/addresses/[id]` - Delete address (Owner)

### Orders Management
- **GET** `/api/orders` - List orders (Role-based)
- **POST** `/api/orders` - Create order (Customer)
- **GET** `/api/orders/[id]` - Get order details
- **PUT** `/api/orders/[id]` - Update order status (Admin/Supplier)
- **GET** `/api/orders/[id]` - Cancel order (Customer)

### Payments Management
- **GET** `/api/payments` - List payments (Role-based)
- **POST** `/api/payments` - Process payment (Customer)
- **GET** `/api/payments/[id]` - Get payment details
- **PUT** `/api/payments/[id]` - Update payment status (Admin)

### Deliveries Management
- **GET** `/api/deliveries` - List deliveries (Role-based)
- **POST** `/api/deliveries` - Create delivery (Admin)
- **GET** `/api/deliveries/[id]` - Get delivery details
- **PUT** `/api/deliveries/[id]` - Update delivery status (Staff/Admin)

### Reviews Management
- **GET** `/api/reviews` - List product reviews
- **POST** `/api/reviews` - Create review (Customer)
- **DELETE** `/api/reviews/[id]` - Delete review (Owner/Admin)

### Favorites Management
- **GET** `/api/favorites` - List customer favorites
- **POST** `/api/favorites` - Add to favorites (Customer)
- **DELETE** `/api/favorites/[id]` - Remove from favorites (Customer)

### Users Management (Admin)
- **GET** `/api/users` - List all users (Admin)
- **GET** `/api/users/[id]` - Get user details
- **PUT** `/api/users/[id]` - Update user profile
- **DELETE** `/api/users/[id]` - Delete user (Admin only)

### Suppliers Management
- **GET** `/api/suppliers` - List verified suppliers
- **POST** `/api/suppliers` - Create supplier profile (Supplier)
- **GET** `/api/suppliers/[id]` - Get supplier details
- **PUT** `/api/suppliers/[id]` - Update supplier profile
- **DELETE** `/api/suppliers/[id]` - Delete supplier (Admin only)

### Statistics APIs
- **GET** `/api/admin/stats` - Admin dashboard stats
- **GET** `/api/supplier/stats` - Supplier dashboard stats
- **GET** `/api/delivery/stats` - Delivery staff dashboard stats

---

## DASHBOARD PAGES & CRUD INTERFACES

### Admin Dashboard (`/admin`)
- **`/admin`** - Main dashboard with stats and quick actions
- **`/admin/categories`** - List, create, edit, delete categories
- **`/admin/categories/new`** - Create new category
- **`/admin/categories/[id]`** - Edit category
- **`/admin/products`** - List products with management options
- **`/admin/orders`** - View and manage all orders
- **`/admin/users`** - Manage users (list, view, delete)
- **`/admin/suppliers`** - Verify and manage suppliers
- **`/admin/deliveries`** - Track and manage deliveries
- **`/admin/payments`** - Process and verify payments

### Customer Pages (`/customer`)
- **`/customer`** - Customer dashboard with recent orders
- **`/customer/orders`** - List all customer orders
- **`/customer/orders/[id]`** - View order details and tracking
- **`/customer/orders/[id]/checkout`** - Checkout and payment
- **`/customer/addresses`** - Manage delivery addresses (CRUD)
- **`/customer/addresses/new`** - Add new address
- **`/customer/addresses/[id]`** - Edit address
- **`/customer/profile`** - Edit profile information
- **`/customer/favorites`** - View and manage wishlist

### Supplier Pages (`/supplier`)
- **`/supplier`** - Supplier dashboard with sales stats
- **`/supplier/products`** - List and manage products (CRUD)
- **`/supplier/products/new`** - Add new product
- **`/supplier/products/[id]`** - Edit product
- **`/supplier/products/[id]/manage`** - Manage inventory
- **`/supplier/orders`** - View supplier orders
- **`/supplier/orders/[id]`** - Process order
- **`/supplier/profile`** - Company profile settings
- **`/supplier/analytics`** - Sales analytics and reports

### Delivery Staff Pages (`/delivery`)
- **`/delivery`** - Delivery dashboard with stats
- **`/delivery/pending`** - List pending deliveries
- **`/delivery/active`** - List active/in-transit deliveries
- **`/delivery/completed`** - View completed deliveries
- **`/delivery/[id]`** - Delivery details and tracking
- **`/delivery/[id]/update`** - Update delivery status
- **`/delivery/profile`** - Staff profile and availability

---

## FORM COMPONENTS

### Built-in Form Components
1. **CategoryForm** (`components/forms/category-form.tsx`)
   - Create/Edit categories
   - Validation: name, slug, description, image URL

2. **ProductForm** (`components/forms/product-form.tsx`)
   - Create/Edit products
   - Image management (add/remove multiple images)
   - Specifications and pricing
   - Validation: name, slug, description, price, stock, SKU

3. **AddressForm** (`components/forms/address-form.tsx`)
   - Create/Edit delivery addresses
   - Street, city, state, postal code, country

4. **OrderForm** (implied in checkout)
   - Select shipping address
   - Select payment method
   - Apply discounts/promotions

---

## DATA TABLE COMPONENT

### DataTable (`components/data-table.tsx`)
Reusable table component with:
- Sortable columns
- Search and filter capabilities
- Edit/Delete action buttons
- Pagination support
- Loading states
- Empty state messages
- Mobile responsive

---

## AUTHORIZATION & ROLE-BASED ACCESS

### User Roles
1. **CUSTOMER** - Place orders, manage profile, view order history
2. **SUPPLIER** - Manage products, view supplier orders, analytics
3. **DELIVERY_STAFF** - Manage assigned deliveries, update status
4. **ADMIN** - Full system access, manage all entities

### Authorization Checks
All API routes implement:
- Session validation
- Role-based access control
- Resource ownership verification
- Email notification on operations

---

## USAGE EXAMPLES

### Creating a Product
```bash
POST /api/products/manage
{
  "name": "Hammer",
  "slug": "hammer",
  "description": "Heavy-duty hammer",
  "price": 19.99,
  "sku": "HMM-001",
  "stock": 100,
  "categoryId": "cat-123",
  "images": ["https://...jpg"],
  "specifications": {"weight": "2kg"}
}
```

### Creating an Order
```bash
POST /api/orders
{
  "customerId": "cust-123",
  "shippingAddressId": "addr-123",
  "items": [
    {"productId": "prod-123", "quantity": 2}
  ]
}
```

### Updating Delivery Status
```bash
PUT /api/deliveries/del-123
{
  "status": "IN_TRANSIT",
  "location": "Downtown",
  "notes": "On the way"
}
```

---

## EMAIL NOTIFICATIONS

The system sends emails for:
- Order confirmation
- Order shipped
- Order delivered
- Payment confirmation
- Payment failed
- Password reset
- Account confirmation
- Promotions

---

## VALIDATION SCHEMAS

All forms use Zod validation schemas defined in `lib/validations.ts`:
- CategorySchema
- ProductSchema
- AddressSchema
- OrderSchema
- PaymentSchema
- ReviewSchema

---

## NEXT STEPS

To complete the implementation:

1. Create remaining product/order detail pages
2. Implement checkout flow with payment integration
3. Add delivery tracking map view
4. Create analytics dashboards
5. Add image upload (instead of URLs)
6. Implement promotions/coupon system
7. Add inventory management alerts
8. Create PDF invoices
9. Add email template customization
10. Implement notification preferences

---

## File Structure Summary

```
API Routes:
├── /api/auth/...              (Authentication)
├── /api/products/...          (Product CRUD)
├── /api/categories/...        (Category CRUD)
├── /api/orders/...            (Order CRUD)
├── /api/payments/...          (Payment CRUD)
├── /api/deliveries/...        (Delivery CRUD)
├── /api/addresses/...         (Address CRUD)
├── /api/reviews/...           (Review CRUD)
├── /api/favorites/...         (Favorites CRUD)
├── /api/users/...             (User CRUD)
├── /api/suppliers/...         (Supplier CRUD)
└── /api/admin/stats           (Statistics)

Pages:
├── /admin/...                 (Admin dashboard)
├── /customer/...              (Customer pages)
├── /supplier/...              (Supplier pages)
├── /delivery/...              (Delivery staff pages)
└── /products/...              (Public product listing)

Components:
├── /components/forms/...      (Form components)
├── /components/data-table.tsx (Reusable table)
└── /components/header.tsx     (Navigation)
```
