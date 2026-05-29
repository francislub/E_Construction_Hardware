import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const now = new Date()

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where: {
          active: true,
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.promotion.count({
        where: {
          active: true,
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
      }),
    ])

    return NextResponse.json({
      promotions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
