import { z } from 'zod'

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'SUPPLIER']).default('CUSTOMER'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Product Schemas
export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().trim().optional().nullable(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  specifications: z.record(z.any()).optional(),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().url('Invalid image URL').optional(),
})

// Order Schemas
export const createOrderSchema = z.object({
  shippingAddress: z.string().min(10, 'Shipping address must be valid'),
  billingAddress: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
  })).min(1, 'Order must have at least one item'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
})

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED']),
  location: z.string().optional(),
  notes: z.string().optional(),
})

// Review Schemas
export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500, 'Comment must be less than 500 characters').optional(),
})

// Payment Schemas
export const paymentSchema = z.object({
  orderId: z.string(),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER']),
  amount: z.number().positive('Amount must be positive'),
})

// Promotion Schemas
export const promotionSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  code: z.string().min(1, 'Promo code is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be positive'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
})

// Profile Schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
})

export const supplierProfileSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
})

export const addressSchema = z.object({
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type AddressInput = z.infer<typeof addressSchema>