const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

async function testLargeSaleCreation() {
  console.log("🧪 Test: Creación de venta con muchos productos...");

  try {
    // Primero obtener algunos productos
    const productsResponse = await fetch(`${BASE_URL}/api/products?limit=30`);
    const productsData = await productsResponse.json();

    if (!productsData.success || !productsData.data.products.length) {
      console.error("❌ No se pudieron obtener productos para el test");
      return;
    }

    const products = productsData.data.products;
    console.log(`📦 Productos disponibles: ${products.length}`);

    // Crear una venta con muchos productos (simular orden grande)
    const saleItems = products
      .slice(0, Math.min(25, products.length))
      .map((product) => ({
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
      }));

    console.log(`🛒 Creando venta con ${saleItems.length} productos...`);

    const saleData = {
      customerId: null,
      items: saleItems,
      paymentMethod: "cash",
      notes: "Test de orden grande - optimización de transacciones",
      shippingCost: 0,
      shippingType: "pickup",
    };

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
      console.error("📝 Detalles del error:", errorData);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log("✅ Venta creada exitosamente!");
      console.log(`📄 Número de venta: ${result.data.saleNumber}`);
      console.log(`💰 Total: $${result.data.total}`);
      console.log(`📦 Items: ${result.data.saleItems.length}`);
      console.log(
        `⚡ Duración: ${duration}ms (optimizado para evitar timeout)`
      );

      if (duration > 4500) {
        console.warn(
          "⚠️ ADVERTENCIA: La transacción tardó más de 4.5 segundos"
        );
        console.warn(
          "   Podría estar cerca del límite de timeout de Vercel (5s)"
        );
      } else {
        console.log("🚀 Transacción dentro del tiempo esperado");
      }
    } else {
      console.error("❌ Error en la creación de venta:", result.error);
    }
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);

    if (error.message.includes("timeout")) {
      console.error("⏰ Error de timeout detectado");
      console.error(
        "💡 La optimización de transacciones puede necesitar más ajustes"
      );
    }
  }
}

// Ejecutar el test
testLargeSaleCreation();
