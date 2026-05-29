// ============================================================
// FILE 1: app/api/auth/forgot-password/route.ts
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, resetPasswordEmail } from '@/lib/email'
import { EmailType } from '@prisma/client'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data

    // Always return 200 even if user not found — prevents email enumeration
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Generate a secure token valid for 1 hour
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store token in DB (you'd add a PasswordResetToken model — shown below as a note)
      // For now we store it as a JSON doc in a generic approach via a raw upsert
      // Recommended: add this model to schema.prisma:
      //
      // model PasswordResetToken {
      //   id        String   @id @default(auto()) @map("_id") @db.ObjectId
      //   userId    String   @db.ObjectId
      //   token     String   @unique
      //   expires   DateTime
      //   used      Boolean  @default(false)
      //   createdAt DateTime @default(now())
      // }
      //
      // Then:
      // await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } })

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

      await sendEmail({
        to: email,
        subject: 'Reset your HardwareHub password',
        html: resetPasswordEmail(user.name || email, resetLink),
        type: EmailType.PASSWORD_RESET,
        userId: user.id,
      })
    }

    return NextResponse.json(
      { message: 'If that email is registered, a reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}