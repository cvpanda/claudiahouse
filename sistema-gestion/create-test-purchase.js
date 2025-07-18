// Script para crear una compra de prueba en estado PENDING

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTestPurchase() {
  console.log("=== CREATING TEST PURCHASE FOR EDITING ===\n");

  try {
    // Obtener un proveedor existente
    const supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      console.log("❌ No hay proveedores disponibles");
      return;
    }

    // Obtener algunos productos existentes
    const products = await prisma.product.findMany({
      take: 2,
    });

    if (products.length < 2) {
      console.log("❌ No hay suficientes productos disponibles");
      return;
    }

    // Crear número de compra único
    const existingPurchases = await prisma.purchase.count();
    const purchaseNumber = `PC-TEST-${String(existingPurchases + 1).padStart(
      6,
      "0"
    )}`;

    // Crear la compra de prueba
    const testPurchase = await prisma.purchase.create({
      data: {
        purchaseNumber,
        supplierId: supplier.id,
        type: "LOCAL",
        currency: "ARS",
        exchangeRate: null,
        exchangeType: null,
        freightCost: 0,
        customsCost: 0,
        taxCost: 0,
        insuranceCost: 0,
        otherCosts: 0,
        subtotalPesos: 0, // Se calculará después
        totalCosts: 0,
        total: 0, // Se calculará después
        status: "PENDING",
        orderDate: new Date(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
        notes: "Compra de prueba para testear edición",
      },
    });

    // Crear items de la compra
    const items = [];
    let subtotalPesos = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const quantity = (i + 1) * 10; // 10, 20, etc.
      const unitPricePesos =
        Math.round((product.cost || 100) * 0.8 * 100) / 100; // 80% del costo actual
      const totalCost = quantity * unitPricePesos;

      subtotalPesos += quantity * unitPricePesos;

      const item = await prisma.purchaseItem.create({
        data: {
          purchaseId: testPurchase.id,
          productId: product.id,
          quantity,
          unitPriceForeign: null,
          unitPricePesos,
          distributedCosts: 0,
          finalUnitCost: unitPricePesos,
          totalCost,
        },
      });

      items.push({
        product: product.name,
        quantity,
        unitPrice: unitPricePesos,
        total: totalCost,
      });
    }

    // Actualizar totales de la compra
    await prisma.purchase.update({
      where: { id: testPurchase.id },
      data: {
        subtotalPesos,
        total: subtotalPesos,
      },
    });

    console.log("✅ Compra de prueba creada exitosamente:");
    console.log(`   ID: ${testPurchase.id}`);
    console.log(`   Número: ${testPurchase.purchaseNumber}`);
    console.log(`   Estado: ${testPurchase.status}`);
    console.log(`   Proveedor: ${supplier.name}`);
    console.log(
      `   Total: $${subtotalPesos.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}\n`
    );

    console.log("📦 Items de la compra:");
    items.forEach((item) => {
      console.log(
        `   ${item.product}: ${item.quantity} x $${
          item.unitPrice
        } = $${item.total.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
    });
    console.log();

    console.log("🔧 Ahora puedes:");
    console.log(
      `   1. Editar la compra en: http://localhost:3000/purchases/${testPurchase.id}`
    );
    console.log(`   2. Eliminar la compra desde la interfaz`);
    console.log(`   3. Testear los endpoints de API\n`);

    console.log("🎯 Esta compra está en estado PENDING, por lo que:");
    console.log("   ✅ Puede editarse");
    console.log("   ✅ Puede eliminarse");
    console.log("   ✅ No tiene impacto en stock (no completada)");
  } catch (error) {
    console.error("❌ Error creando compra de prueba:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la creación
createTestPurchase();
