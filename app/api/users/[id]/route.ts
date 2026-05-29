import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/users/[id] — fetch a user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // Next.js 15: params is a Promise
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params   // ← must await before accessing properties

    // Users can view their own profile, admins can view anyone
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to view this user' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Include role-specific profile
        customer: {
          select: {
            id: true,
            addresses: true,
            createdAt: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            description: true,
            address: true,
            phone: true,
            verified: true,
            createdAt: true,
          },
        },
        deliveryStaff: {
          select: {
            id: true,
            licenseNumber: true,
            vehicleType: true,
            available: true,
            createdAt: true,
          },
        },
        // Never expose password
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/users/[id] — update a user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // Next.js 15: params is a Promise
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params   // ← must await before accessing properties

    // Users can only update their own profile (admins can update anyone)
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update this user' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Whitelist safe fields — never allow role or password change here
    const { name, phone } = body

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name  !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // Next.js 15: params is a Promise
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params   // ← must await before accessing properties

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}