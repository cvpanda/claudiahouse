import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasPermission } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

interface ImportRow {
  SKU?: string;
  Nombre: string;
  Descripcion?: string;
  Stock?: string;
  "Stock Minimo"?: string;
  Costo?: string;
  "Precio Mayorista"?: string;
  "Precio Minorista"?: string;
  Categoria: string;
  Proveedor: string;
  Unidad?: string;
}

interface ProcessedProduct {
  sku?: string;
  name: string;
  description?: string;
  stock?: number;
  minStock?: number;
  cost?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  categoryId: string;
  supplierId: string;
  unit: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: {
    row: number;
    action: "created" | "updated" | "error" | "skipped";
    product?: {
      sku: string;
      name: string;
    };
    errors?: string[];
  }[];
}

// Función para normalizar números decimales
function parseDecimal(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  
  const parsed = parseFloat(value.replace(",", "."));
  if (isNaN(parsed)) return undefined;
  
  // Redondear a 2 decimales máximo
  return Math.round(parsed * 100) / 100;
}

// Función para validar que un número es mayor que 0
function isValidPositiveNumber(value: number | undefined): boolean {
  return value !== undefined && value > 0;
}

// Función para generar el siguiente SKU para una categoría
async function generateNextSku(categoryId: string): Promise<string> {
  try {
    // Obtener la categoría para el prefijo
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("Categoría no encontrada");
    }

    // Crear prefijo basado en el nombre de la categoría (primeras 3 letras en mayúsculas)
    const prefix = category.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
    
    // Buscar el último número de SKU para esta categoría
    const lastProduct = await prisma.product.findFirst({
      where: {
        categoryId: categoryId,
        sku: {
          startsWith: prefix,
        },
      },
      orderBy: {
        sku: "desc",
      },
    });

    let nextNumber = 1;
    if (lastProduct && lastProduct.sku) {
      // Extraer el número del SKU existente
      const match = lastProduct.sku.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Formatear con ceros a la izquierda (3 dígitos)
    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generando SKU:", error);
    // Fallback: usar timestamp
    return `PROD${Date.now()}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos
    const canCreate = hasPermission(user, "products", "create");
    const canUpdate = hasPermission(user, "products", "update");
    
    if (!canCreate && !canUpdate) {
      return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
    }

    // Obtener el archivo del form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 });
    }

    // Leer el contenido del archivo
    const fileContent = await file.text();
    
    // Parsear el CSV
    let records: ImportRow[];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      return NextResponse.json({ 
        error: "Error al procesar el archivo CSV. Verifica el formato." 
      }, { status: 400 });
    }

    // Obtener categorías y proveedores para validación
    const [categories, suppliers] = await Promise.all([
      prisma.category.findMany(),
      prisma.supplier.findMany(),
    ]);

    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    const supplierMap = new Map(suppliers.map(s => [s.name.toLowerCase(), s.id]));

    const result: ImportResult = {
      success: true,
      totalRows: records.length,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      results: [],
    };

    // Procesar cada fila
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 porque empezamos en fila 1 y hay header
      const errors: string[] = [];

      try {
        // Validaciones básicas
        if (!row.Nombre?.trim()) {
          errors.push("Nombre es obligatorio");
        }

        if (!row.Categoria?.trim()) {
          errors.push("Categoría es obligatoria");
        }

        if (!row.Proveedor?.trim()) {
          errors.push("Proveedor es obligatorio");
        }

        // Validar que categoría y proveedor existan
        const categoryId = categoryMap.get(row.Categoria?.toLowerCase() || "");
        const supplierId = supplierMap.get(row.Proveedor?.toLowerCase() || "");

        if (row.Categoria && !categoryId) {
          errors.push(`Categoría "${row.Categoria}" no existe en el sistema`);
        }

        if (row.Proveedor && !supplierId) {
          errors.push(`Proveedor "${row.Proveedor}" no existe en el sistema`);
        }

        // Procesar números
        const stock = row.Stock ? parseInt(row.Stock) : undefined;
        const minStock = row["Stock Minimo"] ? parseInt(row["Stock Minimo"]) : undefined;
        const cost = parseDecimal(row.Costo);
        const wholesalePrice = parseDecimal(row["Precio Mayorista"]);
        const retailPrice = parseDecimal(row["Precio Minorista"]);

        // Validar que al menos uno de los campos requeridos tenga valor
        const hasStock = stock !== undefined && stock >= 0;
        const hasCost = isValidPositiveNumber(cost);
        const hasWholesalePrice = isValidPositiveNumber(wholesalePrice);
        const hasRetailPrice = isValidPositiveNumber(retailPrice);

        if (!hasStock && !hasCost && !hasWholesalePrice && !hasRetailPrice) {
          errors.push("Debe completar al menos uno: Stock (≥0), Costo (>0), Precio Mayorista (>0), o Precio Minorista (>0)");
        }

        // Validar números negativos en stock
        if (stock !== undefined && stock < 0) {
          errors.push("Stock no puede ser negativo");
        }

        if (minStock !== undefined && minStock < 0) {
          errors.push("Stock mínimo no puede ser negativo");
        }

        // Si hay errores, registrar y continuar
        if (errors.length > 0) {
          result.results.push({
            row: rowNumber,
            action: "error",
            errors,
          });
          result.errorCount++;
          continue;
        }

        // Preparar datos del producto
        const productData: ProcessedProduct = {
          name: row.Nombre.trim(),
          description: row.Descripcion?.trim() || undefined,
          categoryId: categoryId!,
          supplierId: supplierId!,
          unit: row.Unidad?.trim() || "unidad",
        };

        // Solo agregar campos que tienen valores
        if (stock !== undefined) productData.stock = stock;
        if (minStock !== undefined) productData.minStock = minStock;
        if (cost !== undefined) productData.cost = cost;
        if (wholesalePrice !== undefined) productData.wholesalePrice = wholesalePrice;
        if (retailPrice !== undefined) productData.retailPrice = retailPrice;

        // Determinar si es creación o actualización
        const existingSku = row.SKU?.trim();
        let existingProduct = null;

        if (existingSku) {
          existingProduct = await prisma.product.findUnique({
            where: { sku: existingSku },
          });
        }

        if (existingProduct) {
          // Actualizar producto existente - solo campos con valores
          const updateData: any = {};
          
          if (productData.name) updateData.name = productData.name;
          if (productData.description !== undefined) updateData.description = productData.description;
          if (productData.stock !== undefined) updateData.stock = productData.stock;
          if (productData.minStock !== undefined) updateData.minStock = productData.minStock;
          if (productData.cost !== undefined) updateData.cost = productData.cost;
          if (productData.wholesalePrice !== undefined) updateData.wholesalePrice = productData.wholesalePrice;
          if (productData.retailPrice !== undefined) updateData.retailPrice = productData.retailPrice;
          if (productData.categoryId) updateData.categoryId = productData.categoryId;
          if (productData.supplierId) updateData.supplierId = productData.supplierId;
          if (productData.unit) updateData.unit = productData.unit;

          const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: updateData,
          });

          result.results.push({
            row: rowNumber,
            action: "updated",
            product: {
              sku: updatedProduct.sku || "",
              name: updatedProduct.name,
            },
          });
          result.successCount++;

        } else {
          // Crear nuevo producto
          // Generar SKU si no se proporcionó
          if (!existingSku) {
            productData.sku = await generateNextSku(productData.categoryId);
          } else {
            productData.sku = existingSku;
          }

          // Valores por defecto para campos obligatorios
          if (productData.stock === undefined) productData.stock = 0;
          if (productData.minStock === undefined) productData.minStock = 1;
          if (productData.cost === undefined) productData.cost = 0;
          if (productData.wholesalePrice === undefined) productData.wholesalePrice = 0;
          if (productData.retailPrice === undefined) productData.retailPrice = 0;

          const newProduct = await prisma.product.create({
            data: productData as any,
          });

          result.results.push({
            row: rowNumber,
            action: "created",
            product: {
              sku: newProduct.sku || "",
              name: newProduct.name,
            },
          });
          result.successCount++;
        }

      } catch (error) {
        console.error(`Error procesando fila ${rowNumber}:`, error);
        result.results.push({
          row: rowNumber,
          action: "error",
          errors: [`Error interno: ${error instanceof Error ? error.message : "Error desconocido"}`],
        });
        result.errorCount++;
      }
    }

    // Determinar si la importación fue exitosa en general
    result.success = result.errorCount === 0 || result.successCount > 0;

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error en importación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
