import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';
import { paymentSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payments;

    if (session.user.role === 'ADMIN') {
      payments = await prisma.payment.findMany({
        include: { order: true, user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      payments = await prisma.payment.findMany({
        where: { userId: session.user.id },
        include: { order: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = paymentSchema.parse(data);

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      select: { userId: true, total: true },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: validatedData.orderId,
        userId: session.user.id,
        amount: validatedData.amount,
        method: validatedData.method,
        status: 'PENDING',
      },
      include: { order: true, user: { select: { email: true, name: true } } },
    });

    // Send payment initiated email
    await sendEmail({
      to: session.user.email || '',
      subject: 'Payment Initiated - Hardware Store',
      type: 'PAYMENT_CONFIRMATION',
      orderId: validatedData.orderId,
      html: `
        <p>Your payment of $${validatedData.amount} has been initiated.</p>
        <p>Payment Method: ${validatedData.method}</p>
        <p>Order ID: ${validatedData.orderId}</p>
      `,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
