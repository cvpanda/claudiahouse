const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

async function testComboSale() {
  console.log("🧪 Test: Creación de venta con combo dinámico...");

  try {
    // Primero obtener algunos productos para el combo
    const productsResponse = await fetch(`${BASE_URL}/api/products?limit=5`);
    const productsData = await productsResponse.json();

    if (!productsData.success || !productsData.data.products.length) {
      console.error("❌ No se pudieron obtener productos para el test");
      return;
    }

    const products = productsData.data.products;
    console.log(`📦 Productos disponibles: ${products.length}`);

    // Seleccionar 3 productos para hacer un combo
    const comboProducts = products.slice(0, 3);
    console.log("🎯 Productos seleccionados para combo:");
    comboProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - $${p.retailPrice}`);
    });

    // Calcular precio del combo (con descuento del 10%)
    const originalTotal = comboProducts.reduce(
      (sum, p) => sum + p.retailPrice,
      0
    );
    const comboPrice = Math.round(originalTotal * 0.9); // 10% de descuento

    console.log(`💰 Precio original: $${originalTotal}`);
    console.log(`💰 Precio del combo: $${comboPrice} (10% descuento)`);

    // Crear la venta con combo
    const saleData = {
      customerId: null,
      items: [
        {
          itemType: "combo",
          displayName: "Set Combo Prueba",
          quantity: 1,
          unitPrice: comboPrice,
          components: comboProducts.map((p) => ({
            productId: p.id,
            quantity: 1,
          })),
        },
      ],
      paymentMethod: "cash",
      notes: "Test de combo dinámico - producto agrupado",
      shippingCost: 0,
      shippingType: "pickup",
    };

    console.log("🚀 Enviando request de venta con combo...");

    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saleData),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Tiempo de respuesta: ${duration}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error en la respuesta:", response.status);
      console.error(
        "📝 Detalles del error:",
        JSON.stringify(errorData, null, 2)
      );
      return;
    }

    const result = await response.json();

    if (result.success || result.saleNumber) {
      console.log("✅ ¡Venta con combo creada exitosamente!");
      console.log(`📄 Número de venta: ${result.saleNumber}`);
      console.log(`💰 Total: $${result.total}`);
      console.log(`📦 Items: ${result.saleItems?.length || 1}`);

      // Mostrar detalles del combo
      if (result.saleItems && result.saleItems[0]) {
        const comboItem = result.saleItems[0];
        console.log(`🎯 Combo: ${comboItem.displayName}`);
        console.log(`🔍 Tipo: ${comboItem.itemType}`);

        if (comboItem.components) {
          console.log(
            `📋 Componentes del combo (${comboItem.components.length}):`
          );
          comboItem.components.forEach((comp, i) => {
            console.log(`  ${i + 1}. ${comp.product.name} (x${comp.quantity})`);
          });
        }
      }

      console.log(`⚡ Performance: ${duration}ms`);
    } else {
      console.error("❌ Error en la creación de venta:", result.error);
    }
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

async function testGroupedSale() {
  console.log("\n🧪 Test: Creación de venta con productos agrupados...");

  try {
    // Obtener productos de la misma categoría para agrupar
    const productsResponse = await fetch(`${BASE_URL}/api/products?limit=10`);
    const productsData = await productsResponse.json();

    if (!productsData.success || !productsData.data.products.length) {
      console.error("❌ No se pudieron obtener productos para el test");
      return;
    }

    const products = productsData.data.products;

    // Agrupar por categoría (simular lapiceras del mismo tipo)
    const groupedProducts = products.slice(0, 5); // Simular 5 lapiceras diferentes
    const avgPrice = Math.round(
      groupedProducts.reduce((sum, p) => sum + p.retailPrice, 0) /
        groupedProducts.length
    );

    console.log("📝 Productos para agrupar:");
    groupedProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - $${p.retailPrice}`);
    });
    console.log(`💰 Precio promedio: $${avgPrice}`);

    // Crear venta con productos agrupados
    const saleData = {
      customerId: null,
      items: [
        {
          itemType: "grouped",
          displayName: "Productos Surtidos - Variados",
          quantity: 5, // 5 productos diferentes, 1 de cada uno
          unitPrice: avgPrice,
          components: groupedProducts.map((p) => ({
            productId: p.id,
            quantity: 1,
          })),
        },
      ],
      paymentMethod: "cash",
      notes: "Test de productos agrupados - simplificación de remito",
      shippingCost: 0,
      shippingType: "pickup",
    };

    console.log("🚀 Enviando request de venta con agrupación...");

    const response = await fetch(`${BASE_URL}/api/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error en agrupación:", response.status);
      console.error("📝 Detalles:", JSON.stringify(errorData, null, 2));
      return;
    }

    const result = await response.json();

    if (result.success || result.saleNumber) {
      console.log("✅ ¡Venta con agrupación creada exitosamente!");
      console.log(`📄 Número de venta: ${result.saleNumber}`);
      console.log(`💰 Total: $${result.total}`);

      // Mostrar que en el remito aparece como una línea
      console.log("📋 En el remito aparecerá como:");
      console.log(
        `   "${saleData.items[0].displayName}" - Cantidad: ${saleData.items[0].quantity} - Precio: $${avgPrice} cada uno`
      );

      // Pero internamente se registran todos los productos
      if (
        result.saleItems &&
        result.saleItems[0] &&
        result.saleItems[0].components
      ) {
        console.log(
          `🔍 Internamente se registraron ${result.saleItems[0].components.length} productos diferentes`
        );
      }
    } else {
      console.error("❌ Error en la creación:", result.error);
    }
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar ambos tests
async function runTests() {
  await testComboSale();
  await testGroupedSale();
}

runTests();
