// Prueba de visualización de ventas con combos y agrupaciones
console.log("🔍 Prueba de visualización de detalle de ventas\n");

const API_URL = "http://localhost:3000/api";

async function fetchSalesAndDisplay() {
  try {
    console.log("📊 Obteniendo lista de ventas...");

    const response = await fetch(`${API_URL}/sales?limit=10`);
    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Error obteniendo ventas:", result.error);
      return;
    }

    console.log(`✅ Se encontraron ${result.data.length} ventas`);

    // Buscar ventas con combos o agrupaciones
    const salesWithCombos = result.data.filter((sale) =>
      sale.saleItems.some((item) => item.itemType && item.itemType !== "simple")
    );

    console.log(`🎯 Ventas con combos/agrupaciones: ${salesWithCombos.length}`);

    if (salesWithCombos.length === 0) {
      console.log("ℹ️ No se encontraron ventas con combos o agrupaciones.");
      console.log(
        "💡 Ejecuta primero test-combo-agrupacion-complete.js para crear ventas de prueba."
      );
      return;
    }

    // Mostrar detalles de cada venta con combos/agrupaciones
    salesWithCombos.forEach((sale, index) => {
      console.log(`\n📋 Venta ${index + 1}: ${sale.saleNumber}`);
      console.log(`   💰 Total: $${sale.total}`);
      console.log(
        `   📅 Fecha: ${new Date(sale.createdAt).toLocaleDateString()}`
      );
      console.log(`   🌐 URL: http://localhost:3000/sales/${sale.id}`);

      console.log(`   📦 Items (${sale.saleItems.length}):`);
      sale.saleItems.forEach((item, itemIndex) => {
        const itemType = item.itemType || "simple";
        const displayName = item.displayName || "Producto sin nombre";

        if (itemType === "simple") {
          console.log(
            `     ${itemIndex + 1}. ${item.product?.name || "Producto"} - $${
              item.unitPrice
            } x${item.quantity}`
          );
        } else {
          console.log(
            `     ${itemIndex + 1}. ${displayName} (${
              itemType === "combo" ? "Combo" : "Agrupación"
            }) - $${item.unitPrice} x${item.quantity}`
          );

          if (item.components && item.components.length > 0) {
            console.log(`        🧩 Componentes:`);
            item.components.forEach((comp, compIndex) => {
              console.log(
                `           - ${comp.product?.name || "Producto"} x${
                  comp.quantity
                }`
              );
            });
          }
        }
      });
    });

    if (salesWithCombos.length > 0) {
      console.log(
        `\n✨ ¡Prueba las URLs arriba para verificar que la página de detalle funcione correctamente!`
      );
      console.log(`💡 La página ahora debería mostrar correctamente:`);
      console.log(`   - Nombres de combos y agrupaciones en lugar de "null"`);
      console.log(`   - Tipos apropiados (Combo/Agrupación)`);
      console.log(`   - Componentes individuales como badges`);
      console.log(`   - Unidades correctas (combo/pack en lugar de null)`);
    }
  } catch (error) {
    console.error("❌ Error de red:", error.message);
  }
}

async function runDisplayTest() {
  console.log("🚀 Iniciando prueba de visualización...\n");
  await fetchSalesAndDisplay();
  console.log("\n✅ Prueba completada");
}

// Ejecutar la prueba
runDisplayTest().catch(console.error);
