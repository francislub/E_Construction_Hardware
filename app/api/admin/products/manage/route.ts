import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { productSchema } from '@/lib/validations';

// ── GET /api/admin/products/manage ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, companyName: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
      });
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json(product);
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        // supplier is optional — include it but it may be null
        supplier: { select: { id: true, companyName: true } },
        _count: { select: { reviews: true, orderItems: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[GET /api/admin/products/manage]', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// ── POST /api/admin/products/manage ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return NextResponse.json({ error: 'Validation failed', fields }, { status: 422 });
    }

    const data = parsed.data;

    // slug and sku must always be non-empty strings before hitting Prisma
    if (!data.slug) {
      return NextResponse.json(
        { error: 'Validation failed', fields: [{ field: 'slug', message: 'Slug is required.' }] },
        { status: 422 }
      );
    }
    if (!data.sku) {
      return NextResponse.json(
        { error: 'Validation failed', fields: [{ field: 'sku', message: 'SKU is required.' }] },
        { status: 422 }
      );
    }

    // Normalise supplierId: empty string or falsy value → null
    const supplierId = data.supplierId?.trim() || null;

    // If a supplierId was provided, confirm the supplier actually exists
    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplierExists) {
        return NextResponse.json(
          { error: 'Validation failed', fields: [{ field: 'supplierId', message: 'Selected supplier does not exist.' }] },
          { status: 422 }
        );
      }
    }

    // Uniqueness checks — use findFirst so Prisma never receives undefined in where
    const slugExists = await prisma.product.findFirst({ where: { slug: data.slug } });
    if (slugExists) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: [{ field: 'slug', message: 'This slug is already taken. Edit it to make it unique.' }],
        },
        { status: 422 }
      );
    }

    const skuExists = await prisma.product.findFirst({ where: { sku: data.sku } });
    if (skuExists) {
      return NextResponse.json(
        { error: 'Validation failed', fields: [{ field: 'sku', message: 'This SKU is already in use.' }] },
        { status: 422 }
      );
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
        // supplierId is nullable in the Prisma schema — pass null when absent
        supplierId:     supplierId,
        images:         data.images ?? [],
        specifications: data.specifications ?? undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/products/manage]', error);

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A product with that slug or SKU already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// ── PUT /api/admin/products/manage ────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const parsed = productSchema.safeParse(rest);
    if (!parsed.success) {
      const fields = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return NextResponse.json({ error: 'Validation failed', fields }, { status: 422 });
    }

    const data = parsed.data;

    if (!data.slug) {
      return NextResponse.json(
        { error: 'Validation failed', fields: [{ field: 'slug', message: 'Slug is required.' }] },
        { status: 422 }
      );
    }
    if (!data.sku) {
      return NextResponse.json(
        { error: 'Validation failed', fields: [{ field: 'sku', message: 'SKU is required.' }] },
        { status: 422 }
      );
    }

    // Normalise supplierId
    const supplierId = data.supplierId?.trim() || null;

    // Verify supplier exists if one was provided
    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplierExists) {
        return NextResponse.json(
          { error: 'Validation failed', fields: [{ field: 'supplierId', message: 'Selected supplier does not exist.' }] },
          { status: 422 }
        );
      }
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Slug uniqueness — exclude self
    if (data.slug !== existing.slug) {
      const slugExists = await prisma.product.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Validation failed', fields: [{ field: 'slug', message: 'This slug is already taken.' }] },
          { status: 422 }
        );
      }
    }

    // SKU uniqueness — exclude self
    if (data.sku !== existing.sku) {
      const skuExists = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      });
      if (skuExists) {
        return NextResponse.json(
          { error: 'Validation failed', fields: [{ field: 'sku', message: 'This SKU is already in use.' }] },
          { status: 422 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name:           data.name,
        slug:           data.slug,
        description:    data.description,
        price:          data.price,
        sku:            data.sku,
        stock:          data.stock,
        categoryId:     data.categoryId,
        supplierId:     supplierId,
        images:         data.images ?? [],
        specifications: data.specifications ?? undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[PUT /api/admin/products/manage]', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// ── DELETE /api/admin/products/manage?id=xxx ─────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/admin/products/manage]', error);

    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete a product that has existing orders.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}