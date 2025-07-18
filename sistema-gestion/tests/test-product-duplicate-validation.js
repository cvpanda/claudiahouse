/**
 * Test para validar el manejo de duplicados en edición de productos
 * Específicamente para códigos de barras y SKUs duplicados
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testProductDuplicateValidation() {
  console.log("🔍 Iniciando test de validación de duplicados...\n");

  try {
    // 1. Crear datos de prueba
    console.log("📦 Creando datos de prueba...");

    const category = await prisma.category.create({
      data: {
        name: "Test Duplicates",
        code: "TD",
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        name: "Test Supplier Duplicates",
        email: "test-dup@supplier.com",
      },
    });

    // Crear producto 1
    const product1 = await prisma.product.create({
      data: {
        name: "Producto Test 1",
        sku: "TD-001",
        barcode: "1234567890123",
        cost: 100,
        wholesalePrice: 150,
        retailPrice: 200,
        stock: 10,
        minStock: 5,
        unit: "unidad",
        categoryId: category.id,
        supplierId: supplier.id,
      },
    });

    // Crear producto 2
    const product2 = await prisma.product.create({
      data: {
        name: "Producto Test 2",
        sku: "TD-002",
        barcode: "9876543210987",
        cost: 120,
        wholesalePrice: 170,
        retailPrice: 220,
        stock: 15,
        minStock: 8,
        unit: "unidad",
        categoryId: category.id,
        supplierId: supplier.id,
      },
    });

    console.log(`✅ Productos creados:`);
    console.log(
      `   Producto 1: ${product1.name} (SKU: ${product1.sku}, Barcode: ${product1.barcode})`
    );
    console.log(
      `   Producto 2: ${product2.name} (SKU: ${product2.sku}, Barcode: ${product2.barcode})\n`
    );

    // 2. Simular la lógica del endpoint para validar duplicados
    const simulateProductUpdate = async (productId, updateData) => {
      try {
        const { z } = require("zod");

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

        const validatedData = productUpdateSchema.parse(updateData);

        // Verificar que el producto existe
        const existingProduct = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!existingProduct) {
          throw new Error("Producto no encontrado");
        }

        // Verificar unicidad de SKU
        if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
          const existingSku = await prisma.product.findUnique({
            where: { sku: validatedData.sku },
          });
          if (existingSku && existingSku.id !== existingProduct.id) {
            throw new Error("El SKU ya existe");
          }
        }

        // Normalizar códigos de barras: convertir strings vacíos a null
        const normalizedBarcode = validatedData.barcode?.trim() || null;
        const existingBarcode = existingProduct.barcode?.trim() || null;

        if (normalizedBarcode && normalizedBarcode !== existingBarcode) {
          const duplicateBarcode = await prisma.product.findUnique({
            where: { barcode: normalizedBarcode },
          });
          if (duplicateBarcode && duplicateBarcode.id !== existingProduct.id) {
            throw new Error("El código de barras ya existe");
          }
        }

        // Preparar datos para la actualización, normalizando valores vacíos
        const updateDataNormalized = {
          ...validatedData,
          barcode: validatedData.barcode?.trim() || null,
          imageUrl: validatedData.imageUrl?.trim() || null,
          description: validatedData.description?.trim() || null,
        };

        // Simular la actualización (sin ejecutarla realmente)
        console.log(`   ✅ Validación exitosa para producto ${productId}`);
        return { success: true, data: updateDataNormalized };
      } catch (error) {
        return { success: false, error: error.message };
      }
    };

    // 3. Test 1: Intentar usar SKU duplicado
    console.log("🧪 Test 1: Intentar actualizar con SKU duplicado...");
    const test1 = await simulateProductUpdate(product2.id, {
      sku: product1.sku, // Intentar usar el SKU del producto 1
    });

    if (!test1.success && test1.error.includes("SKU ya existe")) {
      console.log("   ✅ PASÓ: Correctamente rechazó SKU duplicado");
    } else {
      console.log("   ❌ FALLÓ: No detectó SKU duplicado");
    }

    // 4. Test 2: Intentar usar código de barras duplicado
    console.log(
      "\n🧪 Test 2: Intentar actualizar con código de barras duplicado..."
    );
    const test2 = await simulateProductUpdate(product2.id, {
      barcode: product1.barcode, // Intentar usar el barcode del producto 1
    });

    if (!test2.success && test2.error.includes("código de barras ya existe")) {
      console.log(
        "   ✅ PASÓ: Correctamente rechazó código de barras duplicado"
      );
    } else {
      console.log("   ❌ FALLÓ: No detectó código de barras duplicado");
    }

    // 5. Test 3: Actualizar con el mismo SKU (no debería dar error)
    console.log("\n🧪 Test 3: Actualizar producto con su propio SKU...");
    const test3 = await simulateProductUpdate(product1.id, {
      sku: product1.sku, // Usar el mismo SKU
      name: "Producto Test 1 - Actualizado",
    });

    if (test3.success) {
      console.log("   ✅ PASÓ: Permitió usar el mismo SKU del producto");
    } else {
      console.log("   ❌ FALLÓ: No permitió usar el mismo SKU del producto");
      console.log(`      Error: ${test3.error}`);
    }

    // 6. Test 4: Actualizar con el mismo código de barras (no debería dar error)
    console.log(
      "\n🧪 Test 4: Actualizar producto con su propio código de barras..."
    );
    const test4 = await simulateProductUpdate(product1.id, {
      barcode: product1.barcode, // Usar el mismo barcode
      name: "Producto Test 1 - Actualizado Again",
    });

    if (test4.success) {
      console.log(
        "   ✅ PASÓ: Permitió usar el mismo código de barras del producto"
      );
    } else {
      console.log(
        "   ❌ FALLÓ: No permitió usar el mismo código de barras del producto"
      );
      console.log(`      Error: ${test4.error}`);
    }

    // 7. Test 5: Manejar strings vacíos
    console.log("\n🧪 Test 5: Manejar códigos de barras vacíos...");
    const test5 = await simulateProductUpdate(product2.id, {
      barcode: "", // String vacío
      name: "Producto Test 2 - Sin Barcode",
    });

    if (test5.success) {
      console.log(
        "   ✅ PASÓ: Manejó correctamente string vacío para código de barras"
      );
      console.log(
        `      Barcode normalizado: ${
          test5.data.barcode === null ? "null" : test5.data.barcode
        }`
      );
    } else {
      console.log("   ❌ FALLÓ: No manejó string vacío para código de barras");
      console.log(`      Error: ${test5.error}`);
    }

    // 8. Test 6: SKU y barcode únicos nuevos
    console.log(
      "\n🧪 Test 6: Actualizar con SKU y código de barras únicos nuevos..."
    );
    const test6 = await simulateProductUpdate(product2.id, {
      sku: "TD-003-NEW",
      barcode: "5555666677778888",
      name: "Producto Test 2 - Completamente Nuevo",
    });

    if (test6.success) {
      console.log("   ✅ PASÓ: Permitió SKU y código de barras únicos nuevos");
    } else {
      console.log(
        "   ❌ FALLÓ: No permitió SKU y código de barras únicos nuevos"
      );
      console.log(`      Error: ${test6.error}`);
    }

    // 9. Limpieza
    console.log("\n🧹 Limpiando datos de prueba...");

    await prisma.product.deleteMany({
      where: {
        id: {
          in: [product1.id, product2.id],
        },
      },
    });

    await prisma.category.delete({
      where: { id: category.id },
    });

    await prisma.supplier.delete({
      where: { id: supplier.id },
    });

    console.log("✅ Datos de prueba eliminados\n");

    // 10. Resumen
    const tests = [test1, test2, test3, test4, test5, test6];
    const passed = tests.filter((t, i) => {
      if (i === 0 || i === 1) return !t.success; // Estos deben fallar
      return t.success; // Estos deben pasar
    }).length;

    console.log("📊 Resumen de Tests:");
    console.log(`   Tests pasados: ${passed}/${tests.length}`);
    console.log(`   Tests fallidos: ${tests.length - passed}/${tests.length}`);

    if (passed === tests.length) {
      console.log("🎉 TODOS LOS TESTS DE VALIDACIÓN DE DUPLICADOS PASARON");
    } else {
      console.log("⚠️ ALGUNOS TESTS FALLARON - Revisar validaciones");
    }
  } catch (error) {
    console.error("❌ Error en el test:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
if (require.main === module) {
  testProductDuplicateValidation()
    .then(() => {
      console.log("\n✅ Test de validación de duplicados completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test de validación falló:", error);
      process.exit(1);
    });
}

module.exports = { testProductDuplicateValidation };
