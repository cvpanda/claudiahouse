import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/next-sku?categoryId=xxx - Obtener el siguiente SKU para una categoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId es requerido" },
        { status: 400 }
      );
    }

    // Obtener la categoría para conseguir el código
    // @ts-ignore - Temporary fix for Prisma client type issue
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { code: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const categoryCode = category.code;

    // Buscar todos los productos con SKU que empiecen con el código de la categoría
    // @ts-ignore - Temporary fix for Prisma client type issue
    const products = await prisma.product.findMany({
      where: {
        sku: {
          startsWith: categoryCode,
        },
      },
      select: { sku: true },
      orderBy: { sku: "desc" },
    });

    let nextNumber = 1;

    if (products.length > 0) {
      // Extraer los números de los SKUs y encontrar el máximo
      const numbers = products
        .map((product) => {
          if (!product.sku) return 0;
          const match = product.sku.match(
            new RegExp(`^${categoryCode}(\\d+)$`)
          );
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num) => num > 0);

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const nextSku = `${categoryCode}${nextNumber}`;

    return NextResponse.json({ nextSku });
  } catch (error) {
    console.error("Error generating next SKU:", error);
    return NextResponse.json(
      { error: "Error al generar el siguiente SKU" },
      { status: 500 }
    );
  }
}
