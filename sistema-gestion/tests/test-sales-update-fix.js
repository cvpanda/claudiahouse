console.log(
  "🔧 Test de corrección de actualización de ventas con items agrupados\n"
);

const BASE_URL = "http://localhost:3000";

async function testSalesUpdateFix() {
  try {
    console.log("🔍 Buscando ventas existentes con items agrupados...");

    // Obtener ventas existentes
    const salesResponse = await fetch(`${BASE_URL}/api/sales?limit=10`);
    const salesData = await salesResponse.json();

    if (!salesData.data || salesData.data.length === 0) {
      console.log("❌ No se encontraron ventas para probar");
      return;
    }

    // Buscar una venta con items agrupados
    let saleWithGroupedItems = null;
    for (const sale of salesData.data) {
      const hasGroupedItems = sale.saleItems.some(
        (item) =>
          item.itemType === "grouped" ||
          item.itemType === "combo" ||
          item.productId === null
      );
      if (hasGroupedItems) {
        saleWithGroupedItems = sale;
        break;
      }
    }

    if (!saleWithGroupedItems) {
      console.log(
        "❌ No se encontraron ventas con items agrupados para probar"
      );
      console.log(
        "💡 Necesitas crear una venta con combos/agrupaciones primero"
      );
      return;
    }

    console.log(
      `✅ Encontrada venta con items agrupados: ${saleWithGroupedItems.saleNumber}`
    );
    console.log(`📦 Items: ${saleWithGroupedItems.saleItems.length}`);

    // Mostrar estructura actual
    saleWithGroupedItems.saleItems.forEach((item, index) => {
      console.log(
        `   ${index + 1}. ${item.displayName || item.product?.name || "Item"}`
      );
      console.log(`      - Tipo: ${item.itemType || "simple"}`);
      console.log(`      - ProductId: ${item.productId}`);
      console.log(`      - Cantidad: ${item.quantity}`);
      console.log(`      - Precio: $${item.unitPrice}`);
      if (item.components && item.components.length > 0) {
        console.log(`      - Componentes: ${item.components.length}`);
      }
    });

    console.log("\n🧪 Probando actualización de costo de envío...");

    // Intentar actualizar solo el costo de envío (sin modificar items)
    const updateData = {
      shippingCost: (saleWithGroupedItems.shippingCost || 0) + 100, // Agregar $100
      notes: `Test de actualización - ${new Date().toISOString()}`,
    };

    console.log("📝 Datos de actualización:", updateData);

    const updateResponse = await fetch(
      `${BASE_URL}/api/sales/${saleWithGroupedItems.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log("✅ Actualización exitosa!");
      console.log(
        `💰 Nuevo costo de envío: $${
          result.data.shippingCost || result.shippingCost
        }`
      );
      console.log(
        `📝 Notas actualizadas: ${result.data.notes || result.notes}`
      );
    } else {
      const error = await updateResponse.json();
      console.error("❌ Error en actualización:", error);
      console.error("🔍 Status:", updateResponse.status);

      if (error.details) {
        console.error("📋 Detalles del error:");
        console.error(JSON.stringify(error.details, null, 2));
      }
    }
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar el test
testSalesUpdateFix();
