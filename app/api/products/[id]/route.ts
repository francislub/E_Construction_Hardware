import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // MongoDB ObjectIDs are 24-char hex strings.
    // If the value doesn't look like one, treat it as a slug instead.
    const isObjectId = /^[a-f\d]{24}$/i.test(id)

    const product = await prisma.product.findFirst({
      where: isObjectId ? { id } : { slug: id },
      include: {
        category: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
            verified: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}