// app/api/supplier/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db'

interface RouteParams {
  params: { id: string };
}

// ─── GET /api/supplier/products/[id] ────────────────────────────────────────
// Fetch a single product (must belong to the authenticated supplier).
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 403 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.id, supplierId: supplier.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, companyName: true } },
        _count:   { select: { reviews: true, orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('[GET /api/supplier/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/supplier/products/[id] ─────────────────────────────────────
// Permanently deletes a product.  Ownership is verified before deletion.
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 403 });
    }

    // Verify ownership before delete
    const existing = await prisma.product.findFirst({
      where: { id: params.id, supplierId: supplier.id },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: `Product "${existing.name}" deleted.` });
  } catch (error) {
    console.error('[DELETE /api/supplier/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}