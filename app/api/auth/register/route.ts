import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendEmail, welcomeEmail } from '@/lib/email'
import { EmailType, UserRole } from '@prisma/client'
import { z } from 'zod'

// ─── Validation schemas ────────────────────────────────────────────────────────

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  role: z.enum(['CUSTOMER', 'SUPPLIER', 'DELIVERY_STAFF']),
})

const customerSchema = baseSchema.extend({
  role: z.literal('CUSTOMER'),
})

const supplierSchema = baseSchema.extend({
  role: z.literal('SUPPLIER'),
  companyName: z.string().min(2, 'Company name required').max(200),
  companyAddress: z.string().min(5, 'Business address required').max(500),
  companyPhone: z.string().min(7, 'Business phone required'),
  description: z.string().max(1000).optional(),
})

const deliverySchema = baseSchema.extend({
  role: z.literal('DELIVERY_STAFF'),
  licenseNumber: z.string().min(3, 'License number required').max(50),
  vehicleType: z.enum(['Motorcycle', 'Bicycle', 'Car', 'Van', 'Truck']),
})

const registerSchema = z.discriminatedUnion('role', [
  customerSchema,
  supplierSchema,
  deliverySchema,
])

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Duplicate check
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // For delivery staff, check license uniqueness
    if (data.role === 'DELIVERY_STAFF') {
      const existingLicense = await prisma.deliveryStaff.findUnique({
        where: { licenseNumber: data.licenseNumber },
      })
      if (existingLicense) {
        return NextResponse.json(
          { error: 'License number already registered' },
          { status: 409 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    // ── Transaction: create user + role profile atomically ──────────────────
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          password: hashedPassword,
          role: data.role as UserRole,
        },
      })

      if (data.role === 'CUSTOMER') {
        const customer = await tx.customer.create({
          data: { userId: user.id },
        })
        // Provision empty cart immediately
        await tx.cart.create({ data: { customerId: customer.id } })
      }

      if (data.role === 'SUPPLIER') {
        await tx.supplier.create({
          data: {
            userId: user.id,
            companyName: data.companyName,
            address: data.companyAddress,
            phone: data.companyPhone,
            description: data.description,
            verified: false,
          },
        })
      }

      if (data.role === 'DELIVERY_STAFF') {
        await tx.deliveryStaff.create({
          data: {
            userId: user.id,
            licenseNumber: data.licenseNumber,
            vehicleType: data.vehicleType,
            available: true,
          },
        })
      }

      return user
    })

    // Send welcome email (fire-and-forget; don't fail registration if email fails)
    sendEmail({
      to: result.email,
      subject: `Welcome to HardwareHub!`,
      html: welcomeEmail(result.name || result.email),
      type: EmailType.ACCOUNT_CONFIRMATION,
      userId: result.id,
    }).catch((err) => console.error('Welcome email failed:', err))

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}