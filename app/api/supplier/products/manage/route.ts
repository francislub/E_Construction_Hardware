// app/api/supplier/products/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db'
import { z } from 'zod';

// ─── Validation schema ───────────────────────────────────────────────────────
const productSchema = z.object({
  id:          z.string().optional(),          // present on PUT (edit)
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  slug:        z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price:       z.number().positive('Price must be positive'),
  sku:         z.string().min(2, 'SKU required'),
  stock:       z.number().int().min(0, 'Stock cannot be negative'),
  categoryId:  z.string().min(1, 'Category required'),
  supplierId:  z.string().nullable().optional(),
  images:      z.array(z.string().url()).optional().default([]),
  specifications: z.record(z.string()).nullable().optional(),
});

type ProductPayload = z.infer<typeof productSchema>;

// ─── Helper: resolve authenticated supplier id ───────────────────────────────
async function resolveSupplier(userId: string) {
  return prisma.supplier.findUnique({
    where: { userId },
    select: { id: true },
  });
}

// ─── POST /api/supplier/products/manage ─────────────────────────────────────
// Creates a new product for the authenticated supplier.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await resolveSupplier(session.user.id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 403 });
    }

    // Parse & validate body
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const data: ProductPayload = parsed.data;

    // Ensure SKU is globally unique
    const skuConflict = await prisma.product.findUnique({ where: { sku: data.sku }, select: { id: true } });
    if (skuConflict) {
      return NextResponse.json({ error: 'SKU already exists. Please use a unique SKU.' }, { status: 409 });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        name:           data.name,
        slug:           data.slug,
        description:    data.description,
        price:          data.price,
        sku:            data.sku,
        stock:          data.stock,
        categoryId:     data.categoryId,
        supplierId:     supplier.id,           // always set to authenticated supplier
        images:         data.images ?? [],
        specifications: data.specifications ?? null,
        rating:         0,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/supplier/products/manage]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/supplier/products/manage ──────────────────────────────────────
// Updates an existing product.  Ownership is verified before update.
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await resolveSupplier(session.user.id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 403 });
    }

    // Parse & validate body
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const data: ProductPayload = parsed.data;

    if (!data.id) {
      return NextResponse.json({ error: 'Product id is required for update' }, { status: 400 });
    }

    // Verify product ownership
    const existing = await prisma.product.findFirst({
      where: { id: data.id, supplierId: supplier.id },
      select: { id: true, sku: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // SKU uniqueness: only check when the SKU is being changed
    if (data.sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({ where: { sku: data.sku }, select: { id: true } });
      if (skuConflict && skuConflict.id !== data.id) {
        return NextResponse.json({ error: 'SKU already exists. Please use a unique SKU.' }, { status: 409 });
      }
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: data.id },
      data: {
        name:           data.name,
        slug:           data.slug,
        description:    data.description,
        price:          data.price,
        sku:            data.sku,
        stock:          data.stock,
        categoryId:     data.categoryId,
        images:         data.images ?? [],
        specifications: data.specifications ?? null,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PUT /api/supplier/products/manage]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}