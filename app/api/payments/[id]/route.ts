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

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { order: true, user: { select: { email: true, name: true } } },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify authorization
    if (session.user.role !== 'ADMIN' && payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this payment' },
        { status: 403 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
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
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { status, transactionId } = data;

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status,
        transactionId: transactionId || undefined,
      },
      include: { order: true, user: { select: { email: true, name: true } } },
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: status },
    });

    // Send email based on payment status
    if (status === 'COMPLETED') {
      await sendEmail({
        to: payment.user?.email || '',
        subject: 'Payment Confirmed - Hardware Store',
        type: 'PAYMENT_CONFIRMATION',
        orderId: payment.orderId,
        html: `
          <p>Your payment has been successfully processed.</p>
          <p>Amount: $${payment.amount}</p>
          <p>Transaction ID: ${transactionId || 'N/A'}</p>
          <p>Order ID: ${payment.orderId}</p>
        `,
      });
    } else if (status === 'FAILED') {
      await sendEmail({
        to: payment.user?.email || '',
        subject: 'Payment Failed - Hardware Store',
        type: 'PAYMENT_FAILED',
        orderId: payment.orderId,
        html: `
          <p>Your payment could not be processed.</p>
          <p>Amount: $${payment.amount}</p>
          <p>Please try again or contact support.</p>
        `,
      });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
