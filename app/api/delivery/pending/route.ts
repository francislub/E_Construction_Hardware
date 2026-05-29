// ─────────────────────────────────────────────────────────────
// FILE:  app/api/delivery/pending/route.ts
// ROUTE: GET /api/delivery/pending
//        Returns all unassigned PENDING deliveries for any
//        logged-in delivery staff member to browse and accept.
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

  // Find the DeliveryStaff record for this user
  const staff = await prisma.deliveryStaff.findUnique({
    where: { userId: session.user.id },
  });

  if (!staff) {
    return NextResponse.json({ error: "Not a delivery staff member" }, { status: 403 });
  }

  // Fetch deliveries that are PENDING (no staff assigned yet)
  const deliveries = await prisma.delivery.findMany({
    where: {
      status: "PENDING",
      staffId: null, // unassigned
    },
    orderBy: { createdAt: "asc" },
    include: {
      order: {
        include: {
          customer: {
            include: {
              user: {
                select: { name: true, phone: true },
              },
            },
          },
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(deliveries);
}