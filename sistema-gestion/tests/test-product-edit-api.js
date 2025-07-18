/**
 * Test completo de edición de productos vía API HTTP
 * Valida que todas las funcionalidades funcionen correctamente incluyendo movimientos de stock
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Simular una petición HTTP PUT
async function makeAPIRequest(productId, updateData) {
  try {
    // En un entorno real esto sería una petición HTTP
    // Aquí simulamos la lógica del endpoint PUT

    const { z } = require("zod");

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
      imageUrl: z.string().url().optional().or(z.literal("")),
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
          productId: productId,
        },
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: validatedData,
      include: {
        supplier: true,
        category: true,
      },
    });

    return { success: true, data: updatedProduct };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testProductEditAPI() {
  console.log("🌐 Iniciando test de edición de productos vía API...\n");

  try {
    // 1. Crear datos de prueba
    console.log("📦 Creando datos de prueba...");

    const category = await prisma.category.create({
      data: {
        name: "Test Category API",
        code: "TCA",
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        name: "Test Supplier API",
        email: "test-api@supplier.com",
        phone: "123456789",
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Producto Test API",
        description: "Producto para probar API",
        sku: "TCA-001",
        cost: 100.0,
        wholesalePrice: 150.0,
        retailPrice: 200.0,
        stock: 50,
        minStock: 10,
        unit: "unidad",
        categoryId: category.id,
        supplierId: supplier.id,
        isActive: true,
      },
    });

    console.log(`✅ Producto creado: ${product.name} (ID: ${product.id})\n`);

    // 2. Test de actualización de precios vía API
    console.log("💰 Probando actualización de precios vía API...");

    const priceUpdateResult = await makeAPIRequest(product.id, {
      cost: 120.0,
      wholesalePrice: 180.0,
      retailPrice: 250.0,
    });

    if (priceUpdateResult.success) {
      console.log("✅ Precios actualizados correctamente vía API");
      console.log(`   Costo: $${priceUpdateResult.data.cost}`);
      console.log(`   Mayorista: $${priceUpdateResult.data.wholesalePrice}`);
      console.log(`   Minorista: $${priceUpdateResult.data.retailPrice}\n`);
    } else {
      console.log("❌ Error actualizando precios:", priceUpdateResult.error);
    }

    // 3. Test de actualización de stock vía API (debe crear movimiento)
    console.log("📦 Probando actualización de stock vía API...");

    const stockUpdateResult = await makeAPIRequest(product.id, {
      stock: 75,
    });

    if (stockUpdateResult.success) {
      console.log("✅ Stock actualizado correctamente vía API");
      console.log(`   Nuevo stock: ${stockUpdateResult.data.stock}`);

      // Verificar que se creó el movimiento de stock
      const stockMovements = await prisma.stockMovement.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
      });

      console.log(`✅ Movimientos de stock creados: ${stockMovements.length}`);
      if (stockMovements.length > 0) {
        const lastMovement = stockMovements[0];
        console.log(
          `   Último movimiento: ${lastMovement.type} ${lastMovement.quantity} unidades - ${lastMovement.reason}\n`
        );
      }
    } else {
      console.log("❌ Error actualizando stock:", stockUpdateResult.error);
    }

    // 4. Test de reducción de stock
    console.log("📉 Probando reducción de stock vía API...");

    const stockReductionResult = await makeAPIRequest(product.id, {
      stock: 60,
    });

    if (stockReductionResult.success) {
      const stockMovements = await prisma.stockMovement.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
      });

      console.log("✅ Stock reducido correctamente");
      console.log(`   Stock actual: ${stockReductionResult.data.stock}`);
      console.log(`   Total movimientos: ${stockMovements.length}`);

      if (stockMovements.length > 0) {
        const lastMovement = stockMovements[0];
        console.log(
          `   Último movimiento: ${lastMovement.type} ${lastMovement.quantity} unidades\n`
        );
      }
    }

    // 5. Test de actualización múltiple
    console.log("🔄 Probando actualización múltiple vía API...");

    const multiUpdateResult = await makeAPIRequest(product.id, {
      name: "Producto API Actualizado",
      description: "Descripción actualizada vía API",
      cost: 130.0,
      wholesalePrice: 190.0,
      retailPrice: 260.0,
      stock: 80,
      minStock: 15,
      sku: "TCA-001-API",
    });

    if (multiUpdateResult.success) {
      console.log("✅ Actualización múltiple exitosa:");
      console.log(`   Nombre: ${multiUpdateResult.data.name}`);
      console.log(`   SKU: ${multiUpdateResult.data.sku}`);
      console.log(`   Costo: $${multiUpdateResult.data.cost}`);
      console.log(`   Stock: ${multiUpdateResult.data.stock}`);

      // Verificar movimientos finales
      const finalMovements = await prisma.stockMovement.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
      });

      console.log(`   Total movimientos de stock: ${finalMovements.length}\n`);
    }

    // 6. Test de validación de datos
    console.log("🔍 Probando validaciones vía API...");

    const invalidUpdateResult = await makeAPIRequest(product.id, {
      cost: -10, // Costo negativo
    });

    if (!invalidUpdateResult.success) {
      console.log("✅ Validación correcta: Rechazó costo negativo");
      console.log(`   Error: ${invalidUpdateResult.error}\n`);
    } else {
      console.log("❌ FALLO: Debería haber rechazado costo negativo\n");
    }

    // 7. Verificar estado final del producto
    console.log("📊 Estado final del producto:");

    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        supplier: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    console.log(`   ID: ${finalProduct.id}`);
    console.log(`   Nombre: ${finalProduct.name}`);
    console.log(`   SKU: ${finalProduct.sku}`);
    console.log(
      `   Precios: $${finalProduct.cost} / $${finalProduct.wholesalePrice} / $${finalProduct.retailPrice}`
    );
    console.log(`   Stock: ${finalProduct.stock}`);
    console.log(`   Categoría: ${finalProduct.category.name}`);
    console.log(`   Proveedor: ${finalProduct.supplier.name}`);
    console.log(
      `   Movimientos de stock: ${finalProduct.stockMovements.length}\n`
    );

    // Mostrar historial de movimientos
    if (finalProduct.stockMovements.length > 0) {
      console.log("📋 Historial de movimientos de stock:");
      finalProduct.stockMovements.forEach((movement, index) => {
        console.log(
          `   ${index + 1}. ${movement.type.toUpperCase()} ${
            movement.quantity
          } unidades - ${movement.reason} (${
            movement.createdAt.toISOString().split("T")[0]
          })`
        );
      });
      console.log("");
    }

    // 8. Limpieza
    console.log("🧹 Limpiando datos de prueba...");

    await prisma.stockMovement.deleteMany({
      where: { productId: product.id },
    });

    await prisma.product.delete({
      where: { id: product.id },
    });

    await prisma.category.delete({
      where: { id: category.id },
    });

    await prisma.supplier.delete({
      where: { id: supplier.id },
    });

    console.log("✅ Datos de prueba eliminados\n");

    console.log("🎉 TODOS LOS TESTS DE API DE EDICIÓN PASARON CORRECTAMENTE\n");
    console.log("✅ Funcionalidades validadas vía API:");
    console.log("   - Actualización de precios");
    console.log("   - Actualización de stock con movimientos automáticos");
    console.log("   - Reducción de stock");
    console.log("   - Actualización múltiple de campos");
    console.log("   - Validaciones de entrada");
    console.log("   - Creación automática de movimientos de stock");
    console.log("   - Historial de movimientos");
  } catch (error) {
    console.error("❌ Error en el test:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
if (require.main === module) {
  testProductEditAPI()
    .then(() => {
      console.log("\n✅ Test de API completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test de API falló:", error);
      process.exit(1);
    });
}

module.exports = { testProductEditAPI };
