// Verificar que el endpoint GET devuelve los valores correctos de costos distribuidos
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPurchaseVisualization() {
  console.log("🔍 Probando visualización de compra con costos distribuidos...");

  try {
    // Obtener una compra de importación con costos
    const purchase = await prisma.purchase.findFirst({
      where: {
        type: "IMPORT",
        totalCosts: { gt: 0 },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      console.log("❌ No se encontró ninguna compra de importación con costos");
      return;
    }

    console.log(`\n📦 Compra ID: ${purchase.id}`);
    console.log(`💰 Total costos de importación: $${purchase.totalCosts}`);
    console.log(`📊 Productos:`);

    // Simular el cálculo que hace el endpoint GET
    const totalSubtotalPesos = purchase.items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPricePesos || 0),
      0
    );

    const totalImportCosts =
      (purchase.freightCost || 0) +
      (purchase.customsCost || 0) +
      (purchase.taxCost || 0) +
      (purchase.insuranceCost || 0) +
      (purchase.otherCosts || 0);

    purchase.items.forEach((item) => {
      const itemSubtotalPesos =
        (item.quantity || 0) * (item.unitPricePesos || 0);

      // Calcular el costo distribuido proporcionalmente
      const distributedCostPesos =
        totalSubtotalPesos > 0
          ? (itemSubtotalPesos / totalSubtotalPesos) * totalImportCosts
          : 0;

      // Calcular el costo distribuido por unidad
      const distributedCostPerUnit =
        (item.quantity || 0) > 0
          ? distributedCostPesos / (item.quantity || 0)
          : 0;

      // Costo final por unidad
      const finalCostPesos =
        (item.unitPricePesos || 0) + distributedCostPerUnit;

      console.log(`\n  🏷️  ${item.product.name}`);
      console.log(`    Cantidad: ${item.quantity}`);
      console.log(
        `    Precio unitario: $${(item.unitPricePesos || 0).toFixed(2)}`
      );
      console.log(`    Subtotal: $${itemSubtotalPesos.toFixed(2)}`);
      console.log(
        `    Costo distribuido total: $${distributedCostPesos.toFixed(2)}`
      );
      console.log(
        `    Costo distribuido unitario: $${distributedCostPerUnit.toFixed(2)}`
      );
      console.log(`    Costo final unitario: $${finalCostPesos.toFixed(2)}`);

      // Comparar con los valores guardados en BD
      console.log(`\n    🗃️  Valores en BD:`);
      console.log(
        `    distributedCosts: $${(item.distributedCosts || 0).toFixed(2)}`
      );
      console.log(
        `    finalUnitCost: $${(item.finalUnitCost || 0).toFixed(2)}`
      );

      // Verificar si coinciden
      const distributedMatch =
        Math.abs(distributedCostPesos - (item.distributedCosts || 0)) < 0.01;
      const finalMatch =
        Math.abs(finalCostPesos - (item.finalUnitCost || 0)) < 0.01;

      console.log(`    ✅ Distributed match: ${distributedMatch}`);
      console.log(`    ✅ Final cost match: ${finalMatch}`);
    });

    // Ahora hacer la petición HTTP al endpoint
    console.log(`\n🌐 Probando endpoint GET /api/purchases/${purchase.id}`);

    const response = await fetch(
      `http://localhost:3000/api/purchases/${purchase.id}`
    );
    if (response.ok) {
      const data = await response.json();
      console.log(`\n📊 Respuesta del endpoint:`);
      data.items.forEach((item) => {
        console.log(`\n  🏷️  ${item.product.name}`);
        console.log(
          `    distributedCosts: $${(item.distributedCosts || 0).toFixed(2)}`
        );
        console.log(
          `    finalUnitCost: $${(item.finalUnitCost || 0).toFixed(2)}`
        );
        console.log(
          `    distributedCostPesos: $${(
            item.distributedCostPesos || 0
          ).toFixed(2)}`
        );
        console.log(
          `    finalCostPesos: $${(item.finalCostPesos || 0).toFixed(2)}`
        );
      });
    } else {
      console.log(`❌ Error en endpoint: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPurchaseVisualization();
