// ─────────────────────────────────────────────────────────────
// FILE:  app/api/delivery/[id]/status/route.ts
// ROUTE: PATCH /api/delivery/:id/status
//        Body: { status, location?, notes? }
//        Advances a delivery through the status pipeline:
//          ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED | FAILED
//        On DELIVERED: sets actualDate + syncs order → DELIVERED.
//        Only the assigned staff member can update their own delivery.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/db';

type AllowedStatus = "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
const ALLOWED: AllowedStatus[] = ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"];

export async function PATCH(
  req: NextRequest,
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

  const { status, location, notes } = await req.json();

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify this delivery belongs to this staff member
  const delivery = await prisma.delivery.findFirst({
    where: { id: params.id, staffId: staff.id },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const isCompleting = status === "DELIVERED" || status === "FAILED";

  // Update delivery status
  const updated = await prisma.delivery.update({
    where: { id: params.id },
    data: {
      status,
      location: location ?? delivery.location,
      notes: notes ?? delivery.notes,
      ...(isCompleting ? { actualDate: new Date() } : {}),
    },
  });

  // Sync order status when delivered
  if (status === "DELIVERED") {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: "DELIVERED" },
    });
  }

  return NextResponse.json(updated);
}