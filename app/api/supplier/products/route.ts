// app/api/supplier/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db'

// ─── GET /api/supplier/products ─────────────────────────────────────────────
// Returns paginated products belonging to the authenticated supplier.
// Query params: page, limit, search
export async function GET(req: NextRequest) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Resolve supplier record
    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 403 });
    }

    // 3. Parse query params
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10)));
    const search = searchParams.get('search')?.trim() ?? '';
    const skip   = (page - 1) * limit;

    // 4. Build where clause
    const where = {
      supplierId: supplier.id,
      ...(search && {
        OR: [
          { name:        { contains: search, mode: 'insensitive' as const } },
          { sku:         { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // 5. Parallel query: data + total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, companyName: true } },
          _count:   { select: { reviews: true, orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // 6. Return paginated response
    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/supplier/products]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}