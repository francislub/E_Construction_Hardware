import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { sendEmail, orderConfirmationEmail } from '@/lib/email'
import { EmailType, OrderStatus, PaymentStatus, Prisma } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'createdAt' | 'total' | 'status'
type SortDir   = 'asc' | 'desc'

interface OrdersQuery {
  page:         number
  pageSize:     number
  search:       string
  status:       string
  paymentStatus: string
  supplierId:   string
  dateFrom:     string
  dateTo:       string
  sortField:    SortField
  sortDir:      SortDir
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseQuery(req: NextRequest): OrdersQuery {
  const sp = req.nextUrl.searchParams
  return {
    page:         Math.max(1, Number(sp.get('page') ?? 1)),
    pageSize:     Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 25))),
    search:       sp.get('search')?.trim() ?? '',
    status:       sp.get('status')?.trim() ?? '',
    paymentStatus: sp.get('paymentStatus')?.trim() ?? '',
    supplierId:   sp.get('supplierId')?.trim() ?? '',
    dateFrom:     sp.get('dateFrom')?.trim() ?? '',
    dateTo:       sp.get('dateTo')?.trim() ?? '',
    sortField:    (sp.get('sortField') as SortField) ?? 'createdAt',
    sortDir:      (sp.get('sortDir') as SortDir) ?? 'desc',
  }
}

function buildWhere(q: OrdersQuery): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {}

  // Full-text search across orderNumber, customer name/email
  if (q.search) {
    where.OR = [
      { orderNumber: { contains: q.search, mode: 'insensitive' } },
      { customer: { user: { name:  { contains: q.search, mode: 'insensitive' } } } },
      { customer: { user: { email: { contains: q.search, mode: 'insensitive' } } } },
      { supplier: { companyName: { contains: q.search, mode: 'insensitive' } } },
    ]
  }

  if (q.status && q.status !== 'ALL') {
    where.status = q.status as OrderStatus
  }

  if (q.paymentStatus && q.paymentStatus !== 'ALL') {
    where.paymentStatus = q.paymentStatus as PaymentStatus
  }

  if (q.supplierId) {
    where.supplierId = q.supplierId
  }

  if (q.dateFrom || q.dateTo) {
    where.createdAt = {
      ...(q.dateFrom ? { gte: new Date(q.dateFrom) } : {}),
      ...(q.dateTo   ? { lte: new Date(new Date(q.dateTo).setHours(23, 59, 59, 999)) } : {}),
    }
  }

  return where
}

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id:     true,
          name:   true,
          price:  true,
          images: true,
          slug:   true,
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
          id:   true,
          user: { select: { id: true, name: true, email: true } },
          vehicleType: true,
        },
      },
    },
  },
  customer: {
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
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

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
// Admin-only: paginated, filtered, sorted order list with stats summary.

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q     = parseQuery(request)
    const where = buildWhere(q)
    const skip  = (q.page - 1) * q.pageSize

    // Build orderBy — Prisma requires nested path for some fields
    const orderBy: Prisma.OrderOrderByWithRelationInput =
      q.sortField === 'total'     ? { total:     q.sortDir } :
      q.sortField === 'status'    ? { status:    q.sortDir } :
      /* default createdAt */       { createdAt: q.sortDir }

    // Run count + paginated fetch in parallel
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy,
        skip,
        take: q.pageSize,
      }),
    ])

    return NextResponse.json({
      orders,
      total,
      page:       q.page,
      pageSize:   q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    })
  } catch (error) {
    console.error('[GET /api/admin/orders]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// ─── POST /api/admin/orders ───────────────────────────────────────────────────
// Admin can manually create an order on behalf of a customer.
// Validates the body with the shared createOrderSchema, mirrors the customer
// flow but bypasses the cart step (useful for phone/manual orders).

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow ADMIN or CUSTOMER roles
    if (!session || !['ADMIN', 'CUSTOMER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body       = await request.json()
    const validation = createOrderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { shippingAddress, billingAddress, items } = validation.data

    // For ADMIN creating on behalf of a customer, accept an optional `targetUserId`
    const targetUserId: string = session.user.role === 'ADMIN' && body.targetUserId
      ? body.targetUserId
      : session.user.id

    // Resolve Customer profile
    const customer = await prisma.customer.findUnique({ where: { userId: targetUserId } })
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Fetch products (no cart requirement for admin-created orders)
    const productIds = items.map((i: { productId: string }) => i.productId)
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { supplier: true },
    })

    if (products.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 })
    }

    // Calculate totals
    let subtotal   = 0
    const orderItems: { productId: string; quantity: number; price: number }[] = []

    for (const product of products) {
      const requestedQty = items.find((i: any) => i.productId === product.id)?.quantity ?? 1
      subtotal += product.price * requestedQty
      orderItems.push({ productId: product.id, quantity: requestedQty, price: product.price })
    }

    const shippingCost = subtotal > 100 ? 0 : 10
    const tax          = parseFloat((subtotal * 0.1).toFixed(2))
    const total        = parseFloat((subtotal + shippingCost + tax).toFixed(2))

    // Resolve supplierId (required on the Order model)
    const supplierItem = products.find(p => p.supplierId != null)
    if (!supplierItem?.supplierId) {
      return NextResponse.json(
        { error: 'No supplier found for the requested products.' },
        { status: 400 }
      )
    }
    const supplierId = supplierItem.supplierId

    // Create the order
    const orderNumber = `ORD-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId:     customer.id,
        userId:         targetUserId,
        supplierId,
        shippingAddress,
        billingAddress: billingAddress ?? shippingAddress,
        subtotal,
        shippingCost,
        tax,
        total,
        items: { createMany: { data: orderItems } },
      },
      include: {
        items:    { include: { product: true } },
        customer: { include: { user: { select: { id: true, name: true, email: true } } } },
        supplier: { select: { id: true, companyName: true } },
      },
    })

    // Send confirmation email (non-blocking)
    try {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (user) {
        await sendEmail({
          to:      user.email,
          subject: `Order Confirmation – ${orderNumber}`,
          html:    orderConfirmationEmail(
            user.name ?? user.email,
            orderNumber,
            total,
            order.items.map(item => ({
              name:     item.product.name,
              quantity: item.quantity,
              price:    item.price,
            }))
          ),
          type:    EmailType.ORDER_CONFIRMATION,
          orderId: order.id,
          userId:  user.id,
        })
      }
    } catch (emailError) {
      console.error('[POST /api/admin/orders] Confirmation email failed:', emailError)
    }

    // Clear cart only when the acting user is a customer (not an admin placing on their behalf)
    if (session.user.role === 'CUSTOMER') {
      const cart = await prisma.cart.findUnique({ where: { customerId: customer.id } })
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
      }
    }

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.orderNumber, order },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/admin/orders]', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}