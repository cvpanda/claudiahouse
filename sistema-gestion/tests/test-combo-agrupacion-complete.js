// Prueba completa de funcionalidad de combos y agrupaciones
console.log("🧪 Prueba completa de combos y agrupaciones\n");

// URL de la API
const API_URL = "http://localhost:3000/api";

// Datos de prueba para agrupación (suma cantidades, precio unitario común)
const testAgrupacionSale = {
  customerId: null,
  items: [
    {
      itemType: "grouped",
      displayName: "Lapiceras",
      quantity: 1, // La cantidad es 1 pero internamente contiene 3 lapiceras
      unitPrice: 3700, // Precio unitario común para todas
      components: [
        { productId: "clydw79qo000008jxf0z7e4lk", quantity: 2 }, // 2 lapiceras rosas
        { productId: "clydw79qo000108jx7k8g3m4p", quantity: 1 }, // 1 lapicera negra
      ],
    },
  ],
  paymentMethod: "efectivo",
  discount: 0,
  tax: 0,
  shippingCost: 0,
  subtotal: 3700,
  total: 3700,
};

// Datos de prueba para combo (precio especial)
const testComboSale = {
  customerId: null,
  items: [
    {
      itemType: "combo",
      displayName: "Combo Oficina",
      quantity: 1,
      unitPrice: 8500, // Precio especial para el combo
      components: [
        { productId: "clydw79qo000008jxf0z7e4lk", quantity: 2 }, // 2 lapiceras
        { productId: "clydw79qo000208jx9n4h2k6l", quantity: 1 }, // 1 cuaderno
      ],
    },
  ],
  paymentMethod: "efectivo",
  discount: 0,
  tax: 0,
  shippingCost: 0,
  subtotal: 8500,
  total: 8500,
};

async function testSaleCreation(saleData, testName) {
  try {
    console.log(`📝 Probando ${testName}...`);

    const response = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saleData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Error en ${testName}:`, result.error);
      if (result.details) {
        console.error("Detalles:", result.details);
      }
      return false;
    }

    console.log(`✅ ${testName} creada exitosamente!`);
    console.log(`   - ID: ${result.id}`);
    console.log(`   - Número: ${result.saleNumber}`);
    console.log(`   - Total: $${result.total}`);
    console.log(`   - Items: ${result.saleItems.length}`);

    // Mostrar detalles de los items con componentes
    result.saleItems.forEach((item, index) => {
      console.log(
        `   - Item ${index + 1}: ${item.displayName || "Item simple"}`
      );
      console.log(
        `     Tipo: ${item.itemType}, Cantidad: ${item.quantity}, Precio: $${item.unitPrice}`
      );

      if (item.components && item.components.length > 0) {
        console.log(`     Componentes:`);
        item.components.forEach((comp, compIndex) => {
          console.log(
            `       ${compIndex + 1}. ${comp.product.name} x${comp.quantity}`
          );
        });
      }
    });

    console.log("");
    return true;
  } catch (error) {
    console.error(`❌ Error de red en ${testName}:`, error.message);
    return false;
  }
}

async function testSalesRetrieval() {
  try {
    console.log("📊 Probando recuperación de ventas...");

    const response = await fetch(`${API_URL}/sales?limit=5`);
    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Error recuperando ventas:", result.error);
      return false;
    }

    console.log(`✅ Ventas recuperadas exitosamente!`);
    console.log(`   - Total de ventas: ${result.pagination.total}`);
    console.log(`   - Ventas en esta página: ${result.data.length}`);

    // Mostrar detalles de ventas con combos/agrupaciones
    result.data.forEach((sale, index) => {
      const hasComplexItems = sale.saleItems.some(
        (item) => item.itemType !== "simple"
      );
      if (hasComplexItems) {
        console.log(
          `   - Venta ${index + 1}: ${sale.saleNumber} - $${sale.total}`
        );
        sale.saleItems.forEach((item, itemIndex) => {
          if (item.itemType !== "simple") {
            console.log(
              `     Item ${itemIndex + 1}: ${item.displayName} (${
                item.itemType
              })`
            );
            if (item.components) {
              item.components.forEach((comp, compIndex) => {
                console.log(
                  `       ${compIndex + 1}. ${
                    comp.product?.name || "Producto"
                  } x${comp.quantity}`
                );
              });
            }
          }
        });
      }
    });

    console.log("");
    return true;
  } catch (error) {
    console.error("❌ Error de red recuperando ventas:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Iniciando pruebas de combos y agrupaciones...\n");

  let successCount = 0;
  let totalTests = 0;

  // Prueba 1: Crear agrupación
  totalTests++;
  if (await testSaleCreation(testAgrupacionSale, "Agrupación de Lapiceras")) {
    successCount++;
  }

  // Esperar un poco entre pruebas
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Prueba 2: Crear combo
  totalTests++;
  if (await testSaleCreation(testComboSale, "Combo de Oficina")) {
    successCount++;
  }

  // Esperar un poco entre pruebas
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Prueba 3: Recuperar ventas
  totalTests++;
  if (await testSalesRetrieval()) {
    successCount++;
  }

  console.log(`\n📊 Resumen de pruebas:`);
  console.log(`   ✅ Exitosas: ${successCount}`);
  console.log(`   ❌ Fallidas: ${totalTests - successCount}`);
  console.log(
    `   📈 Tasa de éxito: ${((successCount / totalTests) * 100).toFixed(1)}%`
  );

  if (successCount === totalTests) {
    console.log(
      "\n🎉 ¡Todas las pruebas pasaron! La funcionalidad de combos y agrupaciones está funcionando correctamente."
    );
  } else {
    console.log("\n⚠️ Algunas pruebas fallaron. Revisa los errores arriba.");
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);
