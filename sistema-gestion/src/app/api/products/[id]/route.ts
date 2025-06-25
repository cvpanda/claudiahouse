import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
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

    // Verificar unicidad de SKU y código de barras
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
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

    if (
      validatedData.barcode &&
      validatedData.barcode !== existingProduct.barcode
    ) {
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

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: validatedData,
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
