import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const { code, subtotal } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      )
    }

    const now = new Date()

    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promotion) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      )
    }

    if (!promotion.active) {
      return NextResponse.json(
        { error: 'This promo code is no longer active' },
        { status: 400 }
      )
    }

    if (promotion.startDate > now) {
      return NextResponse.json(
        { error: 'This promo code is not yet active' },
        { status: 400 }
      )
    }

    if (promotion.endDate < now) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      )
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return NextResponse.json(
        { error: 'This promo code has reached its usage limit' },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = 0
    if (promotion.discountType === 'PERCENTAGE') {
      discount = (subtotal * promotion.discountValue) / 100
    } else {
      discount = promotion.discountValue
    }

    return NextResponse.json({
      valid: true,
      code: promotion.code,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      discount: Math.min(discount, subtotal), // Don't exceed subtotal
      description: promotion.description,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
