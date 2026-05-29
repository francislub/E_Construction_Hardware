import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const supplier = searchParams.get('supplier')
    const minRating = searchParams.get('minRating')
    const sortBy = searchParams.get('sortBy') || 'name'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {
      AND: [],
    }

    // Text search
    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      })
    }

    // Category filter
    if (category) {
      where.AND.push({
        category: {
          slug: category,
        },
      })
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter: any = {}
      if (minPrice) priceFilter.gte = parseFloat(minPrice)
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice)
      where.AND.push({ price: priceFilter })
    }

    // Supplier filter
    if (supplier) {
      where.AND.push({
        supplier: {
          id: supplier,
        },
      })
    }

    // Rating filter
    if (minRating) {
      where.AND.push({
        rating: {
          gte: parseFloat(minRating),
        },
      })
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND
    }

    // Sort configuration
    const orderBy: any = {}
    switch (sortBy) {
      case 'price-asc':
        orderBy.price = 'asc'
        break
      case 'price-desc':
        orderBy.price = 'desc'
        break
      case 'rating':
        orderBy.rating = 'desc'
        break
      case 'newest':
        orderBy.createdAt = 'desc'
        break
      default:
        orderBy.name = 'asc'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          supplier: true,
          reviews: {
            take: 5,
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
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
