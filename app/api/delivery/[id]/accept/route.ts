// ─────────────────────────────────────────────────────────────
// FILE:  app/api/delivery/[id]/accept/route.ts
// ROUTE: PATCH /api/delivery/:id/accept
//        Assigns a PENDING delivery to the current staff member.
//        Sets delivery → ASSIGNED, order → SHIPPED.
//        Rejects if the delivery is already taken (409) or the
//        staff member is marked unavailable (400).
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/db';

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.deliveryStaff.findUnique({
    where: { userId: session.user.id },
  });

  if (!staff) {
    return NextResponse.json({ error: "Not a delivery staff member" }, { status: 403 });
  }

  if (!staff.available) {
    return NextResponse.json({ error: "You are currently marked as unavailable" }, { status: 400 });
  }

  // Check delivery still pending and unassigned
  const delivery = await prisma.delivery.findUnique({
    where: { id: params.id },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  if (delivery.status !== "PENDING" || delivery.staffId !== null) {
    return NextResponse.json({ error: "Delivery already assigned" }, { status: 409 });
  }

  // Assign delivery to this staff member
  const updated = await prisma.delivery.update({
    where: { id: params.id },
    data: {
      staffId: staff.id,
      status: "ASSIGNED",
    },
    include: {
      order: {
        include: {
          customer: { include: { user: { select: { name: true, phone: true } } } },
          items: { include: { product: { select: { name: true } } } },
        },
      },
    },
  });

  // Also update order status to SHIPPED
  await prisma.order.update({
    where: { id: updated.orderId },
    data: { status: "SHIPPED" },
  });

  return NextResponse.json(updated);
}