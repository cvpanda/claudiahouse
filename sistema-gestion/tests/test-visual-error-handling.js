/**
 * Test visual de manejo de errores en edición de productos
 * Simula interacciones de usuario con códigos de barras duplicados
 */

const BASE_URL = "http://localhost:3000";

async function testVisualErrorHandling() {
  console.log("🧪 Iniciando test visual de manejo de errores...\n");

  try {
    // 1. Obtener productos existentes
    console.log("📋 Obteniendo productos...");
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    if (!productsResponse.ok) {
      throw new Error(`Error al obtener productos: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    const products = productsData.products || productsData.data || productsData;

    // Buscar productos con SKU y barcode
    const productWithSku = products.find((p) => p.sku);
    const productWithBarcode = products.find((p) => p.barcode);
    const targetProduct = products.find(
      (p) => p.id !== productWithSku?.id && p.id !== productWithBarcode?.id
    );

    if (!targetProduct) {
      console.log("❌ No se encontró producto objetivo para testing");
      return;
    }

    console.log(
      `✅ Producto objetivo: ${targetProduct.name} (ID: ${targetProduct.id})`
    );

    // 2. Test de duplicado de SKU con respuesta visual
    if (productWithSku) {
      console.log(`\n🔄 Test 1: Simulando edición con SKU duplicado...`);
      console.log(
        `   SKU a duplicar: ${productWithSku.sku} (de ${productWithSku.name})`
      );

      const duplicateSkuData = {
        name: targetProduct.name,
        sku: productWithSku.sku, // Duplicado
        cost: targetProduct.cost,
        wholesalePrice: targetProduct.wholesalePrice,
        retailPrice: targetProduct.retailPrice,
        stock: targetProduct.stock,
        minStock: targetProduct.minStock,
        unit: targetProduct.unit,
        supplierId: targetProduct.supplierId,
        categoryId: targetProduct.categoryId,
        isActive: true,
      };

      const skuResponse = await fetch(
        `${BASE_URL}/api/products/${targetProduct.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicateSkuData),
        }
      );

      console.log(`   Status: ${skuResponse.status}`);

      if (skuResponse.status === 409) {
        const errorData = await skuResponse.json();
        console.log(`   ✅ Error detectado: ${errorData.error}`);
        console.log(`   ✅ Campo afectado: ${errorData.field}`);
        console.log(
          `   📝 Mensaje que verá el usuario en el campo SKU: "${errorData.error}"`
        );
        console.log(
          `   🎨 El campo SKU debería tener borde rojo y mostrar el mensaje de error`
        );
      } else {
        console.log(`   ❌ Error inesperado. Status: ${skuResponse.status}`);
      }
    }

    // 3. Test de duplicado de código de barras
    if (productWithBarcode) {
      console.log(
        `\n🔄 Test 2: Simulando edición con código de barras duplicado...`
      );
      console.log(
        `   Barcode a duplicar: ${productWithBarcode.barcode} (de ${productWithBarcode.name})`
      );

      const duplicateBarcodeData = {
        name: targetProduct.name,
        barcode: productWithBarcode.barcode, // Duplicado
        cost: targetProduct.cost,
        wholesalePrice: targetProduct.wholesalePrice,
        retailPrice: targetProduct.retailPrice,
        stock: targetProduct.stock,
        minStock: targetProduct.minStock,
        unit: targetProduct.unit,
        supplierId: targetProduct.supplierId,
        categoryId: targetProduct.categoryId,
        isActive: true,
      };

      const barcodeResponse = await fetch(
        `${BASE_URL}/api/products/${targetProduct.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicateBarcodeData),
        }
      );

      console.log(`   Status: ${barcodeResponse.status}`);

      if (barcodeResponse.status === 409) {
        const errorData = await barcodeResponse.json();
        console.log(`   ✅ Error detectado: ${errorData.error}`);
        console.log(`   ✅ Campo afectado: ${errorData.field}`);
        console.log(
          `   📝 Mensaje que verá el usuario en el campo Código de Barras: "${errorData.error}"`
        );
        console.log(
          `   🎨 El campo Código de Barras debería tener borde rojo y mostrar el mensaje de error`
        );
      } else {
        console.log(
          `   ❌ Error inesperado. Status: ${barcodeResponse.status}`
        );
      }
    }

    // 4. Test de validación de precios
    console.log(`\n🔄 Test 3: Simulando error de validación de precios...`);
    const invalidPricesData = {
      name: targetProduct.name,
      cost: 100,
      wholesalePrice: 80, // Menor que el costo
      retailPrice: 150,
      stock: targetProduct.stock,
      minStock: targetProduct.minStock,
      unit: targetProduct.unit,
      supplierId: targetProduct.supplierId,
      categoryId: targetProduct.categoryId,
      isActive: true,
    };

    // Este error se detecta en el frontend, no en el backend
    console.log(
      `   📝 Datos: Costo: $${invalidPricesData.cost}, Mayorista: $${invalidPricesData.wholesalePrice}`
    );
    console.log(
      `   ✅ Error esperado: "El precio mayorista no puede ser menor al costo"`
    );
    console.log(
      `   🎨 Se debería mostrar una alerta roja en la parte superior del formulario`
    );

    console.log("\n🎯 Resumen de pruebas visuales:");
    console.log("1. Campos con errores de duplicados deben tener:");
    console.log("   - Borde rojo");
    console.log("   - Mensaje de error debajo del campo");
    console.log("   - Error se limpia cuando el usuario empieza a escribir");
    console.log("\n2. Errores generales deben aparecer en:");
    console.log("   - Alerta roja en la parte superior del formulario");
    console.log("   - Botón de cerrar (X) para dismiss");
    console.log("\n3. Navegue a: http://localhost:3000/products");
    console.log(`   Edite el producto: ${targetProduct.name}`);
    console.log(`   Para probar estos escenarios de error`);
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
}

// Ejecutar el test
testVisualErrorHandling();
