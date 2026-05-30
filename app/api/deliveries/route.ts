import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// Shared include shape — reused across all three role branches
const deliveryInclude = {
  order: {
    include: {
      customer: {
        include: {
          user: {
            select: {
              name:  true,
              email: true,
              phone: true,
            },
          },
        },
      },
      items: {
        include: {
          product: {
            select: {
              id:    true,
              name:  true,
              price: true,
              images: true,
            },
          },
        },
      },
    },
  },
  staff: {
    select: {
      id:          true,
      vehicleType: true,
      available:   true,
      user: {
        select: {
          name:  true,
          phone: true,
          email: true,
        },
      },
    },
  },
} as const;

// ── GET /api/deliveries ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');   // optional filter e.g. ?status=IN_TRANSIT
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip   = (page - 1) * limit;

    // Build status filter only when a valid value is supplied
    const validStatuses = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
    const statusFilter  = status && validStatuses.includes(status) ? { status: status as never } : {};

    let where = {};

    if (session.user.role === 'ADMIN') {
      // Admins see everything
      where = { ...statusFilter };

    } else if (session.user.role === 'DELIVERY_STAFF') {
      // Staff see only their own deliveries
      const staff = await prisma.deliveryStaff.findUnique({
        where:  { userId: session.user.id },
        select: { id: true },
      });

      if (!staff) {
        return NextResponse.json(
          { error: 'Delivery staff profile not found' },
          { status: 404 }
        );
      }

      where = { staffId: staff.id, ...statusFilter };

    } else {
      // Customers see deliveries tied to their own orders
      const customer = await prisma.customer.findUnique({
        where:  { userId: session.user.id },
        select: { id: true },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer profile not found' },
          { status: 404 }
        );
      }

      where = { order: { customerId: customer.id }, ...statusFilter };
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include:  deliveryInclude,
        orderBy:  { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ]);

    return NextResponse.json({
      deliveries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Delivery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

// ── POST /api/deliveries ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, staffId, estimatedDate, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Verify the order exists and is not already attached to a delivery
    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: {
        delivery: true,
        customer: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.delivery) {
      return NextResponse.json(
        { error: 'A delivery already exists for this order' },
        { status: 409 }
      );
    }

    // If a staffId was provided, make sure it actually exists
    if (staffId) {
      const staffExists = await prisma.deliveryStaff.findUnique({
        where:  { id: staffId },
        select: { id: true },
      });

      if (!staffExists) {
        return NextResponse.json(
          { error: 'Delivery staff not found' },
          { status: 404 }
        );
      }
    }

    // Create delivery — status starts as ASSIGNED when staff is provided, PENDING otherwise
    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        staffId:       staffId  || null,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        notes:         notes    || null,
        status:        staffId  ? 'ASSIGNED' : 'PENDING',
      },
      include: deliveryInclude,
    });

    // Also bump the order status to PROCESSING so the customer sees progress
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: 'PROCESSING' },
    });

    // Notify the customer by email
    const customerEmail = order.customer.user.email;
    const customerName  = order.customer.user.name ?? 'Customer';
    const formattedDate = estimatedDate
      ? new Date(estimatedDate).toLocaleDateString('en-UG', {
          weekday: 'long',
          year:    'numeric',
          month:   'long',
          day:     'numeric',
        })
      : 'To be confirmed';

    await sendEmail({
      to:      customerEmail,
      subject: `Your Order #${order.orderNumber} is on its way!`,
      type:    'ORDER_SHIPPED',
      orderId,
      html: `
        <h2>Hi ${customerName},</h2>
        <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been handed to our delivery team.</p>
        <table cellpadding="8" style="border-collapse:collapse;">
          <tr>
            <td><strong>Order ID</strong></td>
            <td>${order.orderNumber}</td>
          </tr>
          <tr>
            <td><strong>Estimated Delivery</strong></td>
            <td>${formattedDate}</td>
          </tr>
          <tr>
            <td><strong>Shipping Address</strong></td>
            <td>${order.shippingAddress}</td>
          </tr>
        </table>
        <p>We'll keep you updated as your order progresses.</p>
        <p>Thank you for shopping with us!</p>
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