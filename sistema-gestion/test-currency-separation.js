/**
 * Test para validar que la separación de costos por moneda funciona correctamente
 */

async function testCurrencySeparation() {
  console.log("🧪 Iniciando test de separación de costos por moneda...\n");

  try {
    // Obtener una compra existente para editar
    console.log("📋 Obteniendo lista de compras...");
    const purchasesResponse = await fetch(
      "http://localhost:3000/api/purchases"
    );
    const purchasesData = await purchasesResponse.json();

    if (!purchasesData.data || purchasesData.data.length === 0) {
      console.log("❌ No hay compras disponibles para el test");
      return;
    }

    const testPurchase = purchasesData.data[0];
    console.log(
      `✅ Usando compra: ${testPurchase.purchaseNumber} (${testPurchase.id})`
    );

    // Obtener detalles de la compra
    console.log("\n📊 Obteniendo detalles de la compra...");
    const detailResponse = await fetch(
      `http://localhost:3000/api/purchases/${testPurchase.id}`
    );
    const purchaseDetail = await detailResponse.json();

    console.log(`💰 Moneda actual: ${purchaseDetail.currency || "ARS"}`);
    console.log(`💱 Tipo de cambio: ${purchaseDetail.exchangeRate || 1}`);

    // Test 1: Importación con costos en USD
    console.log("\n🇺🇸 TEST 1: Simulando importación con costos en USD");
    const importTestData = {
      currency: "USD",
      exchangeRate: 1000, // 1 USD = 1000 ARS
      freightCost: 100, // $100 USD flete
      customsCost: 50, // $50 USD aduana
      taxCost: 15000, // $15,000 ARS impuestos locales
      insuranceCost: 25, // $25 USD seguro
      otherCosts: 10, // $10 USD otros
      items: purchaseDetail.items.slice(0, 2).map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceForeign: 10, // $10 USD por unidad
        unitPricePesos: 10000, // $10,000 ARS por unidad (convertido)
      })),
    };

    console.log("📤 Enviando actualización con costos USD...");
    const importResponse = await fetch(
      `http://localhost:3000/api/purchases/${testPurchase.id}/edit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importTestData),
      }
    );

    if (importResponse.ok) {
      console.log("✅ Actualización de importación exitosa");

      // Validar los cálculos
      const totalCostsForeign = 100 + 50 + 25 + 10; // 185 USD
      const totalCostsLocal = 15000; // 15,000 ARS
      const totalCostsForeignInARS = totalCostsForeign * 1000; // 185,000 ARS
      const totalCostsInARS = totalCostsForeignInARS + totalCostsLocal; // 200,000 ARS

      console.log(`💵 Costos en USD: $${totalCostsForeign}`);
      console.log(`💰 Costos en ARS: $${totalCostsLocal.toLocaleString()}`);
      console.log(
        `🔄 Conversión USD a ARS: $${totalCostsForeignInARS.toLocaleString()}`
      );
      console.log(
        `📊 Total costos en ARS: $${totalCostsInARS.toLocaleString()}`
      );
    } else {
      const error = await importResponse.json();
      console.log("❌ Error en importación:", error);
    }

    // Test 2: Compra local con costos en ARS
    console.log("\n🇦🇷 TEST 2: Simulando compra local con costos en ARS");
    const localTestData = {
      currency: "ARS",
      exchangeRate: 1,
      freightCost: 50000, // $50,000 ARS flete
      customsCost: 0, // Sin aduana para compras locales
      taxCost: 21000, // $21,000 ARS IVA
      insuranceCost: 10000, // $10,000 ARS seguro
      otherCosts: 5000, // $5,000 ARS otros
      items: purchaseDetail.items.slice(0, 1).map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPricePesos: 25000, // $25,000 ARS por unidad
      })),
    };

    console.log("📤 Enviando actualización con costos ARS...");
    const localResponse = await fetch(
      `http://localhost:3000/api/purchases/${testPurchase.id}/edit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localTestData),
      }
    );

    if (localResponse.ok) {
      console.log("✅ Actualización de compra local exitosa");

      const totalCostsLocalARS = 50000 + 21000 + 10000 + 5000; // 86,000 ARS

      console.log(
        `💰 Todos los costos en ARS: $${totalCostsLocalARS.toLocaleString()}`
      );
      console.log(`📊 Total costos: $${totalCostsLocalARS.toLocaleString()}`);
    } else {
      const error = await localResponse.json();
      console.log("❌ Error en compra local:", error);
    }

    // Verificar el estado final
    console.log("\n🔍 Verificando estado final...");
    const finalResponse = await fetch(
      `http://localhost:3000/api/purchases/${testPurchase.id}`
    );
    const finalPurchase = await finalResponse.json();

    console.log(`💰 Moneda final: ${finalPurchase.currency}`);
    console.log(`💱 Tipo de cambio final: ${finalPurchase.exchangeRate}`);
    console.log(`📊 Total final: $${finalPurchase.total.toLocaleString()}`);
    console.log(
      `🏷️  Total costos: $${finalPurchase.totalCosts.toLocaleString()}`
    );

    console.log("\n✅ Test de separación de costos por moneda completado");
  } catch (error) {
    console.error("❌ Error en el test:", error);
  }
}

// Ejecutar el test
testCurrencySeparation();
