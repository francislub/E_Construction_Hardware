// app/api/admin/orders/stats/route.ts
//
// GET /api/admin/orders/stats
// Admin-only. Returns aggregate counts and total revenue.
// Runs all aggregations in a single $transaction for consistency.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run all aggregations in parallel — MongoDB supports this without a transaction
    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      returned,
      revenueAgg,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'RETURNED' } }),
      // Revenue = sum of totals for DELIVERED orders with COMPLETED payment
      prisma.order.aggregate({
        where:  { status: 'DELIVERED', paymentStatus: 'COMPLETED' },
        _sum:   { total: true },
      }),
    ])

    return NextResponse.json({
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      returned,
      revenue: revenueAgg._sum.total ?? 0,
    })
  } catch (error) {
    console.error('[GET /api/admin/orders/stats]', error)
    return NextResponse.json({ error: 'Failed to fetch order stats' }, { status: 500 })
  }
}