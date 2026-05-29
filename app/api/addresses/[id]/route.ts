import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/db';
import { addressSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const address = await prisma.address.findUnique({
      where: { id: params.id },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (address.customerId !== customer?.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this address' },
        { status: 403 }
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error('Address fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
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

    const data = await request.json();
    const validatedData = addressSchema.partial().parse(data);

    // Verify ownership
    const address = await prisma.address.findUnique({
      where: { id: params.id },
    });

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (address?.customerId !== customer?.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this address' },
        { status: 403 }
      );
    }

    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const address = await prisma.address.findUnique({
      where: { id: params.id },
    });

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (address?.customerId !== customer?.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this address' },
        { status: 403 }
      );
    }

    await prisma.address.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
