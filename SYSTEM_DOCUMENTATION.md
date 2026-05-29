# Hardware E-Commerce System Documentation

## Project Overview

This is a comprehensive, production-ready e-commerce system built with Next.js 16, Prisma ORM, MongoDB, and TypeScript. The system supports multiple user roles (customers, suppliers, delivery staff, and admins) with complete features for product management, shopping, orders, payments, and email notifications.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js App Router with API routes, NextAuth for authentication
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth with credential provider and JWT session strategy
- **Email**: Nodemailer for SMTP-based notifications
- **Validation**: Zod for schema validation
- **Security**: bcryptjs for password hashing

## Database Schema

The system includes 13 main database models:

### Core Models
- **User** - Base user with email, password, and role-based access control
- **Customer** - Extended customer profile for retail users
- **Supplier** - Supplier profile with company information
- **DeliveryStaff** - Delivery personnel with license and vehicle info

### Product Management
- **Category** - Product categories with slugs
- **Product** - Products with stock, pricing, images, and specifications
- **Review** - Customer reviews with ratings (1-5 stars)
- **Favorite** - User wishlists/favorites

### Shopping & Orders
- **Cart** - Shopping carts with items
- **CartItem** - Individual items in carts
- **Order** - Customer orders with pricing breakdown
- **OrderItem** - Individual items in orders
- **Payment** - Payment records with status tracking

### Delivery & Promotions
- **Delivery** - Delivery tracking with staff assignment
- **Promotion** - Discount codes and promotional campaigns
- **EmailLog** - Email notification tracking

## User Roles & Permissions

### CUSTOMER
- Browse products and categories
- Search and filter products
- Add/remove items from cart
- Create and manage orders
- Track deliveries
- Write product reviews
- Manage favorites/wishlist
- View order history

### SUPPLIER
- Create and manage products
- View supplier dashboard
- Update order status
- Track sales and inventory
- Manage pricing

### DELIVERY_STAFF
- View assigned deliveries
- Update delivery status
- Track location

### ADMIN
- Create categories
- Manage promotions
- View all orders and transactions
- Access analytics and reports

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handler (login, session)

### Products
- `GET /api/products` - List products with filtering and pagination
  - Query params: `page`, `limit`, `category`, `search`, `minPrice`, `maxPrice`, `sortBy`
- `POST /api/products` - Create product (supplier only)
- `GET /api/products/[id]` - Get product details
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin only)

### Cart Management
- `GET /api/cart` - Get user's shopping cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/[itemId]` - Update cart item quantity
- `DELETE /api/cart/[itemId]` - Remove item from cart

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status (supplier only)

### Reviews & Favorites
- `POST /api/reviews` - Add product review (must have purchased)
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/[id]` - Remove from favorites

## Email Notifications

The system sends automated email notifications for:

1. **Account Confirmation** - Welcome email on registration
2. **Order Confirmation** - Order summary with items and total
3. **Order Shipped** - Notification when order ships
4. **Order Delivered** - Notification when order arrives
5. **Payment Confirmation** - Payment receipt
6. **Payment Failed** - Payment failure notification
7. **Password Reset** - Password reset link

### Email Configuration

Configure in `.env`:
```
EMAIL_FROM=noreply@hardwarestore.ug
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Note**: For Gmail, generate an [App Password](https://support.google.com/accounts/answer/185833) instead of using your regular password.

## File Structure

```
/app
  /api                    # API routes
    /auth                # Authentication endpoints
    /products            # Product management
    /categories          # Category management
    /cart                # Shopping cart
    /orders              # Order management
    /reviews             # Product reviews
    /favorites           # Wishlist
  /auth                  # Authentication pages
    /login              # Login page
    /register           # Registration page
  /products              # Product pages
    /page.tsx           # Products listing
    /[id]/page.tsx      # Product details
  /dashboard             # User dashboard
  /orders                # Order pages
  /layout.tsx            # Root layout
  /page.tsx              # Home page

/components
  /header.tsx            # Navigation header

/lib
  /db.ts                # Prisma client singleton
  /email.ts             # Email service and templates
  /auth.ts              # NextAuth configuration
  /validations.ts       # Zod validation schemas

/types
  /next-auth.d.ts       # NextAuth type definitions

/prisma
  /schema.prisma        # Database schema
  
.env.example            # Environment variable template
```

## Setup Instructions

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/hardware-store

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-key

# Email (SMTP)
EMAIL_FROM=noreply@hardwarestore.ug
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
NODE_ENV=development
APP_NAME=Hardware Store
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@hardwarestore.ug
```

### 2. Database Setup

```bash
# Push Prisma schema to MongoDB
pnpm exec prisma db push

# Generate Prisma client
pnpm exec prisma generate
```

### 3. Seed Database (Optional)

Create initial categories and products:

```bash
pnpm exec prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Key Features Implemented

✅ User authentication with role-based access control
✅ Product catalog with advanced search and filtering
✅ Shopping cart with add/remove/update functionality
✅ Order management with status tracking
✅ Email notifications for orders and payments
✅ Product reviews and ratings system
✅ User favorites/wishlist
✅ Delivery tracking
✅ Supplier dashboard
✅ Admin category management
✅ Responsive design with Tailwind CSS
✅ Password hashing with bcryptjs
✅ JWT-based session management

## Validation Schemas

All user inputs are validated using Zod schemas defined in `/lib/validations.ts`:

- `registerSchema` - User registration validation
- `loginSchema` - Login credentials validation
- `productSchema` - Product creation/update validation
- `createOrderSchema` - Order validation
- `reviewSchema` - Product review validation
- `addressSchema` - Address validation
- And more...

## Security Features

1. **Password Security**
   - Bcryptjs hashing with salt rounds
   - Minimum 8 character requirement
   - Validation on both client and server

2. **Session Management**
   - JWT-based sessions
   - 30-day expiration
   - HTTP-only cookies (production)

3. **API Authentication**
   - NextAuth session verification
   - Role-based authorization checks
   - CORS protection

4. **Input Validation**
   - Zod schema validation
   - Type safety with TypeScript
   - Email format validation

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASS`

### Alternative SMTP Providers
- SendGrid
- Mailgun
- AWS SES
- Custom SMTP server

## Future Enhancements

1. Payment gateway integration (Stripe, PayPal)
2. Advanced analytics and reporting
3. Inventory alerts and low stock management
4. Multi-currency support
5. Real-time order tracking with maps
6. Admin panel dashboard
7. Supplier analytics
8. Customer support/chat system
9. Mobile app (React Native)
10. API documentation with Swagger

## Error Handling

The system includes comprehensive error handling:

- Validation error responses with detailed issues
- Database operation error handling
- Email sending failure logging
- API error responses with appropriate HTTP status codes
- Client-side error alerts and notifications

## Performance Optimization

- Database indexing on frequently queried fields
- Pagination on product listings (12 items per page)
- Image optimization recommendations
- Caching strategies (future)
- CDN recommendations for static assets

## Testing Recommendations

1. **Unit Tests**
   - Validation schemas
   - Email template generation
   - Auth logic

2. **Integration Tests**
   - API endpoints
   - Database operations
   - Email sending

3. **E2E Tests**
   - Complete user flows
   - Order creation and tracking
   - Payment processing

## Deployment

The system is ready for deployment to Vercel:

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Deploy to Vercel
pnpm vercel deploy
```

### Production Checklist
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production MongoDB URL
- [ ] Setup SMTP with production email
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Set up monitoring and error tracking
- [ ] Configure backups for MongoDB
- [ ] Enable rate limiting on API routes
- [ ] Setup CDN for static assets
- [ ] Configure environment variables in Vercel

## Support & Troubleshooting

### Common Issues

1. **Email not sending**
   - Verify SMTP credentials
   - Check Gmail App Password
   - Review email logs in database

2. **Database connection errors**
   - Verify MongoDB connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure `prisma db push` was run

3. **Authentication issues**
   - Clear cookies and try again
   - Verify `NEXTAUTH_SECRET` is set
   - Check session configuration

## License

This project is provided as-is for demonstration purposes.
