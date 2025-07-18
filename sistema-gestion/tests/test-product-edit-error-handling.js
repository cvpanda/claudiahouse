/**
 * Test de manejo de errores en edición de productos
 * Verifica que los errores de duplicados se manejen correctamente
 */

const BASE_URL = "http://localhost:3000";

async function testErrorHandling() {
  console.log(
    "🧪 Iniciando test de manejo de errores en edición de productos...\n"
  );

  try {
    // 1. Primero obtener lista de productos
    console.log("📋 Obteniendo productos existentes...");
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    if (!productsResponse.ok) {
      throw new Error(`Error al obtener productos: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    const products = productsData.products || productsData.data || productsData;

    if (products.length < 2) {
      console.log(
        "❌ Se necesitan al menos 2 productos para probar duplicados"
      );
      return;
    }

    const product1 = products[0];
    const product2 = products[1];

    console.log(`✅ Producto 1: ${product1.name} (ID: ${product1.id})`);
    console.log(`✅ Producto 2: ${product2.name} (ID: ${product2.id})`);

    // 2. Test 1: Intentar duplicar SKU
    if (product1.sku) {
      console.log("\n🔄 Test 1: Intentando duplicar SKU...");
      const duplicateSkuData = {
        name: product2.name,
        sku: product1.sku, // Usar el SKU del producto 1
        cost: 100,
        wholesalePrice: 120,
        retailPrice: 150,
        stock: 10,
        minStock: 5,
        unit: "unidad",
        supplierId: product2.supplierId,
        categoryId: product2.categoryId,
        isActive: true,
      };

      const skuResponse = await fetch(
        `${BASE_URL}/api/products/${product2.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicateSkuData),
        }
      );

      if (skuResponse.status === 409) {
        const errorData = await skuResponse.json();
        console.log(
          `✅ SKU duplicado detectado correctamente: ${errorData.error}`
        );
        console.log(`✅ Campo afectado: ${errorData.field}`);
      } else {
        console.log(`❌ Error: Expected 409, got ${skuResponse.status}`);
      }
    } else {
      console.log("⚠️ Saltando test de SKU - Producto 1 no tiene SKU");
    }

    // 3. Test 2: Intentar duplicar código de barras
    if (product1.barcode) {
      console.log("\n🔄 Test 2: Intentando duplicar código de barras...");
      const duplicateBarcodeData = {
        name: product2.name,
        barcode: product1.barcode, // Usar el barcode del producto 1
        cost: 100,
        wholesalePrice: 120,
        retailPrice: 150,
        stock: 10,
        minStock: 5,
        unit: "unidad",
        supplierId: product2.supplierId,
        categoryId: product2.categoryId,
        isActive: true,
      };

      const barcodeResponse = await fetch(
        `${BASE_URL}/api/products/${product2.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicateBarcodeData),
        }
      );

      if (barcodeResponse.status === 409) {
        const errorData = await barcodeResponse.json();
        console.log(
          `✅ Código de barras duplicado detectado correctamente: ${errorData.error}`
        );
        console.log(`✅ Campo afectado: ${errorData.field}`);
      } else {
        console.log(`❌ Error: Expected 409, got ${barcodeResponse.status}`);
      }
    } else {
      console.log(
        "⚠️ Saltando test de barcode - Producto 1 no tiene código de barras"
      );
    }

    // 4. Test 3: Edición válida (sin duplicados)
    console.log("\n🔄 Test 3: Edición válida...");
    const validData = {
      name: product2.name + " - Editado",
      description: "Descripción actualizada",
      cost: 50,
      wholesalePrice: 60,
      retailPrice: 80,
      stock: product2.stock,
      minStock: product2.minStock,
      unit: product2.unit,
      supplierId: product2.supplierId,
      categoryId: product2.categoryId,
      isActive: true,
    };

    const validResponse = await fetch(
      `${BASE_URL}/api/products/${product2.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validData),
      }
    );

    if (validResponse.ok) {
      console.log("✅ Edición válida realizada correctamente");

      // Restaurar el nombre original
      const restoreData = {
        ...validData,
        name: product2.name,
      };

      await fetch(`${BASE_URL}/api/products/${product2.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restoreData),
      });

      console.log("✅ Producto restaurado a su estado original");
    } else {
      const errorData = await validResponse.json();
      console.log(`❌ Error en edición válida: ${errorData.error}`);
    }

    // 5. Test 4: Manejo de campos vacíos
    console.log("\n🔄 Test 4: Manejo de campos vacíos...");
    const emptyFieldsData = {
      name: product2.name,
      sku: "", // Campo vacío
      barcode: "", // Campo vacío
      description: "",
      cost: 50,
      wholesalePrice: 60,
      retailPrice: 80,
      stock: product2.stock,
      minStock: product2.minStock,
      unit: product2.unit,
      supplierId: product2.supplierId,
      categoryId: product2.categoryId,
      isActive: true,
    };

    const emptyResponse = await fetch(
      `${BASE_URL}/api/products/${product2.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyFieldsData),
      }
    );

    if (emptyResponse.ok) {
      console.log(
        "✅ Campos vacíos manejados correctamente (convertidos a null)"
      );
    } else {
      const errorData = await emptyResponse.json();
      console.log(`❌ Error con campos vacíos: ${errorData.error}`);
    }

    console.log("\n🎉 Test de manejo de errores completado!");
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
}

// Ejecutar el test
testErrorHandling();
