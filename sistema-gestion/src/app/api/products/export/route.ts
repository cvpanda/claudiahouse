import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, hasPermission } from "@/lib/auth";

// Endpoint para exportar productos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos
    if (!hasPermission(user, "products", "read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const format = searchParams.get("format") || "excel"; // excel o csv

    // Construir filtros
    const where: any = {
      isActive: true,
    };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (supplierId && supplierId !== "all") {
      where.supplierId = supplierId;
    }

    // Obtener productos con relaciones
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: [
        { category: { name: "asc" } },
        { name: "asc" },
      ],
    });

    // Convertir productos al formato de exportación
    const exportData = products.map((product) => ({
      SKU: product.sku || "",
      Nombre: product.name,
      Descripcion: product.description || "",
      Stock: product.stock.toString(),
      "Stock Minimo": product.minStock.toString(),
      Costo: product.cost > 0 ? product.cost.toFixed(2) : "",
      "Precio Mayorista": product.wholesalePrice > 0 ? product.wholesalePrice.toFixed(2) : "",
      "Precio Minorista": product.retailPrice > 0 ? product.retailPrice.toFixed(2) : "",
      Categoria: product.category.name,
      Proveedor: product.supplier.name,
      Unidad: product.unit,
      "URL Imagen": product.imageUrl || "",
      "Codigo de Barras": product.barcode || "",
    }));

    // Obtener información adicional para las hojas de referencia
    const [categories, suppliers] = await Promise.all([
      prisma.category.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.supplier.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const responseData = {
      success: true,
      data: exportData,
      summary: {
        totalProducts: products.length,
        categories: categories.length,
        suppliers: suppliers.length,
        appliedFilters: {
          category: categoryId && categoryId !== "all" ? categoryId : null,
          supplier: supplierId && supplierId !== "all" ? supplierId : null,
        },
      },
      referenceData: {
        categories: categories.map(c => c.name),
        suppliers: suppliers.map(s => s.name),
        units: [
          "unidad",
          "kilogramo", 
          "gramo",
          "litro",
          "mililitro",
          "metro",
          "centimetro",
          "caja",
          "paquete",
          "docena",
        ],
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error exporting products:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
