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

    const [total, completed, pending, inTransit, assigned, failed] = await Promise.all([
      prisma.delivery.count({ where: { staffId: staff.id } }),
      prisma.delivery.count({ where: { staffId: staff.id, status: 'DELIVERED' } }),
      prisma.delivery.count({ where: { staffId: staff.id, status: 'PENDING' } }),
      prisma.delivery.count({ where: { staffId: staff.id, status: 'IN_TRANSIT' } }),
      prisma.delivery.count({ where: { staffId: staff.id, status: 'ASSIGNED' } }),
      prisma.delivery.count({ where: { staffId: staff.id, status: 'FAILED' } }),
    ]);

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      totalDeliveries: total,
      completedDeliveries: completed,
      pendingDeliveries: pending,
      inTransitDeliveries: inTransit,
      assignedDeliveries: assigned,
      failedDeliveries: failed,
      successRate,
    });
  } catch (error) {
    console.error('Delivery stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}