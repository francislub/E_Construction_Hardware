import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { productSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== 'SUPPLIER' && session.user.role !== 'ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // ── Zod validation ──────────────────────────────────────────────────────
    let validatedData;
    try {
      validatedData = productSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: err.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 422 }
        );
      }
      throw err;
    }

    // ── Resolve supplierId ──────────────────────────────────────────────────
    // Priority order:
    //  1. SUPPLIER session → their own profile (non-negotiable)
    //  2. ADMIN + form value provided → use that value (after verifying it exists)
    //  3. ADMIN + no form value → auto-assign the first verified supplier,
    //     falling back to any supplier, falling back to null
    let supplierId: string | null = null;

    if (session.user.role === 'SUPPLIER') {
      if (!session.user.supplierId) {
        return NextResponse.json(
          { error: 'Supplier profile not found for this account' },
          { status: 400 }
        );
      }
      supplierId = session.user.supplierId;

    } else {
      // ADMIN path
      const formValue =
        (validatedData as Record<string, unknown>).supplierId ?? body.supplierId;
      const chosenId =
        formValue && typeof formValue === 'string' && formValue.trim()
          ? formValue.trim()
          : null;

      if (chosenId) {
        // Admin explicitly picked a supplier — verify it exists
        const found = await prisma.supplier.findUnique({
          where: { id: chosenId },
          select: { id: true },
        });
        if (!found) {
          return NextResponse.json(
            { error: 'Selected supplier does not exist' },
            { status: 400 }
          );
        }
        supplierId = found.id;

      } else {
        // No supplier chosen — auto-assign a default
        const fallback =
          // Prefer the oldest verified supplier
          (await prisma.supplier.findFirst({
            where: { verified: true },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          })) ??
          // Then any supplier at all
          (await prisma.supplier.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          }));

        supplierId = fallback?.id ?? null;
        // supplierId may still be null if there are zero suppliers in the DB.
        // Prisma will throw PrismaClientValidationError (caught below) if the
        // schema still requires the field. Adding ? to supplierId in
        // schema.prisma makes null valid at the DB level.
      }
    }

    // ── Verify category exists ──────────────────────────────────────────────
    const categoryExists = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
      select: { id: true },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // ── Create product ──────────────────────────────────────────────────────
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        sku: validatedData.sku,
        stock: validatedData.stock ?? 0,
        category: { connect: { id: validatedData.categoryId } },
        // Only connect supplier relation when we have an id
        ...(supplierId !== null && {
          supplier: { connect: { id: supplierId } },
        }),
        images: validatedData.images ?? [],
        specifications:
          validatedData.specifications &&
          Object.keys(validatedData.specifications as object).length > 0
            ? (validatedData.specifications as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      } as Prisma.ProductCreateInput,
      include: { category: true, supplier: true },
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    // Duplicate slug or SKU
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const fields = (error.meta?.target as string[]) ?? [];
        const label = fields.includes('sku')
          ? 'SKU already exists — regenerate it and try again'
          : fields.includes('slug')
          ? 'A product with this slug already exists'
          : 'A duplicate value already exists';
        return NextResponse.json({ error: label }, { status: 409 });
      }
    }

    // Schema still requires supplierId but DB has no suppliers yet
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          error:
            'No supplier could be assigned. Please add a supplier first, ' +
            'or make supplierId optional in schema.prisma: ' +
            '`supplierId String? @db.ObjectId`',
        },
        { status: 400 }
      );
    }

    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}