/**
 * Debug específico para la compra #PC-000005
 * ID: cmek0iu2p00021h3czrsbni90
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugPurchase() {
  try {
    console.log("🔍 Depurando compra #PC-000005");
    console.log("=" .repeat(60));

    const purchase = await prisma.purchase.findUnique({
      where: { id: "cmek0iu2p00021h3czrsbni90" },
      include: {
        supplier: true,
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

    console.log("📋 Información de la compra:");
    console.log(`Número: ${purchase.purchaseNumber}`);
    console.log(`Tipo: ${purchase.type}`);
    console.log(`Moneda: ${purchase.currency || 'ARS'}`);
    console.log(`Tipo de cambio: ${purchase.exchangeRate || 1}`);
    console.log(`Estado: ${purchase.status}`);

    console.log("\n💰 Costos de importación:");
    console.log(`Flete: ${purchase.freightCost}`);
    console.log(`Aduana: ${purchase.customsCost}`);
    console.log(`Impuestos: ${purchase.taxCost}`);
    console.log(`Seguro: ${purchase.insuranceCost}`);
    console.log(`Otros: ${purchase.otherCosts}`);

    console.log("\n📦 Items de la compra:");
    purchase.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.product.name} (SKU: ${item.product.sku})`);
      console.log(`   Cantidad: ${item.quantity}`);
      console.log(`   Precio USD: ${item.unitPriceForeign || 'N/A'}`);
      console.log(`   Precio ARS: ${item.unitPricePesos}`);
      console.log(`   Subtotal ARS: ${item.subtotalPesos || (item.quantity * item.unitPricePesos)}`);
      console.log(`   Final Unit Cost: ${item.finalUnitCost || 'N/A'}`);
      
      // Estado actual del producto
      console.log(`   Costo actual del producto: ${item.product.cost}`);
    });

    // Calcular costos distribuidos como debería ser
    console.log("\n🧮 Cálculo correcto de costos distribuidos:");
    
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

    console.log(`Subtotal total productos: $${totalSubtotalPesos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
    console.log(`Total costos importación: $${totalImportCosts.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

    purchase.items.forEach((item, index) => {
      const itemSubtotalPesos = item.quantity * item.unitPricePesos;
      const proportionalCosts = totalSubtotalPesos > 0 
        ? (itemSubtotalPesos / totalSubtotalPesos) * totalImportCosts 
        : 0;
      const costPerUnit = proportionalCosts / item.quantity;
      const finalUnitCost = item.unitPricePesos + costPerUnit;

      console.log(`\n📊 ${item.product.name}:`);
      console.log(`   Subtotal item: $${itemSubtotalPesos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
      console.log(`   Costos distribuidos totales: $${proportionalCosts.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
      console.log(`   Costo distribuido por unidad: $${costPerUnit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
      console.log(`   COSTO FINAL UNITARIO: $${finalUnitCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
      console.log(`   Costo actual guardado: $${item.product.cost}`);
      console.log(`   ¿Es correcto? ${Math.abs(item.product.cost - finalUnitCost) < 0.01 ? '✅ SÍ' : '❌ NO'}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPurchase();
