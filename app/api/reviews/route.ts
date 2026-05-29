import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reviewSchema } from '@/lib/validations'

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = reviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { productId, rating, comment } = validation.data

    // Check if user purchased this product
    const purchasedOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
        },
      },
    })

    if (!purchasedOrder) {
      return NextResponse.json(
        { error: 'Can only review purchased products' },
        { status: 403 }
      )
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Already reviewed this product' },
        { status: 409 }
      )
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // Update product rating
    const avgRating = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    })

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: avgRating._avg.rating || 0,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
