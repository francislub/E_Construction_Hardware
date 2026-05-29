import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateOrderStatusSchema } from '@/lib/validations'
import { sendEmail, orderShippedEmail, orderDeliveredEmail } from '@/lib/email'
import { EmailType } from '@prisma/client'

// GET /api/orders/[id]
// - CUSTOMER: own orders only (scoped by userId)
// - SUPPLIER: their orders only (scoped by supplier.userId)
// - ADMIN:    any order
// Returns { order } — page should destructure: const data = await res.json(); data.order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Next.js 15: params is a Promise
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params  // ← must await before accessing

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                images: true,
                slug: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            estimatedDate: true,
            actualDate: true,
            location: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        customer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            userId: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Role-scoped authorization
    if (session.user.role === 'CUSTOMER' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (session.user.role === 'SUPPLIER' && order.supplier?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Wrap in { order } so callers destructure consistently: const { order } = await res.json()
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PUT /api/orders/[id]
// Supplier-only: update order status and fire email notifications
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Next.js 15: params is a Promise
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params  // ← must await before accessing

    const body = await request.json()
    const validation = updateOrderStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // Fetch the current order to verify ownership and get customer details for email
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { id: true, userId: true, companyName: true },
        },
        customer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Ensure this supplier owns the order
    if (order.supplier.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Perform the status update
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true,
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            estimatedDate: true,
            actualDate: true,
            location: true,
            notes: true,
          },
        },
      },
    })

    // Send email notification — non-blocking, never fails the response
    try {
      const customerUser = order.customer?.user
      if (customerUser) {
        const { email, name, id: userId } = customerUser
        const displayName = name ?? email

        if (status === 'SHIPPED') {
          await sendEmail({
            to: email,
            subject: `Your Order ${order.orderNumber} Has Shipped`,
            html: orderShippedEmail(displayName, order.orderNumber),
            type: EmailType.ORDER_SHIPPED,
            orderId: order.id,
            userId,
          })
        } else if (status === 'DELIVERED') {
          await sendEmail({
            to: email,
            subject: `Your Order ${order.orderNumber} Has Been Delivered`,
            html: orderDeliveredEmail(displayName, order.orderNumber),
            type: EmailType.ORDER_DELIVERED,
            orderId: order.id,
            userId,
          })
        }
      }
    } catch (emailError) {
      console.error('Status update email failed:', emailError)
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}