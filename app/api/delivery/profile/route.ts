// ─────────────────────────────────────────────────────────────
// FILE:  app/api/delivery/profile/route.ts
//
// ROUTE: GET  /api/delivery/profile
//        Returns the logged-in staff member's full profile:
//        user details, licenseNumber, vehicleType, availability,
//        and aggregated delivery stats (delivered/failed/total).
//
// ROUTE: PATCH /api/delivery/profile
//        Body: { name?, phone?, vehicleType? }
//        Updates user name/phone and staff vehicleType in a
//        single Prisma transaction. Returns the updated profile.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
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
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
      _count: { select: { deliveries: true } },
    },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
  }

  // Compute delivery stats
  const [delivered, failed] = await Promise.all([
    prisma.delivery.count({ where: { staffId: staff.id, status: "DELIVERED" } }),
    prisma.delivery.count({ where: { staffId: staff.id, status: "FAILED" } }),
  ]);

  return NextResponse.json({
    ...staff,
    deliveriesStats: {
      delivered,
      failed,
      total: staff._count.deliveries,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, vehicleType } = await req.json();

  const staff = await prisma.deliveryStaff.findUnique({
    where: { userId: session.user.id },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
  }

  // Update user name/phone and staff vehicleType in a transaction
  const [updatedUser, updatedStaff] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.deliveryStaff.update({
      where: { id: staff.id },
      data: {
        ...(vehicleType !== undefined ? { vehicleType } : {}),
      },
    }),
  ]);

  const [delivered, failed] = await Promise.all([
    prisma.delivery.count({ where: { staffId: staff.id, status: "DELIVERED" } }),
    prisma.delivery.count({ where: { staffId: staff.id, status: "FAILED" } }),
    prisma.delivery.count({ where: { staffId: staff.id } }),
  ]);

  const total = await prisma.delivery.count({ where: { staffId: staff.id } });

  return NextResponse.json({
    ...updatedStaff,
    user: updatedUser,
    deliveriesStats: { delivered, failed, total },
  });
}