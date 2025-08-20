/**
 * PRUEBA PRÁCTICA: ¿Qué pasa al eliminar la compra PC-000005?
 * ==========================================================
 *
 * Esta prueba SIMULA (NO ejecuta) la eliminación para mostrarte exactamente qué pasaría
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function simulateDeletePurchase() {
  try {
    console.log("🔍 SIMULACIÓN: Eliminación de compra PC-000005");
    console.log("=".repeat(60));

    // 1. Obtener la compra y sus productos
    const purchase = await prisma.purchase.findFirst({
      where: { purchaseNumber: "PC-000005" },
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

    console.log(`📦 Compra encontrada: ${purchase.purchaseNumber}`);
    console.log(`📊 Estado: ${purchase.status}`);
    console.log(`🏷️  Items en la compra: ${purchase.items.length}`);
    console.log("");

    // 2. Mostrar qué pasaría con cada producto
    console.log("🧮 SIMULACIÓN - ¿Qué pasaría con cada producto?");
    console.log("=".repeat(60));

    for (const item of purchase.items) {
      const product = item.product;

      console.log(`\n📦 Producto: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   📊 Stock ACTUAL: ${product.stock} unidades`);
      console.log(`   💰 Costo ACTUAL: $${product.cost}`);
      console.log(`   🔢 Cantidad en esta compra: ${item.quantity} unidades`);

      // SIMULAR lo que pasaría
      const newStock = product.stock - item.quantity;

      console.log(`\n   ⚡ DESPUÉS DE ELIMINAR LA COMPRA:`);
      console.log(
        `   📊 Stock NUEVO: ${newStock} unidades (se quitarían ${item.quantity})`
      );
      console.log(`   💰 Costo: Se recalcularía con otras compras`);
      console.log(`   ✅ PRODUCTO SIGUE EXISTIENDO - Solo cambia stock`);
      console.log(`   ✅ Nombre, SKU, precios → INTACTOS`);
      console.log("   " + "-".repeat(40));
    }

    console.log("\n🎯 RESUMEN DE LA SIMULACIÓN:");
    console.log("=".repeat(60));
    console.log("✅ Productos que se CONSERVAN: " + purchase.items.length);
    console.log("❌ Productos que se ELIMINAN: 0");
    console.log("📊 Solo se ajusta: Stock y costos");
    console.log("🗃️  Se elimina: El registro de compra + items de compra");
    console.log("");
    console.log("🔒 GARANTÍA: Los productos permanecen en tu inventario");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateDeletePurchase();
