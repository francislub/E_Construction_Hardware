import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendEmail, welcomeEmail } from '@/lib/email'
import { EmailType, UserRole } from '@prisma/client'
import { z } from 'zod'

// ── Invite codes ─────────────────────────────────────────────────────────────
// Default fallback is '12345' — override via ADMIN_INVITE_CODES env var
const ADMIN_INVITE_CODES = (process.env.ADMIN_INVITE_CODES || '12345')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean)

const adminRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  inviteCode: z.string().min(1, 'Invite code is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Validate input ───────────────────────────────────────────────────────
    const parsed = adminRegisterSchema.safeParse(body)
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

    const { name, email, phone, password, inviteCode } = parsed.data

    // ── Validate invite code ─────────────────────────────────────────────────
    if (!ADMIN_INVITE_CODES.includes(inviteCode)) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 403 }
      )
    }

    // ── Duplicate / existing user check ─────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      // If the user already has the ADMIN role, just tell them to log in
      if (existing.role === UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'An admin account with this email already exists. Please sign in.' },
          { status: 409 }
        )
      }

      // If the user exists with a different role, promote them to ADMIN
      // and update their password with the new one provided
      const hashedPassword = await bcrypt.hash(password, 14)

      const upgraded = await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
          name: name ?? existing.name,
          phone: phone ?? existing.phone,
        },
      })

      sendEmail({
        to: email,
        subject: 'Your account has been upgraded to Admin — HardwareHub',
        html: welcomeEmail(upgraded.name || email),
        type: EmailType.ACCOUNT_CONFIRMATION,
        userId: upgraded.id,
      }).catch((err) => console.error('Admin upgrade email failed:', err))

      return NextResponse.json(
        {
          message: 'Existing account upgraded to Admin successfully',
          user: {
            id: upgraded.id,
            email: upgraded.email,
            name: upgraded.name,
            role: upgraded.role,
          },
        },
        { status: 200 }
      )
    }

    // ── Create brand-new admin user ──────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 14)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    })

    sendEmail({
      to: email,
      subject: 'Admin account created — HardwareHub',
      html: welcomeEmail(name || email),
      type: EmailType.ACCOUNT_CONFIRMATION,
      userId: user.id,
    }).catch((err) => console.error('Admin welcome email failed:', err))

    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}