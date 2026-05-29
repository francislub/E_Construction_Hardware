import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}

// PUT /api/cart/[itemId] - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ FIX: Validate itemId format
    if (!isValidObjectId(params.itemId)) {
      return NextResponse.json({ error: 'Invalid cart item ID' }, { status: 400 })
    }

    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.itemId },
      include: {
        cart: {
          include: { customer: true },
        },
      },
    })

    if (!cartItem || cartItem.cart.customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: params.itemId },
      data: { quantity },
      include: { product: true },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
  }
}

// DELETE /api/cart/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ FIX: Validate itemId format
    if (!isValidObjectId(params.itemId)) {
      return NextResponse.json({ error: 'Invalid cart item ID' }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.itemId },
      include: {
        cart: {
          include: { customer: true },
        },
      },
    })

    if (!cartItem || cartItem.cart.customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    await prisma.cartItem.delete({
      where: { id: params.itemId },
    })

    return NextResponse.json({ message: 'Item removed' })
  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }
}