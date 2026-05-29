import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { sendEmail, orderConfirmationEmail } from '@/lib/email'
import { EmailType } from '@prisma/client'

// GET /api/orders - Fetch user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
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
        payment: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createOrderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { shippingAddress, billingAddress, items } = validation.data

    // Step 1: resolve Customer from User (Address belongs to Customer, not User)
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Step 2: fetch cart items — MUST include product.supplier to get supplierId
    // FIX: the original query was missing `include: { product: { include: { supplier } } }`
    // which caused `cartItems[0].product.supplier` to be undefined → crash at supplier.id
    const cartItems = await prisma.cartItem.findMany({
      where: {
        productId: { in: items.map((item) => item.productId) },
        cart: { customerId: customer.id },
      },
      include: {
        product: {
          include: {
            // supplierId is optional (String? in schema), so supplier can be null
            supplier: true,
          },
        },
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'No valid cart items found' }, { status: 400 })
    }

    // Step 3: calculate totals
    let subtotal = 0
    const orderItems: { productId: string; quantity: number; price: number }[] = []

    for (const item of cartItems) {
      const requestedQty =
        items.find((i) => i.productId === item.productId)?.quantity ?? item.quantity
      subtotal += item.product.price * requestedQty
      orderItems.push({
        productId: item.productId,
        quantity: requestedQty,
        price: item.product.price,
      })
    }

    const shippingCost = subtotal > 100 ? 0 : 10
    const tax = subtotal * 0.1
    const total = subtotal + shippingCost + tax

    // Step 4: resolve supplierId safely
    // Product.supplierId is optional in the schema — find the first product that HAS a supplier
    const supplierItem = cartItems.find((ci) => ci.product.supplierId != null)
    if (!supplierItem) {
      return NextResponse.json(
        { error: 'No supplier found for cart items. Please contact support.' },
        { status: 400 }
      )
    }
    const supplierId = supplierItem.product.supplierId as string

    // Step 5: create the order
    const orderNumber = `ORD-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        userId: session.user.id,
        supplierId,                                       // now safely resolved
        shippingAddress,
        billingAddress: billingAddress ?? shippingAddress,
        subtotal,
        shippingCost,
        tax,
        total,
        items: {
          createMany: { data: orderItems },
        },
      },
      include: {
        items: { include: { product: true } },
      },
    })

    // Step 6: send confirmation email (non-blocking — don't fail the order if email fails)
    try {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Order Confirmation - ${orderNumber}`,
          html: orderConfirmationEmail(
            user.name ?? user.email,
            orderNumber,
            total,
            order.items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
            }))
          ),
          type: EmailType.ORDER_CONFIRMATION,
          orderId: order.id,
          userId: user.id,
        })
      }
    } catch (emailError) {
      // Log but don't fail the order
      console.error('Order confirmation email failed:', emailError)
    }

    // Step 7: clear cart items
    const cart = await prisma.cart.findUnique({ where: { customerId: customer.id } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, order }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}