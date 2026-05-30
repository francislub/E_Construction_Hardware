import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateOrderStatusSchema } from '@/lib/validations'
import {
  sendEmail,
  orderShippedEmail,
  orderDeliveredEmail,
} from '@/lib/email'
import { EmailType, OrderStatus, PaymentStatus, DeliveryStatus, Prisma } from '@prisma/client'

// ─── Shared include ───────────────────────────────────────────────────────────

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id:             true,
          name:           true,
          description:    true,
          price:          true,
          images:         true,
          slug:           true,
          sku:            true,
          stock:          true,
          specifications: true,
        },
      },
    },
  },
  payment: {
    select: {
      id:            true,
      amount:        true,
      method:        true,
      status:        true,
      transactionId: true,
      createdAt:     true,
      updatedAt:     true,
    },
  },
  delivery: {
    select: {
      id:            true,
      status:        true,
      estimatedDate: true,
      actualDate:    true,
      location:      true,
      notes:         true,
      createdAt:     true,
      updatedAt:     true,
      staff: {
        select: {
          id:          true,
          vehicleType: true,
          licenseNumber: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  },
  customer: {
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      addresses: {
        where:   { isDefault: true },
        take:    1,
        select:  { id: true, street: true, city: true, state: true, postalCode: true, country: true },
      },
    },
  },
  supplier: {
    select: {
      id:          true,
      companyName: true,
      userId:      true,
      phone:       true,
      address:     true,
      verified:    true,
    },
  },
} satisfies Prisma.OrderInclude

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function unauthorized(msg = 'Unauthorized') {
  return NextResponse.json({ error: msg }, { status: 401 })
}
function forbidden(msg = 'Forbidden') {
  return NextResponse.json({ error: msg }, { status: 403 })
}
function notFound(msg = 'Order not found') {
  return NextResponse.json({ error: msg }, { status: 404 })
}
function badRequest(msg: string, extra?: object) {
  return NextResponse.json({ error: msg, ...extra }, { status: 400 })
}

// ─── GET /api/admin/orders/[id] ───────────────────────────────────────────────
// Role access:
//   ADMIN          → any order
//   SUPPLIER       → orders where supplier.userId === session.user.id
//   CUSTOMER       → orders where userId === session.user.id
//   DELIVERY_STAFF → orders where delivery.staff.userId === session.user.id

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorized()

    const { id } = await params
    if (!id) return badRequest('Order ID is required')

    const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE })
    if (!order) return notFound()

    const role = session.user.role

    if (role === 'CUSTOMER'       && order.userId                     !== session.user.id) return forbidden()
    if (role === 'SUPPLIER'       && order.supplier?.userId           !== session.user.id) return forbidden()
    if (role === 'DELIVERY_STAFF' && order.delivery?.staff?.user?.id  !== session.user.id) return forbidden()

    return NextResponse.json({ order })
  } catch (error) {
    console.error('[GET /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// ─── PUT /api/admin/orders/[id] ───────────────────────────────────────────────
// SUPPLIER: update order status → fires email notifications.
// Body: { status: OrderStatus }

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPPLIER') return unauthorized()

    const { id } = await params

    const body       = await request.json()
    const validation = updateOrderStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // Fetch current order to verify ownership
    const order = await prisma.order.findUnique({
      where:   { id },
      include: {
        supplier: { select: { id: true, userId: true, companyName: true } },
        customer: { include: { user: { select: { id: true, name: true, email: true } } } },
        delivery: { select: { id: true } },
      },
    })

    if (!order) return notFound()
    if (order.supplier.userId !== session.user.id) return forbidden()

    // Validate status transition
    const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      PENDING:    ['CONFIRMED', 'CANCELLED'],
      CONFIRMED:  ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED',    'CANCELLED'],
      SHIPPED:    ['DELIVERED',  'RETURNED'],
      DELIVERED:  ['RETURNED'],
    }
    const allowed = validTransitions[order.status as OrderStatus] ?? []
    if (!allowed.includes(status as OrderStatus)) {
      return badRequest(`Invalid status transition: ${order.status} → ${status}`)
    }

    // Update order status + auto-update delivery status when relevant
    const deliveryStatusMap: Partial<Record<OrderStatus, DeliveryStatus>> = {
      SHIPPED:   'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
      CANCELLED: 'FAILED',
      RETURNED:  'FAILED',
    }
    const newDeliveryStatus = deliveryStatusMap[status as OrderStatus]

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where:   { id },
        data:    { status: status as OrderStatus },
        include: ORDER_INCLUDE,
      }),
      ...(newDeliveryStatus && order.delivery?.id
        ? [prisma.delivery.update({
            where: { id: order.delivery.id },
            data:  {
              status:     newDeliveryStatus,
              ...(newDeliveryStatus === 'DELIVERED' ? { actualDate: new Date() } : {}),
            },
          })]
        : []),
    ])

    // Non-blocking email
    try {
      const customerUser = order.customer?.user
      if (customerUser) {
        const { email, name, id: userId } = customerUser
        const displayName = name ?? email
        if (status === 'SHIPPED') {
          await sendEmail({
            to:      email,
            subject: `Your Order ${order.orderNumber} Has Shipped`,
            html:    orderShippedEmail(displayName, order.orderNumber),
            type:    EmailType.ORDER_SHIPPED,
            orderId: order.id,
            userId,
          })
        } else if (status === 'DELIVERED') {
          await sendEmail({
            to:      email,
            subject: `Your Order ${order.orderNumber} Has Been Delivered`,
            html:    orderDeliveredEmail(displayName, order.orderNumber),
            type:    EmailType.ORDER_DELIVERED,
            orderId: order.id,
            userId,
          })
        }
      }
    } catch (emailError) {
      console.error('[PUT /api/admin/orders/[id]] Email failed:', emailError)
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('[PUT /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/orders/[id] ────────────────────────────────────────────
// ADMIN only: update any combination of fields on an order.
// Supports:
//   - status          (OrderStatus)
//   - paymentStatus   (PaymentStatus)
//   - shippingAddress (string)
//   - billingAddress  (string)
//   - delivery        (partial Delivery fields: status, estimatedDate, location, notes, staffId)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') return unauthorized()

    const { id } = await params
    const body   = await request.json()

    const {
      status,
      paymentStatus,
      shippingAddress,
      billingAddress,
      delivery,        // { status?, estimatedDate?, location?, notes?, staffId? }
    } = body

    // Verify order exists
    const existing = await prisma.order.findUnique({
      where:   { id },
      select:  { id: true, status: true, paymentStatus: true, delivery: { select: { id: true } } },
    })
    if (!existing) return notFound()

    // Build update data — only include fields that were sent
    const orderData: Prisma.OrderUpdateInput = {
      ...(status          ? { status:          status          as OrderStatus } : {}),
      ...(paymentStatus   ? { paymentStatus:   paymentStatus   as PaymentStatus } : {}),
      ...(shippingAddress ? { shippingAddress } : {}),
      ...(billingAddress  ? { billingAddress  } : {}),
    }

    const ops: Parameters<typeof prisma.$transaction>[0] = [
      prisma.order.update({ where: { id }, data: orderData, include: ORDER_INCLUDE }),
    ]

    // If delivery patch provided and a Delivery record exists, upsert it
    if (delivery && typeof delivery === 'object') {
      const deliveryData: Prisma.DeliveryUpdateInput = {
        ...(delivery.status        ? { status:        delivery.status as DeliveryStatus } : {}),
        ...(delivery.estimatedDate ? { estimatedDate: new Date(delivery.estimatedDate) } : {}),
        ...(delivery.actualDate    ? { actualDate:    new Date(delivery.actualDate) }    : {}),
        ...(delivery.location      ? { location:      delivery.location } : {}),
        ...(delivery.notes         ? { notes:         delivery.notes }    : {}),
        ...(delivery.staffId       ? { staff: { connect: { id: delivery.staffId } } } : {}),
      }

      if (existing.delivery?.id) {
        ops.push(
          prisma.delivery.update({ where: { id: existing.delivery.id }, data: deliveryData }) as any
        )
      } else {
        // Create delivery record if it doesn't exist yet
        ops.push(
          prisma.delivery.create({
            data: {
              orderId: id,
              status:  (delivery.status ?? 'PENDING') as DeliveryStatus,
              ...(delivery.estimatedDate ? { estimatedDate: new Date(delivery.estimatedDate) } : {}),
              ...(delivery.location      ? { location: delivery.location } : {}),
              ...(delivery.notes         ? { notes:    delivery.notes }    : {}),
              ...(delivery.staffId       ? { staffId:  delivery.staffId }  : {}),
            },
          }) as any
        )
      }
    }

    const [updatedOrder] = await prisma.$transaction(ops as any)

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('[PATCH /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Failed to patch order' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/orders/[id] ───────────────────────────────────────────
// ADMIN only. Soft constraint: cannot delete a DELIVERED or SHIPPED order
// unless `force=true` is passed as a query param.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') return unauthorized()

    const { id } = await params
    const force  = request.nextUrl.searchParams.get('force') === 'true'

    const order = await prisma.order.findUnique({
      where:  { id },
      select: { id: true, status: true, orderNumber: true },
    })

    if (!order) return notFound()

    const locked: OrderStatus[] = ['DELIVERED', 'SHIPPED']
    if (locked.includes(order.status as OrderStatus) && !force) {
      return NextResponse.json(
        {
          error:  `Cannot delete an order with status "${order.status}". Pass ?force=true to override.`,
          status: order.status,
        },
        { status: 422 }
      )
    }

    // Cascade delete: Prisma handles OrderItem, Payment, Delivery via @onDelete(Cascade) in schema.
    await prisma.order.delete({ where: { id } })

    return NextResponse.json({ deleted: true, orderNumber: order.orderNumber })
  } catch (error) {
    console.error('[DELETE /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}