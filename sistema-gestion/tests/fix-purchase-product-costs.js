/**
 * Script para corregir los costos de los productos de la compra #PC-000005
 * Los productos fueron completados con costos incorrectos y necesitan ser corregidos
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixProductCosts() {
  try {
    console.log("🔧 Corrigiendo costos de productos de la compra #PC-000005");
    console.log("=" .repeat(60));

    const purchase = await prisma.purchase.findUnique({
      where: { id: "cmek0iu2p00021h3czrsbni90" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      console.log("❌ Compra no encontrada");
      return;
    }

    if (purchase.status !== "COMPLETED") {
      console.log("❌ La compra no está completada");
      return;
    }

    console.log(`📋 Compra: ${purchase.purchaseNumber}`);
    console.log(`Items a corregir: ${purchase.items.length}`);

    // Calcular costos distribuidos correctamente
    const totalSubtotalPesos = purchase.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPricePesos),
      0
    );

    // Calcular total de costos de importación en ARS
    const freightCostARS = (purchase.freightCost || 0) * (purchase.exchangeRate || 1);
    const otherCostsARS = (purchase.otherCosts || 0) * (purchase.exchangeRate || 1);
    const insuranceCostARS = (purchase.insuranceCost || 0) * (purchase.exchangeRate || 1);

    const totalImportCosts = 
      freightCostARS +
      otherCostsARS +
      insuranceCostARS +
      (purchase.customsCost || 0) +
      (purchase.taxCost || 0);

    console.log(`💰 Total costos importación: $${totalImportCosts.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

    let correctedCount = 0;

    // Corregir cada producto
    for (const item of purchase.items) {
      const itemSubtotalPesos = item.quantity * item.unitPricePesos;
      const proportionalCosts = totalSubtotalPesos > 0 
        ? (itemSubtotalPesos / totalSubtotalPesos) * totalImportCosts 
        : 0;
      const costPerUnit = proportionalCosts / item.quantity;
      const correctFinalUnitCost = item.unitPricePesos + costPerUnit;
      const roundedFinalUnitCost = Math.round(correctFinalUnitCost * 100) / 100;

      console.log(`\n📦 ${item.product.name} (${item.product.sku || 'Sin SKU'})`);
      console.log(`   Costo actual: $${item.product.cost}`);
      console.log(`   Costo correcto: $${roundedFinalUnitCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

      if (Math.abs(item.product.cost - roundedFinalUnitCost) > 0.01) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            cost: roundedFinalUnitCost,
            updatedAt: new Date(),
          },
        });

        console.log(`   ✅ Corregido: $${item.product.cost} → $${roundedFinalUnitCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
        correctedCount++;
      } else {
        console.log(`   ℹ️ Ya estaba correcto`);
      }
    }

    console.log(`\n🎉 Corrección completada:`);
    console.log(`   Total productos: ${purchase.items.length}`);
    console.log(`   Productos corregidos: ${correctedCount}`);
    console.log(`   Productos ya correctos: ${purchase.items.length - correctedCount}`);

    if (correctedCount > 0) {
      console.log("\n✅ Los costos de los productos han sido corregidos exitosamente!");
    } else {
      console.log("\n ℹ️ Todos los costos ya estaban correctos.");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductCosts();
