import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: params.id },
      include: {
        order: { include: { customer: true } },
        staff: { select: { id: true, user: { select: { name: true, phone: true } } } },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Delivery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
    if (session.user.role === 'DELIVERY_STAFF') {
      const staff = await prisma.deliveryStaff.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      const delivery = await prisma.delivery.findUnique({
        where: { id: params.id },
        select: { staffId: true },
      });

      if (delivery?.staffId !== staff?.id) {
        return NextResponse.json(
          { error: 'Not authorized to update this delivery' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { status, location, notes, actualDate, staffId, estimatedDate } = data;

    const delivery = await prisma.delivery.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        location: location || undefined,
        notes: notes || undefined,
        actualDate: actualDate ? new Date(actualDate) : undefined,
        staffId: staffId || undefined,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : undefined,
      },
      include: {
        order: { include: { customer: { include: { user: true } } } },
        staff: true,
      },
    });

    // Send status update email
    if (status === 'DELIVERED') {
      await sendEmail({
        to: delivery.order.customer.user.email,
        subject: 'Your Order Has Been Delivered',
        type: 'ORDER_DELIVERED',
        orderId: delivery.orderId,
        html: `
          <p>Your order has been successfully delivered!</p>
          <p>Order ID: ${delivery.orderId}</p>
          <p>Delivery Date: ${new Date(delivery.actualDate || new Date()).toLocaleDateString()}</p>
        `,
      });

      // Update order status
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      });
    } else if (status === 'IN_TRANSIT') {
      await sendEmail({
        to: delivery.order.customer.user.email,
        subject: 'Your Order is on its Way',
        type: 'ORDER_SHIPPED',
        orderId: delivery.orderId,
        html: `
          <p>Your order is on its way!</p>
          <p>Order ID: ${delivery.orderId}</p>
          <p>Current Location: ${location || 'In transit'}</p>
        `,
      });
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Delivery update error:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}
