import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper: validate MongoDB ObjectID format
function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}

// GET /api/cart - Fetch user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!customer || !customer.cart) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const total = customer.cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    return NextResponse.json({
      id: customer.cart.id,
      items: customer.cart.items,
      total,
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // ✅ FIX: Validate productId is a proper MongoDB ObjectID before hitting the DB
    if (!isValidObjectId(productId)) {
      return NextResponse.json(
        { error: `Invalid productId: "${productId}" is not a valid ID. Send the product's _id, not its name or slug.` },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: { cart: true },
    })

    if (!customer || !customer.cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    // ✅ FIX: Verify the product actually exists before adding to cart
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: customer.cart.id,
        productId,
      },
    })

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      })
      return NextResponse.json(updatedItem)
    } else {
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: customer.cart.id,
          productId,
          quantity,
        },
        include: { product: true },
      })
      return NextResponse.json(newItem, { status: 201 })
    }
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}