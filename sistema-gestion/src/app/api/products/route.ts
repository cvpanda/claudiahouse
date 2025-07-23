import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  cost: z.coerce.number().min(0, "El costo debe ser mayor o igual a 0"),
  wholesalePrice: z.coerce
    .number()
    .min(0, "El precio mayorista debe ser mayor o igual a 0"),
  retailPrice: z.coerce
    .number()
    .min(0, "El precio minorista debe ser mayor o igual a 0"),
  stock: z.coerce.number().int().min(0, "El stock debe ser mayor o igual a 0"),
  minStock: z.coerce
    .number()
    .int()
    .min(0, "El stock mínimo debe ser mayor o igual a 0"),
  maxStock: z.coerce.number().int().nullable().optional(),
  unit: z.string().default("unidad"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  supplierId: z.string().min(1, "El proveedor es requerido"),
  categoryId: z.string().min(1, "La categoría es requerida"),
});

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/products called");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const lowStock = searchParams.get("lowStock") === "true";
    // Ordenar por updatedAt desc por defecto, si no existe usar createdAt desc
    let orderBy = searchParams.get("orderBy");
    let order = searchParams.get("order");
    if (!orderBy) {
      // Si el modelo tiene updatedAt, usarlo, si no createdAt
      orderBy = "updatedAt";
    }
    if (!order) {
      order = "desc";
    }

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (lowStock) {
      // Para productos con stock bajo - usamos Prisma ORM sin SQL raw
      // Primero obtenemos todos los productos activos
      const allActiveProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          supplier: {
            select: { name: true },
          },
          category: {
            select: { name: true },
          },
        },
      });

      // Filtramos los que tienen stock <= minStock
      const lowStockProducts = allActiveProducts.filter(
        (product) => product.stock <= product.minStock
      );

      // Aplicamos paginación manualmente
      const startIndex = skip;
      const endIndex = skip + limit;
      const paginatedProducts = lowStockProducts.slice(startIndex, endIndex);

      const total = lowStockProducts.length;

      console.log(`Found ${total} low stock products`);
      return NextResponse.json({
        data: paginatedProducts,
        pagination: {
          page,
          limit,
          total: total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Stats globales (sin filtros de búsqueda ni paginación)
    // Obtener todos los productos activos para calcular stats globales correctamente
    const allActiveProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true, cost: true },
    });
    const globalTotal = allActiveProducts.length;
    const globalLowStock = allActiveProducts.filter(
      (p) => p.stock <= p.minStock
    ).length;
    const globalTotalStockValue = allActiveProducts.reduce(
      (sum, p) => sum + p.stock * p.cost,
      0
    );

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: true,
          category: true,
        },
        orderBy: {
          [orderBy]: order,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    console.log(`Found ${total} products, returning ${products.length}`);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalProducts: globalTotal,
        lowStock: globalLowStock,
        totalStockValue: globalTotalStockValue,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Datos recibidos:", body);

    const validatedData = productSchema.parse(body);
    console.log("Datos validados:", validatedData);

    // Verificar que el SKU y código de barras sean únicos
    if (validatedData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });
      if (existingSku) {
        return NextResponse.json(
          { error: "El SKU ya existe" },
          { status: 400 }
        );
      }
    }

    if (validatedData.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: validatedData.barcode },
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: "El código de barras ya existe" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        sku: validatedData.sku || null,
        barcode: validatedData.barcode || null,
        cost: validatedData.cost,
        wholesalePrice: validatedData.wholesalePrice,
        retailPrice: validatedData.retailPrice,
        stock: validatedData.stock,
        minStock: validatedData.minStock,
        maxStock: validatedData.maxStock || null,
        unit: validatedData.unit,
        imageUrl: validatedData.imageUrl || null,
        supplierId: validatedData.supplierId,
        categoryId: validatedData.categoryId,
        isActive: true,
      },
      include: {
        supplier: true,
        category: true,
      },
    });

    console.log("Producto creado:", product);

    // Crear movimiento de stock inicial
    if (validatedData.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          type: "in",
          quantity: validatedData.stock,
          reason: "Stock inicial",
          productId: product.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Error de validación:", error.errors);
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
