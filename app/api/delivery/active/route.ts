// ─────────────────────────────────────────────────────────────
// FILE:  app/api/delivery/active/route.ts
// ROUTE: GET /api/delivery/active
//        Returns all deliveries assigned to the current staff
//        member with status ASSIGNED, PICKED_UP, or IN_TRANSIT.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/db';

export async function GET() {
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

  const deliveries = await prisma.delivery.findMany({
    where: {
      staffId: staff.id,
      status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      order: {
        include: {
          customer: {
            include: {
              user: { select: { name: true, phone: true } },
            },
          },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(deliveries);
}