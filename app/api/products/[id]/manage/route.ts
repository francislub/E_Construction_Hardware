import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';
import { productSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPPLIER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = productSchema.partial().parse(data);

    // Check product ownership for suppliers
    if (session.user.role === 'SUPPLIER') {
      const product = await prisma.product.findUnique({
        where: { id: params.id },
        select: { supplierId: true },
      });

      if (product?.supplierId !== session.user.supplierId) {
        return NextResponse.json(
          { error: 'Not authorized to update this product' },
          { status: 403 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData,
      include: { category: true, supplier: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPPLIER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check product ownership for suppliers
    if (session.user.role === 'SUPPLIER') {
      const product = await prisma.product.findUnique({
        where: { id: params.id },
        select: { supplierId: true },
      });

      if (product?.supplierId !== session.user.supplierId) {
        return NextResponse.json(
          { error: 'Not authorized to delete this product' },
          { status: 403 }
        );
      }
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
