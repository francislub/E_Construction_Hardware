// ─────────────────────────────────────────────────────────────
// FILE:  app/api/delivery/profile/availability/route.ts
// ROUTE: PATCH /api/delivery/profile/availability
//        Body: { available: boolean }
//        Toggles the staff member's on-duty / off-duty state.
//        When available = false, the accept route (above) will
//        reject new delivery assignments with a 400 error.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { available } = await req.json();

  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "available must be a boolean" }, { status: 400 });
  }

  const staff = await prisma.deliveryStaff.findUnique({
    where: { userId: session.user.id },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
  }

  const updated = await prisma.deliveryStaff.update({
    where: { id: staff.id },
    data: { available },
  });

  return NextResponse.json({ available: updated.available });
}