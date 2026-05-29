# Hardware E-Commerce System - Quick Start Guide

## What's Included

This is a **production-ready, full-stack e-commerce system** with:

- ✅ Complete user authentication (customers, suppliers, admins)
- ✅ Product catalog with search, filtering, and sorting
- ✅ Shopping cart system
- ✅ Order management with status tracking
- ✅ Email notifications (order confirmation, shipping, delivery)
- ✅ Review and rating system
- ✅ Favorites/wishlist
- ✅ Responsive UI with Tailwind CSS
- ✅ No demo data - all real database queries
- ✅ Type-safe with TypeScript

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
1. Copy `.env.example` to `.env.local`
2. Update these critical values:
   ```
   DATABASE_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/hardware-store
   NEXTAUTH_SECRET=generate-a-random-secret-key
   EMAIL_FROM=noreply@hardwarestore.ug
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-gmail-app-password
   ```

### Step 3: Setup Database
```bash
pnpm exec prisma db push
```

### Step 4: Run Development Server
```bash
pnpm dev
```

Visit: `http://localhost:3000`

## Key Credentials for Testing

### Create a Test Account
1. Go to `http://localhost:3000/auth/register`
2. Register as CUSTOMER or SUPPLIER
3. Log in with your credentials

### Test Flows
- **Customer**: Browse products → Add to cart → Create order
- **Supplier**: Add products → View orders → Update status
- **Delivery**: Track and update deliveries

## Email Setup

### Using Gmail (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use this app password in `.env.local`:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Alternative Email Providers
- SendGrid: `SMTP_HOST=smtp.sendgrid.net`
- Mailgun: `SMTP_HOST=smtp.mailgun.org`
- AWS SES: Configure appropriate SMTP settings

## Database Models (13 Total)

**User Management**: User, Customer, Supplier, DeliveryStaff
**Products**: Category, Product, Review, Favorite
**Shopping**: Cart, CartItem
**Orders**: Order, OrderItem
**Other**: Payment, Delivery, Promotion, EmailLog

## API Routes Overview

```
POST   /api/auth/register          - Register user
POST   /api/auth/[...nextauth]     - Login/session
GET    /api/products               - List products
POST   /api/products               - Create product (supplier)
GET    /api/products/[id]          - Product details
GET    /api/categories             - List categories
GET    /api/cart                   - Get shopping cart
POST   /api/cart                   - Add to cart
PUT    /api/cart/[itemId]          - Update cart item
DELETE /api/cart/[itemId]          - Remove from cart
GET    /api/orders                 - Get user orders
POST   /api/orders                 - Create order
GET    /api/orders/[id]            - Order details
PUT    /api/orders/[id]            - Update order status
POST   /api/reviews                - Add review
GET    /api/favorites              - Get favorites
POST   /api/favorites              - Add to favorites
DELETE /api/favorites/[id]         - Remove favorite
```

## Key Features

### Product Browsing
- Advanced search with name and description
- Filter by category, price range
- Sort by newest, price, or rating
- Pagination (12 items per page)
- Stock status display

### Shopping Cart
- Add/remove items
- Update quantities
- Real-time total calculation
- Session-based persistence

### Order Management
- Automatic order number generation
- Email confirmation on creation
- Status tracking (pending → confirmed → processing → shipped → delivered)
- Automatic email notifications on status change

### Email Notifications
Triggered automatically for:
- Registration welcome
- Order confirmation
- Order shipped
- Order delivered
- Payment confirmation
- Payment failures

## File Structure

```
/app
  /api              - All API endpoints
  /auth             - Login/Register pages
  /products         - Product catalog pages
  /dashboard        - User dashboard
  /orders           - Order pages
  /layout.tsx       - Root layout
  /page.tsx         - Homepage

/components
  /header.tsx       - Navigation

/lib
  /db.ts           - Database client
  /email.ts        - Email service
  /auth.ts         - Authentication config
  /validations.ts  - Input validation

/prisma
  /schema.prisma   - Database schema

.env.example       - Environment template
SYSTEM_DOCUMENTATION.md  - Full docs
```

## Validation Rules

All inputs are validated with Zod schemas:

- **Email**: Valid email format required
- **Password**: Minimum 8 characters
- **Phone**: Optional, any format
- **Product Price**: Must be positive number
- **Product Stock**: Must be non-negative integer
- **Order Items**: Minimum quantity of 1
- **Review Rating**: 1-5 stars only

## Security Features

✅ Password hashing with bcryptjs
✅ JWT-based sessions (30-day expiration)
✅ Role-based access control
✅ Input validation on all endpoints
✅ Database query parameterization
✅ Email verification logging
✅ Error handling without exposing sensitive info

## Next Steps

1. **Test the system** with different user roles
2. **Customize styling** - All components use Tailwind CSS
3. **Add payment integration** - Stripe/PayPal ready
4. **Setup monitoring** - Email logs available in database
5. **Deploy to Vercel** - Production-ready code

## Troubleshooting

### Email not sending?
- Check SMTP credentials in `.env.local`
- Verify Gmail App Password is correct
- Check EmailLog table for error messages
- Ensure port 587 is accessible

### Database connection error?
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Run `pnpm exec prisma db push` again
- Check network connectivity

### Login not working?
- Clear browser cookies
- Verify user exists in database
- Check password is correct
- Ensure NEXTAUTH_SECRET is set

### Products not showing?
- Verify categories exist
- Check product stock is greater than 0
- Run `pnpm exec prisma db push` to sync schema
- Check MongoDB connection

## Performance Tips

1. **Images**: Use optimized formats (WebP, compressed JPEG)
2. **Database**: Indexes added to frequently queried fields
3. **API**: Pagination limits prevent large data transfers
4. **Frontend**: Components use React best practices
5. **Caching**: Consider adding Redis for sessions

## Monitoring

Track system health via database logs:
- EmailLog - Email delivery status
- User creation and authentication
- Order creation and updates
- Error tracking

## Support & Docs

- **Full Documentation**: See `SYSTEM_DOCUMENTATION.md`
- **API Details**: Check individual route handlers
- **Database Schema**: View `prisma/schema.prisma`
- **Validation Rules**: Check `lib/validations.ts`

## What You Can Do Now

1. ✅ Register as customer or supplier
2. ✅ Browse products by category
3. ✅ Search and filter products
4. ✅ Add products to cart
5. ✅ Create orders
6. ✅ Receive email notifications
7. ✅ Track order status
8. ✅ Write product reviews
9. ✅ Save favorites
10. ✅ View order history

Start building! 🚀
