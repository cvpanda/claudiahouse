// Test para verificar la auto-generación de SKU en el formulario
const BASE_URL = "http://localhost:3000";

async function testProductCreationWithAutoSku() {
  console.log("🧪 Testeando creación de producto con SKU automático...\n");

  try {
    // 1. Obtener una categoría y un proveedor para usar
    console.log("1. Obteniendo categorías y proveedores...");
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.data;

    const suppliersResponse = await fetch(`${BASE_URL}/api/suppliers`);
    const suppliersData = await suppliersResponse.json();
    const suppliers = suppliersData.data;

    if (!categories || categories.length === 0) {
      console.log("❌ No hay categorías disponibles");
      return;
    }

    if (!suppliers || suppliers.length === 0) {
      console.log("❌ No hay proveedores disponibles");
      return;
    }

    const testCategory = categories[0]; // Usar la primera categoría
    const testSupplier = suppliers[0]; // Usar el primer proveedor
    console.log(
      `✅ Usando categoría: ${testCategory.name} (${testCategory.code})`
    );
    console.log(`✅ Usando proveedor: ${testSupplier.name}`);

    // 2. Generar SKU automático
    console.log("\n2. Generando SKU automático...");
    const skuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${testCategory.id}`
    );
    const skuData = await skuResponse.json();
    console.log(`✅ SKU generado: ${skuData.nextSku}`);

    // 3. Crear producto de prueba
    console.log("\n3. Creando producto de prueba...");
    const productData = {
      name: `Producto Test ${Date.now()}`,
      description: "Producto de prueba para validar SKU automático",
      sku: skuData.nextSku,
      cost: 100,
      wholesalePrice: 150,
      retailPrice: 200,
      stock: 10,
      minStock: 5,
      maxStock: 50,
      unit: "unidad",
      categoryId: testCategory.id,
      supplierId: testSupplier.id,
    };

    const createResponse = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.log(
        `❌ Error al crear producto: ${createResponse.status} - ${errorData}`
      );
      return;
    }

    const createdProduct = await createResponse.json();
    console.log(
      `✅ Producto creado exitosamente con SKU: ${createdProduct.sku}`
    );

    // 4. Verificar que el siguiente SKU sea incrementado
    console.log("\n4. Verificando incremento del SKU...");
    const nextSkuResponse = await fetch(
      `${BASE_URL}/api/products/next-sku?categoryId=${testCategory.id}`
    );
    const nextSkuData = await nextSkuResponse.json();
    console.log(`✅ Siguiente SKU disponible: ${nextSkuData.nextSku}`);

    // Extraer números para verificar incremento
    const currentNumber = parseInt(
      skuData.nextSku.replace(testCategory.code, "")
    );
    const nextNumber = parseInt(
      nextSkuData.nextSku.replace(testCategory.code, "")
    );

    if (nextNumber === currentNumber + 1) {
      console.log(`✅ Incremento correcto: ${currentNumber} -> ${nextNumber}`);
    } else {
      console.log(
        `❌ Error en incremento: esperado ${
          currentNumber + 1
        }, obtenido ${nextNumber}`
      );
    }

    // 5. Limpiar - eliminar producto de prueba
    console.log("\n5. Limpiando producto de prueba...");
    const deleteResponse = await fetch(
      `${BASE_URL}/api/products/${createdProduct.id}`,
      {
        method: "DELETE",
      }
    );

    if (deleteResponse.ok) {
      console.log("✅ Producto de prueba eliminado");
    } else {
      console.log("⚠️ No se pudo eliminar el producto de prueba");
    }

    console.log("\n🎉 Test de creación con SKU automático completado");
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar el test
testProductCreationWithAutoSku();
