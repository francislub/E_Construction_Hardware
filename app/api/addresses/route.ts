import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';

// GET /api/addresses - Get all addresses for the authenticated customer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the customer profile linked to this user
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const addresses = await prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [
        { isDefault: 'desc' }, // Default address first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('[GET /api/addresses]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/addresses - Create a new address
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { street, city, state, postalCode, country, isDefault } = body;

    // Validate required fields
    if (!street || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: 'All address fields are required' },
        { status: 400 }
      );
    }

    // Find or create customer profile
    let customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { userId: session.user.id },
      });
    }

    // If this new address is default, unset all other defaults first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address → auto-set as default
    const existingCount = await prisma.address.count({
      where: { customerId: customer.id },
    });

    const address = await prisma.address.create({
      data: {
        customerId: customer.id,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: isDefault || existingCount === 0,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('[POST /api/addresses]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}