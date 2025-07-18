/**
 * Test simple para validar la separación de costos por moneda
 */

async function testCurrencySeparationDirect() {
  console.log("🧪 Test directo de separación de costos por moneda...\n");

  const purchaseId = "cmd8tnyi400017g326mmg6onz"; // ID de la compra de prueba

  try {
    // Test 1: Configurar como importación con costos en USD
    console.log("🇺🇸 TEST: Configurando importación con costos en USD");

    const importData = {
      currency: "USD",
      exchangeRate: 1000, // 1 USD = 1000 ARS
      freightCost: 100, // $100 USD flete
      customsCost: 50, // $50 USD aduana
      taxCost: 15000, // $15,000 ARS impuestos locales
      insuranceCost: 25, // $25 USD seguro
      otherCosts: 10, // $10 USD otros
      items: [
        {
          productId: "cmd7skn7v0006q63dh3x2htrb", // Lapicera Gel Pink
          quantity: 5,
          unitPriceForeign: 10, // $10 USD
          unitPricePesos: 10000, // $10,000 ARS (convertido)
        },
      ],
    };

    console.log("📤 Enviando datos de importación...");
    console.log("💵 Costos en USD:");
    console.log(`   • Flete: $${importData.freightCost}`);
    console.log(`   • Aduana: $${importData.customsCost}`);
    console.log(`   • Seguro: $${importData.insuranceCost}`);
    console.log(`   • Otros: $${importData.otherCosts}`);
    console.log("💰 Costos en ARS:");
    console.log(`   • Impuestos: $${importData.taxCost.toLocaleString()}`);

    const totalUSD =
      importData.freightCost +
      importData.customsCost +
      importData.insuranceCost +
      importData.otherCosts;
    const totalConvertido = totalUSD * importData.exchangeRate;
    const totalFinal = totalConvertido + importData.taxCost;

    console.log(`\n📊 Cálculo esperado:`);
    console.log(`   • Total USD: $${totalUSD}`);
    console.log(`   • Convertido a ARS: $${totalConvertido.toLocaleString()}`);
    console.log(`   • Total ARS: $${importData.taxCost.toLocaleString()}`);
    console.log(`   • TOTAL COSTOS: $${totalFinal.toLocaleString()}`);

    const response = await fetch(
      `http://localhost:3000/api/purchases/${purchaseId}/edit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log("\n✅ Actualización exitosa");
      console.log(
        "📋 Respuesta del servidor:",
        JSON.stringify(result, null, 2)
      );
    } else {
      const error = await response.json();
      console.log("\n❌ Error en la actualización:", error);
      return;
    }

    // Verificar el resultado
    console.log("\n🔍 Verificando resultado...");
    const checkResponse = await fetch(
      `http://localhost:3000/api/purchases/${purchaseId}`
    );

    if (checkResponse.ok) {
      const purchase = await checkResponse.json();
      console.log("📊 Estado de la compra:");
      console.log(`   • Moneda: ${purchase.currency}`);
      console.log(`   • Tipo de cambio: ${purchase.exchangeRate}`);
      console.log(
        `   • Total costos: $${purchase.totalCosts?.toLocaleString() || "N/A"}`
      );
      console.log(
        `   • Total compra: $${purchase.total?.toLocaleString() || "N/A"}`
      );

      // Mostrar items
      if (purchase.items && purchase.items.length > 0) {
        console.log("📦 Items:");
        purchase.items.forEach((item) => {
          console.log(
            `   • ${item.product.name}: ${
              item.quantity
            } x $${item.unitPricePesos.toLocaleString()}`
          );
          if (item.unitPriceForeign) {
            console.log(
              `     USD: ${item.quantity} x $${item.unitPriceForeign}`
            );
          }
          if (item.distributedCosts) {
            console.log(
              `     Costos distribuidos: $${item.distributedCosts.toFixed(2)}`
            );
          }
          if (item.finalUnitCost) {
            console.log(
              `     Costo final unitario: $${item.finalUnitCost.toFixed(2)}`
            );
          }
        });
      }
    } else {
      console.log("❌ Error al verificar la compra");
    }

    console.log("\n✅ Test completado exitosamente");
  } catch (error) {
    console.error("❌ Error en el test:", error);
  }
}

// Ejecutar el test
testCurrencySeparationDirect();
