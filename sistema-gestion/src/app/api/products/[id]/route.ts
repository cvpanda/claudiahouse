import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional().or(z.literal("")).nullable(),
  sku: z.string().optional().or(z.literal("")).nullable(),
  barcode: z.string().optional().or(z.literal("")).nullable(),
  cost: z.coerce
    .number()
    .min(0, "El costo debe ser mayor o igual a 0")
    .optional(),
  wholesalePrice: z.coerce
    .number()
    .min(0, "El precio mayorista debe ser mayor o igual a 0")
    .optional(),
  retailPrice: z.coerce
    .number()
    .min(0, "El precio minorista debe ser mayor o igual a 0")
    .optional(),
  stock: z.coerce
    .number()
    .int()
    .min(0, "El stock debe ser mayor o igual a 0")
    .optional(),
  minStock: z.coerce
    .number()
    .int()
    .min(0, "El stock mínimo debe ser mayor o igual a 0")
    .optional(),
  maxStock: z.coerce.number().int().nullable().optional(),
  unit: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        category: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Normalizar datos antes de las validaciones
    const normalizedSku = validatedData.sku?.trim() || null;
    const normalizedBarcode = validatedData.barcode?.trim() || null;
    const existingBarcode = existingProduct.barcode?.trim() || null;

    // Verificar unicidad de SKU
    if (normalizedSku && normalizedSku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: normalizedSku },
      });
      if (existingSku && existingSku.id !== existingProduct.id) {
        return NextResponse.json(
          { error: "El SKU ya existe", field: "sku" },
          { status: 409 }
        );
      }
    }

    // Verificar unicidad de código de barras
    if (normalizedBarcode && normalizedBarcode !== existingBarcode) {
      const duplicateBarcode = await prisma.product.findUnique({
        where: { barcode: normalizedBarcode },
      });
      if (duplicateBarcode && duplicateBarcode.id !== existingProduct.id) {
        return NextResponse.json(
          { error: "El código de barras ya existe", field: "barcode" },
          { status: 409 }
        );
      }
    }

    // Si se está actualizando el stock, crear un movimiento
    if (
      validatedData.stock !== undefined &&
      validatedData.stock !== existingProduct.stock
    ) {
      const difference = validatedData.stock - existingProduct.stock;
      await prisma.stockMovement.create({
        data: {
          type: difference > 0 ? "in" : "out",
          quantity: Math.abs(difference),
          reason: "Ajuste manual",
          productId: params.id,
        },
      });
    }

    // Preparar datos para la actualización, usando los valores normalizados
    const updateData = {
      ...validatedData,
      sku: normalizedSku,
      barcode: normalizedBarcode,
      imageUrl: validatedData.imageUrl?.trim() || null,
      description: validatedData.description?.trim() || null,
    };

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: true,
        category: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    // Manejar errores específicos de Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as any;

      // Error de constraint único (P2002)
      if (prismaError.code === "P2002") {
        const field = prismaError.meta?.target?.[0];
        let message = "Ya existe un producto con estos datos";

        if (field === "sku") {
          message = "Ya existe un producto con este SKU";
        } else if (field === "barcode") {
          message = "Ya existe un producto con este código de barras";
        }

        return NextResponse.json({ error: message, field }, { status: 409 });
      }
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete - marcar como inactivo
    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
