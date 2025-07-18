// Test para verificar la generación automática de SKU
const BASE_URL = "http://localhost:3000";

async function testSkuGeneration() {
  console.log("🧪 Testeando generación automática de SKU...\n");

  try {
    // 1. Obtener categorías disponibles
    console.log("1. Obteniendo categorías...");
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);

    if (!categoriesResponse.ok) {
      throw new Error(
        `Error al obtener categorías: ${categoriesResponse.status}`
      );
    }

    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.data;

    if (!categories || categories.length === 0) {
      console.log("❌ No hay categorías disponibles para testear");
      return;
    }

    console.log(`✅ Encontradas ${categories.length} categorías`);

    // 2. Testear generación de SKU para cada categoría
    for (const category of categories) {
      console.log(
        `\n2. Testeando generación de SKU para categoría: ${category.name} (${category.code})`
      );

      const skuResponse = await fetch(
        `${BASE_URL}/api/products/next-sku?categoryId=${category.id}`
      );

      if (!skuResponse.ok) {
        console.log(
          `❌ Error al generar SKU para ${category.name}: ${skuResponse.status}`
        );
        continue;
      }

      const skuData = await skuResponse.json();
      console.log(`✅ SKU generado para ${category.name}: ${skuData.nextSku}`);

      // Verificar formato del SKU
      const expectedPrefix = category.code;
      if (skuData.nextSku.startsWith(expectedPrefix)) {
        const numberPart = skuData.nextSku.replace(expectedPrefix, "");
        if (/^\d+$/.test(numberPart)) {
          console.log(`✅ Formato correcto: ${expectedPrefix} + ${numberPart}`);
        } else {
          console.log(`❌ Formato incorrecto - parte numérica: ${numberPart}`);
        }
      } else {
        console.log(`❌ Formato incorrecto - no empieza con ${expectedPrefix}`);
      }
    }

    // 3. Test de categoría inexistente
    console.log("\n3. Testeando categoría inexistente...");
    const invalidResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=invalid-id`
    );
    if (invalidResponse.status === 404) {
      console.log("✅ Manejo correcto de categoría inexistente (404)");
    } else {
      console.log(
        `❌ Error en manejo de categoría inexistente: ${invalidResponse.status}`
      );
    }

    // 4. Test sin categoryId
    console.log("\n4. Testeando request sin categoryId...");
    const noCategoryResponse = await fetch(`${BASE_URL}/api/products/next-sku`);
    if (noCategoryResponse.status === 400) {
      console.log("✅ Manejo correcto de request sin categoryId (400)");
    } else {
      console.log(
        `❌ Error en manejo de request sin categoryId: ${noCategoryResponse.status}`
      );
    }

    console.log("\n🎉 Test de generación de SKU completado");
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar el test
testSkuGeneration();
