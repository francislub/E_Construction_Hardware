import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let deliveries;

    if (session.user.role === 'ADMIN') {
      deliveries = await prisma.delivery.findMany({
        include: {
          order: { include: { customer: true } },
          staff: { select: { id: true, user: { select: { name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (session.user.role === 'DELIVERY_STAFF') {
      const staff = await prisma.deliveryStaff.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      deliveries = await prisma.delivery.findMany({
        where: { staffId: staff?.id },
        include: {
          order: { include: { customer: true } },
          staff: { select: { id: true, user: { select: { name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Customers can view their own deliveries
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      deliveries = await prisma.delivery.findMany({
        where: { order: { customerId: customer?.id } },
        include: {
          order: { include: { customer: true } },
          staff: { select: { id: true, user: { select: { name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error('Delivery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { orderId, staffId, estimatedDate } = data;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { include: { user: true } } },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        staffId: staffId || null,
        status: 'PENDING',
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
      },
      include: {
        order: { include: { customer: true } },
        staff: true,
      },
    });

    // Send delivery notification email
    await sendEmail({
      to: order.customer.user.email,
      subject: 'Your Order is Ready for Delivery',
      type: 'ORDER_SHIPPED',
      orderId,
      html: `
        <p>Your order is being prepared for delivery.</p>
        <p>Order ID: ${orderId}</p>
        <p>Estimated Delivery Date: ${estimatedDate || 'To be determined'}</p>
      `,
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error('Delivery creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
