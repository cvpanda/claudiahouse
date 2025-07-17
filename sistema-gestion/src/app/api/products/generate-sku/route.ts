import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    // Obtener la categoría
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { code: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Obtener el último SKU de esta categoría
    const lastProduct = await prisma.product.findFirst({
      where: {
        categoryId: categoryId,
        sku: {
          startsWith: category.code,
        },
      },
      orderBy: {
        sku: "desc",
      },
      select: { sku: true },
    });

    let nextNumber = 1;

    if (lastProduct && lastProduct.sku) {
      // Extraer el número del SKU (ejemplo: LAP123 -> 123)
      const numberPart = lastProduct.sku.replace(category.code, "");
      const currentNumber = parseInt(numberPart, 10);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    // Generar el nuevo SKU con formato de 3 dígitos
    const newSku = `${category.code}${nextNumber.toString().padStart(3, "0")}`;

    return NextResponse.json({ sku: newSku });
  } catch (error) {
    console.error("Error generating SKU:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
