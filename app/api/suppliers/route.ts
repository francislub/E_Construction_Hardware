import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const verifiedOnly = searchParams.get('verified') === 'true';

    const where = verifiedOnly ? { verified: true } : {};

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          user: { select: { email: true, phone: true, name: true } },
          _count: { select: { products: true, orders: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      suppliers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Suppliers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { companyName, description, address, phone } = data;

    // Check if supplier already exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier profile already exists' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        userId: session.user.id,
        companyName,
        description,
        address,
        phone,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Supplier creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier profile' },
      { status: 500 }
    );
  }
}
