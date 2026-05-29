import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// In Next.js 15, route segment params are a Promise and must be awaited.
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Missing supplier id' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, phone: true, name: true } },
        products: { select: { id: true, name: true, price: true } },
        _count: { select: { orders: true } },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Supplier fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing — required in Next.js 15
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Missing supplier id' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Verify ownership or admin
    if (supplier.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update this supplier' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { companyName, description, address, phone, verified } = data;

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        // Only ADMIN can flip the verified flag
        ...(session.user.role === 'ADMIN' && verified !== undefined && { verified }),
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Supplier update error:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Missing supplier id' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (supplier._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with active products' },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supplier delete error:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}