import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'DELIVERY_STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staff = await prisma.deliveryStaff.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Delivery staff profile not found' },
        { status: 404 }
      );
    }

    const deliveries = await prisma.delivery.findMany({
      where: { staffId: staff.id },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        estimatedDate: true,
        actualDate: true,
        updatedAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            shippingAddress: true,
            customer: {
              select: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const result = deliveries.map((d) => ({
      id: d.id,
      orderId: d.order.id,
      orderNumber: d.order.orderNumber,
      status: d.status,
      customerName: d.order.customer.user.name ?? 'Unknown',
      shippingAddress: d.order.shippingAddress,
      estimatedDate: d.estimatedDate?.toISOString() ?? null,
      updatedAt: d.updatedAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Recent deliveries fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent deliveries' },
      { status: 500 }
    );
  }
}