import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supplier = await prisma.supplier.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    const [products, orders, pendingOrders, payments] =
      await Promise.all([
        prisma.product.count({
          where: {
            supplierId: supplier.id,
          },
        }),

        prisma.order.count({
          where: {
            supplierId: supplier.id,
          },
        }),

        prisma.order.count({
          where: {
            supplierId: supplier.id,
            status: 'PENDING',
          },
        }),

        prisma.payment.aggregate({
          where: {
            order: {
              supplierId: supplier.id,
            },
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
        }),
      ])

    return NextResponse.json({
      totalProducts: products,
      totalOrders: orders,
      pendingOrders,
      totalRevenue: payments._sum.amount || 0,
    })
  } catch (error) {
    console.error('Supplier stats fetch error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}