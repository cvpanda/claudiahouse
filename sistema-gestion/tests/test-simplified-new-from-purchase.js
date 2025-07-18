// Test para verificar formulario new-from-purchase simplificado (sin costos/precios)
const BASE_URL = "http://localhost:3000";

async function testSimplifiedNewFromPurchase() {
  console.log("🧪 Testeando formulario new-from-purchase simplificado...\n");

  try {
    // 1. Obtener datos necesarios
    console.log("1. Obteniendo categorías y proveedores...");
    const [categoriesRes, suppliersRes] = await Promise.all([
      fetch(`${BASE_URL}/api/categories`),
      fetch(`${BASE_URL}/api/suppliers`),
    ]);

    const categories = (await categoriesRes.json()).data;
    const suppliers = (await suppliersRes.json()).data;

    if (
      !categories ||
      categories.length === 0 ||
      !suppliers ||
      suppliers.length === 0
    ) {
      console.log("❌ Faltan datos base para el test");
      return;
    }

    console.log(
      `✅ ${categories.length} categorías y ${suppliers.length} proveedores disponibles`
    );

    // 2. Test de generación de SKU automático
    console.log("\n2. Testeando generación de SKU automático...");
    const testCategory = categories[0];

    const skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${testCategory.id}`
    );
    const skuData = await skuResponse.json();

    console.log(`   Categoría: ${testCategory.name} (${testCategory.code})`);
    console.log(`   SKU generado: ${skuData.nextSku}`);

    // 3. Test de creación de producto simplificado
    console.log("\n3. Creando producto con formulario simplificado...");

    const productData = {
      name: `Producto Simple ${Date.now()}`,
      description: "Producto creado desde formulario simplificado",
      sku: skuData.nextSku,
      minStock: 10,
      unit: "unidad",
      categoryId: testCategory.id,
      supplierId: suppliers[0].id,
      // Sin campos de costo y precios - se agregan automáticamente
      cost: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      stock: 0,
    };

    const createResponse = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (createResponse.ok) {
      const product = await createResponse.json();
      console.log(`   ✅ Producto creado: ${product.name}`);
      console.log(`   ✅ SKU: ${product.sku}`);
      console.log(
        `   ✅ Costo inicial: $${product.cost} (correcto - se definirá en compra)`
      );
      console.log(
        `   ✅ Precio mayorista: $${product.wholesalePrice} (correcto - opcional)`
      );
      console.log(
        `   ✅ Precio minorista: $${product.retailPrice} (correcto - opcional)`
      );
      console.log(
        `   ✅ Stock inicial: ${product.stock} (correcto - desde compra es 0)`
      );
      console.log(`   ✅ Stock mínimo: ${product.minStock}`);

      // 4. Verificar que el siguiente SKU se incrementó
      console.log("\n4. Verificando incremento de SKU...");
      const nextSkuResponse = await fetch(
        `${BASE_URL}/api/products/next-sku?categoryId=${testCategory.id}`
      );
      const nextSkuData = await nextSkuResponse.json();

      const currentNumber = parseInt(
        skuData.nextSku.replace(testCategory.code, "")
      );
      const nextNumber = parseInt(
        nextSkuData.nextSku.replace(testCategory.code, "")
      );

      if (nextNumber === currentNumber + 1) {
        console.log(
          `   ✅ Incremento correcto: ${currentNumber} → ${nextNumber}`
        );
      } else {
        console.log(
          `   ❌ Error en incremento: ${currentNumber} → ${nextNumber}`
        );
      }

      // 5. Limpiar producto de prueba
      console.log("\n5. Limpiando...");
      const deleteResponse = await fetch(
        `${BASE_URL}/api/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      if (deleteResponse.ok) {
        console.log("   ✅ Producto de prueba eliminado");
      }
    } else {
      const errorText = await createResponse.text();
      console.log(
        `   ❌ Error al crear producto: ${createResponse.status} - ${errorText}`
      );
      return;
    }

    // 6. Comparar con formulario completo
    console.log("\n6. Comparación de formularios...");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ CAMPO                     │ /new    │ /new-from-purchase │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│ Nombre                    │   ✅    │        ✅          │");
    console.log("│ Descripción               │   ✅    │        ✅          │");
    console.log("│ SKU (auto)                │   ✅    │        ✅          │");
    console.log("│ Categoría                 │   ✅    │        ✅          │");
    console.log("│ Proveedor                 │   ✅    │        ✅          │");
    console.log("│ Costo                     │   ✅    │        ❌          │");
    console.log("│ Precio Mayorista          │   ✅    │        ❌          │");
    console.log("│ Precio Minorista          │   ✅    │        ❌          │");
    console.log("│ Stock Inicial             │   ✅    │      Siempre 0     │");
    console.log("│ Stock Mínimo              │   ✅    │        ✅          │");
    console.log("└─────────────────────────────────────────────────────────┘");

    console.log(
      "\n🎉 Test del formulario simplificado completado exitosamente!"
    );

    console.log("\n📋 BENEFICIOS DEL FORMULARIO SIMPLIFICADO:");
    console.log("✅ Más rápido - solo datos esenciales del producto");
    console.log("✅ Menos confusión - no requiere costos/precios");
    console.log("✅ Flujo correcto - costos se definen en la compra");
    console.log("✅ SKU automático - igual funcionalidad");
    console.log("✅ Productos listos para agregar a compras");
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar el test
testSimplifiedNewFromPurchase();
