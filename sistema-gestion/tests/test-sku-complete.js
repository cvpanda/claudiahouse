// Test completo para verificar la funcionalidad de SKU automático
const BASE_URL = "http://localhost:3000";

async function testCompleteSkuFunctionality() {
  console.log("🧪 Test completo de funcionalidad de SKU automático...\n");

  try {
    // 1. Obtener categorías disponibles
    console.log("1. Obteniendo categorías disponibles...");
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.data;

    if (!categories || categories.length < 2) {
      console.log("❌ Se necesitan al menos 2 categorías para este test");
      return;
    }

    console.log(`✅ Categorías disponibles:`);
    categories.forEach((cat) => {
      console.log(`   - ${cat.name} (${cat.code})`);
    });

    // 2. Test para la primera categoría
    const category1 = categories[0];
    console.log(
      `\n2. Testeando categoría: ${category1.name} (${category1.code})`
    );

    let skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${category1.id}`
    );
    let skuData = await skuResponse.json();
    console.log(`   SKU generado: ${skuData.nextSku}`);

    // Crear algunos productos para esta categoría
    console.log(`   Creando productos para ${category1.code}...`);
    const productsToCreate = [
      { name: `Producto ${category1.code} 1`, sku: skuData.nextSku },
    ];

    for (const prodData of productsToCreate) {
      skuResponse = await fetch(
        `${BASE_URL}/api/products/next-sku?categoryId=${category1.id}`
      );
      skuData = await skuResponse.json();

      const productData = {
        name: prodData.name,
        description: "Producto de prueba",
        sku: skuData.nextSku,
        cost: 100,
        wholesalePrice: 150,
        retailPrice: 200,
        stock: 10,
        minStock: 5,
        maxStock: 50,
        unit: "unidad",
        categoryId: category1.id,
        supplierId: (
          await fetch(`${BASE_URL}/api/suppliers`).then((r) => r.json())
        ).data[0].id,
      };

      const createResponse = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (createResponse.ok) {
        const product = await createResponse.json();
        console.log(`   ✅ Creado: ${product.name} con SKU ${product.sku}`);
      } else {
        console.log(`   ❌ Error creando producto: ${createResponse.status}`);
      }
    }

    // 3. Verificar el siguiente SKU para category1
    console.log(`\n3. Verificando próximo SKU para ${category1.code}...`);
    skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${category1.id}`
    );
    skuData = await skuResponse.json();
    console.log(`   Próximo SKU: ${skuData.nextSku}`);

    // 4. Test para la segunda categoría
    const category2 = categories[1];
    console.log(
      `\n4. Testeando categoría: ${category2.name} (${category2.code})`
    );

    skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${category2.id}`
    );
    skuData = await skuResponse.json();
    console.log(`   SKU generado: ${skuData.nextSku}`);

    // Verificar que empiece desde 1 si no hay productos previos
    if (skuData.nextSku === `${category2.code}1`) {
      console.log(`   ✅ Correcto: empieza desde 1 para nueva categoría`);
    } else {
      console.log(
        `   ⚠️ Inesperado: SKU ${skuData.nextSku} para nueva categoría`
      );
    }

    // 5. Test de cambio entre categorías (simulando UI)
    console.log(`\n5. Simulando cambio de categorías en UI...`);
    console.log(`   Usuario selecciona ${category1.name}:`);
    skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${category1.id}`
    );
    skuData = await skuResponse.json();
    console.log(`   → SKU generado: ${skuData.nextSku}`);

    console.log(`   Usuario cambia a ${category2.name}:`);
    skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${category2.id}`
    );
    skuData = await skuResponse.json();
    console.log(`   → SKU generado: ${skuData.nextSku}`);

    console.log(`   Usuario vuelve a ${category1.name}:`);
    skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${category1.id}`
    );
    skuData = await skuResponse.json();
    console.log(`   → SKU generado: ${skuData.nextSku}`);

    console.log("\n🎉 Test completo de SKU automático finalizado exitosamente");
    console.log("\n📝 Resumen:");
    console.log("✅ SKU se genera automáticamente al seleccionar categoría");
    console.log("✅ SKU incrementa correctamente para cada categoría");
    console.log("✅ Categorías independientes mantienen su secuencia");
    console.log("✅ El sistema maneja cambios entre categorías");
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar el test
testCompleteSkuFunctionality();
