import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
    const orderBy = searchParams.get("orderBy") || "name";
    const order = searchParams.get("order") || "asc";

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
      // Para productos con stock bajo - necesitamos usar SQL raw para comparar stock <= minStock
      const lowStockProducts = await prisma.$queryRaw`
        SELECT p.*, s.name as supplier_name, c.name as category_name
        FROM Product p
        LEFT JOIN Supplier s ON p.supplierId = s.id
        LEFT JOIN Category c ON p.categoryId = c.id
        WHERE p.isActive = true AND p.stock <= p.minStock
        ORDER BY ${orderBy} ${order}
        LIMIT ${limit} OFFSET ${skip}
      `;

      const totalLowStockResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM Product p
        WHERE p.isActive = true AND p.stock <= p.minStock
      `;

      const total = (totalLowStockResult as any)[0].count;

      console.log(`Found ${total} low stock products`);
      return NextResponse.json({
        data: lowStockProducts,
        pagination: {
          page,
          limit,
          total: Number(total),
          pages: Math.ceil(Number(total) / limit),
        },
      });
    }

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
