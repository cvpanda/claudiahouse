import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Contar productos
    const productCount = await prisma.product.count();

    // Obtener algunos productos de muestra
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        supplier: true,
        category: true,
      },
    });

    // Contar categorías y proveedores
    const categoryCount = await prisma.category.count();
    const supplierCount = await prisma.supplier.count();

    return NextResponse.json({
      counts: {
        products: productCount,
        categories: categoryCount,
        suppliers: supplierCount,
      },
      sampleProducts: products,
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de debug", details: error },
      { status: 500 }
    );
  }
}
