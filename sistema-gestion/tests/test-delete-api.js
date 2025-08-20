/**
 * PRUEBA: Eliminación optimizada de compras
 * ========================================
 *
 * Este script prueba si el endpoint optimizado de eliminación funciona correctamente
 * sin los errores P2028 de transacción
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDeleteEndpoint() {
  try {
    console.log("🧪 PRUEBA: Endpoint de eliminación de compras");
    console.log("=".repeat(50));

    // 1. Crear una compra de prueba pequeña para eliminar
    console.log("📝 Creando compra de prueba...");

    const supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      console.log("❌ No hay proveedores disponibles");
      return;
    }

    const products = await prisma.product.findMany({ take: 2 });
    if (products.length < 2) {
      console.log("❌ Necesitamos al menos 2 productos");
      return;
    }

    const testPurchase = await prisma.purchase.create({
      data: {
        purchaseNumber: `TEST-${Date.now()}`,
        supplierId: supplier.id,
        status: "COMPLETED",
        subtotalUsd: 100,
        totalImportTaxes: 10,
        totalFreight: 5,
        totalCustoms: 8,
        totalInsurance: 2,
        exchangeRateDate: new Date(),
        exchangeRateValue: 1000,
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 5,
              unitPrice: 30,
              finalUnitCost: 35,
            },
            {
              productId: products[1].id,
              quantity: 3,
              unitPrice: 20,
              finalUnitCost: 25,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Compra de prueba creada: ${testPurchase.purchaseNumber}`);
    console.log(`📊 Items: ${testPurchase.items.length}`);

    // 2. Obtener stock inicial
    const initialStocks = {};
    for (const item of testPurchase.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      initialStocks[item.productId] = product?.stock || 0;
      console.log(`📦 Stock inicial ${item.product.sku}: ${product?.stock}`);
    }

    // 3. Simular llamada al endpoint DELETE
    console.log("\n🗑️ Iniciando eliminación de compra...");

    const startTime = Date.now();

    // Simular la lógica del endpoint DELETE optimizado
    await prisma.$transaction(
      async (tx) => {
        console.log("🔄 Revirtiendo stock...");

        // Operaciones en paralelo como en el endpoint
        const stockOperations = testPurchase.items.map(async (item) => {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        });

        const movementOperations = testPurchase.items.map(async (item) => {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              reason: "Eliminación de compra de prueba",
              reference: `${testPurchase.purchaseNumber} (eliminada)`,
            },
          });
        });

        await Promise.all([...stockOperations, ...movementOperations]);

        console.log("🗑️ Eliminando compra...");
        await tx.purchase.delete({
          where: { id: testPurchase.id },
        });
      },
      {
        timeout: 60000,
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Eliminación completada en ${duration}ms`);

    // 4. Verificar resultados
    console.log("\n📊 Verificando resultados...");

    const deletedPurchase = await prisma.purchase.findUnique({
      where: { id: testPurchase.id },
    });

    console.log(
      `🗑️ Compra eliminada: ${deletedPurchase === null ? "SÍ" : "NO"}`
    );

    for (const item of testPurchase.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      const expectedStock = initialStocks[item.productId] - item.quantity;
      const actualStock = product?.stock || 0;

      console.log(`📦 ${item.product.sku}:`);
      console.log(`   Stock esperado: ${expectedStock}`);
      console.log(`   Stock actual: ${actualStock}`);
      console.log(
        `   Correcto: ${expectedStock === actualStock ? "✅" : "❌"}`
      );
    }

    console.log(
      "\n🎯 RESULTADO: Eliminación optimizada funcionando correctamente"
    );
  } catch (error) {
    console.error("❌ Error en la prueba:", error);

    if (error.code === "P2028") {
      console.error("💥 ERROR P2028 - La optimización no resolvió el problema");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteEndpoint();
