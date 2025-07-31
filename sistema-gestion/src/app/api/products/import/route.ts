import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasPermission } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

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
  "URL Imagen"?: string;
  "Codigo de Barras"?: string;
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
  imageUrl?: string;
  barcode?: string;
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

// Helper function to safely trim values (handle non-string types from Excel)
function safeTrim(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = value.toString();
  return str.trim() === "" ? undefined : str.trim();
}

// Función para normalizar números decimales
function parseDecimal(value: any): number | undefined {
  const trimmed = safeTrim(value);
  if (!trimmed) return undefined;

  const parsed = parseFloat(trimmed.replace(",", "."));
  if (isNaN(parsed)) return undefined;

  // Redondear a 2 decimales máximo
  return Math.round(parsed * 100) / 100;
}

// Función para normalizar números enteros
function parseInteger(value: any): number | undefined {
  const trimmed = safeTrim(value);
  if (!trimmed) return undefined;

  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed)) return undefined;

  return parsed;
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
    const prefix = category.name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

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
      return NextResponse.json(
        { error: "Sin permisos suficientes" },
        { status: 403 }
      );
    }

    // Obtener el archivo del form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se encontró archivo" },
        { status: 400 }
      );
    }

    // Leer el contenido del archivo
    const fileBuffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    // Parsear según el tipo de archivo
    let records: ImportRow[];
    try {
      if (fileName.endsWith(".csv")) {
        // Procesar CSV
        const fileContent = new TextDecoder().decode(fileBuffer);
        records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          comment: "#", // Ignorar líneas que empiecen con #
        });
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Procesar Excel
        const workbook = XLSX.read(fileBuffer, { type: "array" });

        // Usar la primera hoja (normalmente "Productos")
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        // Obtener headers (primera fila)
        const headers = jsonData[0] as string[];

        // Convertir a formato de objetos
        records = (jsonData.slice(1) as any[][])
          .map((row: any[]) => {
            const record: any = {};
            headers.forEach((header, index) => {
              record[header] = row[index] || "";
            });
            return record;
          })
          .filter((record: any) => {
            // Filtrar filas vacías
            return Object.values(record).some(
              (value) => value && value.toString().trim() !== ""
            );
          });
      } else {
        return NextResponse.json(
          {
            error:
              "Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)",
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      return NextResponse.json(
        {
          error: "Error al procesar el archivo. Verifica el formato.",
        },
        { status: 400 }
      );
    }

    // Obtener categorías y proveedores para validación
    const [categories, suppliers] = await Promise.all([
      prisma.category.findMany(),
      prisma.supplier.findMany(),
    ]);

    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const supplierMap = new Map(
      suppliers.map((s) => [s.name.toLowerCase(), s.id])
    );

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
        if (!safeTrim(row.Nombre)) {
          errors.push("Nombre es obligatorio");
        }

        if (!safeTrim(row.Categoria)) {
          errors.push("Categoría es obligatoria");
        }

        if (!safeTrim(row.Proveedor)) {
          errors.push("Proveedor es obligatorio");
        }

        // Validar que categoría y proveedor existan
        const categoryId = categoryMap.get(
          safeTrim(row.Categoria)?.toLowerCase() || ""
        );
        const supplierId = supplierMap.get(
          safeTrim(row.Proveedor)?.toLowerCase() || ""
        );

        if (row.Categoria && !categoryId) {
          errors.push(`Categoría "${row.Categoria}" no existe en el sistema`);
        }

        if (row.Proveedor && !supplierId) {
          errors.push(`Proveedor "${row.Proveedor}" no existe en el sistema`);
        }

        // Procesar números
        const stock = parseInteger(row.Stock);
        const minStock = parseInteger(row["Stock Minimo"]);
        const cost = parseDecimal(row.Costo);
        const wholesalePrice = parseDecimal(row["Precio Mayorista"]);
        const retailPrice = parseDecimal(row["Precio Minorista"]);

        // Validar que al menos uno de los campos requeridos tenga valor
        const hasStock = stock !== undefined && stock >= 0;
        const hasCost = isValidPositiveNumber(cost);
        const hasWholesalePrice = isValidPositiveNumber(wholesalePrice);
        const hasRetailPrice = isValidPositiveNumber(retailPrice);

        if (!hasStock && !hasCost && !hasWholesalePrice && !hasRetailPrice) {
          errors.push(
            "Debe completar al menos uno: Stock (≥0), Costo (>0), Precio Mayorista (>0), o Precio Minorista (>0)"
          );
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
          name: safeTrim(row.Nombre)!, // Ya validamos que existe
          description: safeTrim(row.Descripcion) || undefined,
          categoryId: categoryId!,
          supplierId: supplierId!,
          unit: safeTrim(row.Unidad) || "unidad",
          imageUrl: safeTrim(row["URL Imagen"]) || undefined,
          barcode: safeTrim(row["Codigo de Barras"]) || undefined,
        };

        // Solo agregar campos que tienen valores
        if (stock !== undefined) productData.stock = stock;
        if (minStock !== undefined) productData.minStock = minStock;
        if (cost !== undefined) productData.cost = cost;
        if (wholesalePrice !== undefined)
          productData.wholesalePrice = wholesalePrice;
        if (retailPrice !== undefined) productData.retailPrice = retailPrice;

        // Determinar si es creación o actualización
        const existingSku = safeTrim(row.SKU);
        let existingProduct = null;

        if (existingSku) {
          existingProduct = await prisma.product.findUnique({
            where: { sku: existingSku },
          });
        }

        // Validar código de barras duplicado si se proporciona
        if (productData.barcode) {
          const existingBarcodeProduct = await prisma.product.findUnique({
            where: { barcode: productData.barcode },
          });

          // Si existe un producto con el mismo código de barras
          if (existingBarcodeProduct) {
            // Si estamos actualizando y el código de barras pertenece al mismo producto, está bien
            if (
              existingProduct &&
              existingBarcodeProduct.id === existingProduct.id
            ) {
              // El código de barras ya pertenece a este producto, no hay problema
            } else {
              // El código de barras pertenece a otro producto, ignorar este campo
              console.log(
                `Fila ${rowNumber}: Código de barras '${productData.barcode}' ya existe, se ignora este campo`
              );
              productData.barcode = undefined; // Ignorar el código de barras duplicado
            }
          }
        }

        if (existingProduct) {
          // Actualizar producto existente - solo campos con valores
          try {
            const updateData: any = {};

            if (productData.name) updateData.name = productData.name;
            if (productData.description !== undefined)
              updateData.description = productData.description;
            if (productData.stock !== undefined)
              updateData.stock = productData.stock;
            if (productData.minStock !== undefined)
              updateData.minStock = productData.minStock;
            if (productData.cost !== undefined)
              updateData.cost = productData.cost;
            if (productData.wholesalePrice !== undefined)
              updateData.wholesalePrice = productData.wholesalePrice;
            if (productData.retailPrice !== undefined)
              updateData.retailPrice = productData.retailPrice;
            if (productData.categoryId)
              updateData.categoryId = productData.categoryId;
            if (productData.supplierId)
              updateData.supplierId = productData.supplierId;
            if (productData.unit) updateData.unit = productData.unit;
            if (productData.imageUrl !== undefined)
              updateData.imageUrl = productData.imageUrl;
            if (productData.barcode !== undefined)
              updateData.barcode = productData.barcode;

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
          } catch (updateError: any) {
            let errorMessage = "Error al actualizar producto";
            if (updateError.code === "P2002") {
              const target = updateError.meta?.target?.[0];
              if (target === "sku") {
                errorMessage = `El SKU '${productData.sku}' ya está en uso`;
              } else {
                errorMessage = `Violación de restricción única: ${target}`;
              }
            } else {
              errorMessage += `: ${updateError.message}`;
            }

            result.results.push({
              row: rowNumber,
              action: "error",
              errors: [errorMessage],
            });
            result.errorCount++;
          }
        } else {
          // Crear nuevo producto
          try {
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
            if (productData.wholesalePrice === undefined)
              productData.wholesalePrice = 0;
            if (productData.retailPrice === undefined)
              productData.retailPrice = 0;

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
          } catch (createError: any) {
            let errorMessage = "Error al crear producto";
            if (createError.code === "P2002") {
              const target = createError.meta?.target?.[0];
              if (target === "sku") {
                errorMessage = `El SKU '${productData.sku}' ya está en uso`;
              } else {
                errorMessage = `Violación de restricción única: ${target}`;
              }
            } else {
              errorMessage += `: ${createError.message}`;
            }

            result.results.push({
              row: rowNumber,
              action: "error",
              errors: [errorMessage],
            });
            result.errorCount++;
          }
        }
      } catch (error) {
        console.error(`Error procesando fila ${rowNumber}:`, error);
        result.results.push({
          row: rowNumber,
          action: "error",
          errors: [
            `Error interno: ${
              error instanceof Error ? error.message : "Error desconocido"
            }`,
          ],
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
