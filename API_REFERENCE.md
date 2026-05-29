# Hardware E-Commerce API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication

All endpoints except `/auth/register` require valid NextAuth session.

### Session Headers
```
Cookie: next-auth.session-token=<token>
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "phone": "+1 (555) 000-0000",
  "role": "CUSTOMER"  // or "SUPPLIER"
}

Response: 201 Created
{
  "message": "Registration successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
}
```

### Login
```http
POST /auth/[...nextauth]
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: Redirect to /dashboard with session cookie
```

## Product Endpoints

### List Products
```http
GET /products?page=1&limit=12&category=tools&search=hammer&minPrice=10&maxPrice=100&sortBy=newest

Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 12, max: 100)
- category: string (slug)
- search: string (searches name and description)
- minPrice: number
- maxPrice: number
- sortBy: "newest" | "price" | "rating"

Response: 200 OK
{
  "data": [
    {
      "id": "product-id",
      "name": "Hammer",
      "description": "Heavy-duty hammer",
      "price": 29.99,
      "stock": 50,
      "images": ["url1", "url2"],
      "category": {
        "name": "Tools",
        "slug": "tools"
      },
      "rating": 4.5,
      "reviews": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "pages": 4
  }
}
```

### Get Product Details
```http
GET /products/[id]

Response: 200 OK
{
  "id": "product-id",
  "name": "Hammer",
  "description": "Heavy-duty hammer",
  "price": 29.99,
  "sku": "HAMMER-001",
  "stock": 50,
  "images": ["url1", "url2"],
  "category": { "name": "Tools" },
  "supplier": {
    "companyName": "Acme Tools",
    "verified": true
  },
  "rating": 4.5,
  "reviews": [
    {
      "id": "review-id",
      "rating": 5,
      "comment": "Great quality!",
      "user": { "name": "John" }
    }
  ]
}
```

### Create Product (Supplier Only)
```http
POST /products
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "name": "New Hammer",
  "description": "Professional grade hammer",
  "price": 39.99,
  "sku": "HAMMER-002",
  "stock": 100,
  "categoryId": "category-id",
  "images": ["https://example.com/image1.jpg"],
  "specifications": {
    "weight": "2lbs",
    "material": "steel"
  }
}

Response: 201 Created
{
  "id": "new-product-id",
  "name": "New Hammer",
  ...
}
```

## Category Endpoints

### List Categories
```http
GET /categories

Response: 200 OK
[
  {
    "id": "category-id",
    "name": "Tools",
    "slug": "tools",
    "description": "Hand and power tools",
    "image": "url",
    "_count": {
      "products": 45
    }
  }
]
```

### Create Category (Admin Only)
```http
POST /categories
Content-Type: application/json
Authorization: Bearer <admin-session>

{
  "name": "Power Tools",
  "slug": "power-tools",
  "description": "Electric and cordless tools",
  "image": "https://example.com/image.jpg"
}

Response: 201 Created
```

## Shopping Cart Endpoints

### Get Cart
```http
GET /cart
Authorization: Bearer <session-token>

Response: 200 OK
{
  "id": "cart-id",
  "items": [
    {
      "id": "cart-item-id",
      "quantity": 2,
      "product": {
        "id": "product-id",
        "name": "Hammer",
        "price": 29.99,
        "images": ["url"]
      }
    }
  ],
  "total": 59.98
}
```

### Add to Cart
```http
POST /cart
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "productId": "product-id",
  "quantity": 2
}

Response: 201 Created
{
  "id": "cart-item-id",
  "quantity": 2,
  "product": { ... }
}
```

### Update Cart Item
```http
PUT /cart/[itemId]
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "quantity": 5
}

Response: 200 OK
{
  "id": "cart-item-id",
  "quantity": 5,
  "product": { ... }
}
```

### Remove from Cart
```http
DELETE /cart/[itemId]
Authorization: Bearer <session-token>

Response: 200 OK
{
  "message": "Item removed"
}
```

## Order Endpoints

### List Orders
```http
GET /orders
Authorization: Bearer <session-token>

Response: 200 OK
[
  {
    "id": "order-id",
    "orderNumber": "ORD-1234567890",
    "total": 89.97,
    "status": "PENDING",
    "createdAt": "2026-05-11T10:30:00Z",
    "items": [
      {
        "id": "item-id",
        "quantity": 2,
        "price": 29.99,
        "product": { ... }
      }
    ],
    "payment": { ... },
    "delivery": { ... }
  }
]
```

### Create Order
```http
POST /orders
Content-Type: application/json
Authorization: Bearer <customer-session>

{
  "shippingAddress": "123 Main St, City, State 12345",
  "billingAddress": "123 Main St, City, State 12345",
  "items": [
    {
      "productId": "product-id",
      "quantity": 2
    }
  ]
}

Response: 201 Created
{
  "id": "order-id",
  "orderNumber": "ORD-1234567890",
  "total": 89.97,
  "status": "PENDING",
  ...
}
```

### Get Order Details
```http
GET /orders/[id]
Authorization: Bearer <session-token>

Response: 200 OK
{
  "id": "order-id",
  "orderNumber": "ORD-1234567890",
  "total": 89.97,
  "status": "PENDING",
  "items": [ ... ],
  "payment": { ... },
  "delivery": { ... }
}
```

### Update Order Status (Supplier Only)
```http
PUT /orders/[id]
Content-Type: application/json
Authorization: Bearer <supplier-session>

{
  "status": "SHIPPED"  // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
}

Response: 200 OK
{
  "id": "order-id",
  "status": "SHIPPED",
  ...
}
```

## Review Endpoints

### Create Review
```http
POST /reviews
Content-Type: application/json
Authorization: Bearer <customer-session>

{
  "productId": "product-id",
  "rating": 5,
  "comment": "Excellent product!"
}

Response: 201 Created
{
  "id": "review-id",
  "productId": "product-id",
  "rating": 5,
  "comment": "Excellent product!",
  "user": { "name": "John Doe" }
}
```

## Favorites Endpoints

### List Favorites
```http
GET /favorites
Authorization: Bearer <customer-session>

Response: 200 OK
[
  {
    "id": "favorite-id",
    "product": {
      "id": "product-id",
      "name": "Hammer",
      "price": 29.99,
      "images": ["url"],
      "category": { ... }
    }
  }
]
```

### Add to Favorites
```http
POST /favorites
Content-Type: application/json
Authorization: Bearer <customer-session>

{
  "productId": "product-id"
}

Response: 201 Created
{
  "id": "favorite-id",
  "productId": "product-id",
  "product": { ... }
}
```

### Remove from Favorites
```http
DELETE /favorites/[id]
Authorization: Bearer <customer-session>

Response: 200 OK
{
  "message": "Removed from favorites"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "issues": [
    {
      "code": "invalid_type",
      "path": ["email"],
      "message": "Expected string, received number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create order"
}
```

## Rate Limiting

Currently, there is no rate limiting. Implement in production:
```
- 100 requests per minute per IP
- 1000 requests per hour per user
```

## Pagination

All list endpoints support pagination:
- `page`: Current page (default: 1)
- `limit`: Items per page (default: 12, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "pages": 4
  }
}
```

## Sorting

Available sort options:
- `newest` - Newest first (default)
- `price` - Low to high price
- `rating` - Highest rating first

## Filtering

### Price Range
```
GET /products?minPrice=10&maxPrice=100
```

### Category
```
GET /products?category=tools
```

### Search
```
GET /products?search=hammer
```

### Combine Filters
```
GET /products?category=tools&search=hammer&minPrice=20&maxPrice=50&sortBy=price
```

## Email Notifications

Automatic emails sent for:
- User registration (welcome)
- Order creation (confirmation)
- Order status change (shipped/delivered)
- Payment confirmation
- Payment failure

## Status Values

### Order Status
- PENDING
- CONFIRMED
- PROCESSING
- SHIPPED
- DELIVERED
- CANCELLED
- RETURNED

### Payment Status
- PENDING
- COMPLETED
- FAILED
- REFUNDED

### Delivery Status
- PENDING
- ASSIGNED
- PICKED_UP
- IN_TRANSIT
- DELIVERED
- FAILED

## User Roles

- CUSTOMER - Browse, purchase, review
- SUPPLIER - Manage products, view orders
- DELIVERY_STAFF - Track deliveries
- ADMIN - Full access

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "CUSTOMER"
  }'
```

### List Products
```bash
curl http://localhost:3000/api/products
```

### Get Product
```bash
curl http://localhost:3000/api/products/[product-id]
```

### Add to Cart
```bash
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "productId": "product-id",
    "quantity": 2
  }'
```

## Webhooks (Future)

Planned webhook events:
- order.created
- order.shipped
- order.delivered
- payment.completed
- product.created
- review.created
