/**
 * Crear producto de prueba con código de barras para testing
 */

const BASE_URL = "http://localhost:3000";

async function createTestProduct() {
  console.log("🧪 Creando producto de prueba con código de barras...\n");

  try {
    // Obtener una categoría y proveedor existente
    console.log("📋 Obteniendo categorías y proveedores...");

    const [categoriesResponse, suppliersResponse] = await Promise.all([
      fetch(`${BASE_URL}/api/categories`),
      fetch(`${BASE_URL}/api/suppliers`),
    ]);

    if (!categoriesResponse.ok || !suppliersResponse.ok) {
      throw new Error("Error al obtener datos necesarios");
    }

    const categoriesData = await categoriesResponse.json();
    const suppliersData = await suppliersResponse.json();

    const categories =
      categoriesData.categories || categoriesData.data || categoriesData;
    const suppliers =
      suppliersData.suppliers || suppliersData.data || suppliersData;

    if (categories.length === 0 || suppliers.length === 0) {
      throw new Error("No hay categorías o proveedores disponibles");
    }

    const testProductData = {
      name: `Producto Test con Barcode ${Date.now()}`,
      description: "Producto de prueba para testing de errores",
      sku: `TEST-BARCODE-${Date.now()}`,
      barcode: `123456789${Date.now().toString().slice(-3)}`, // Código de barras único
      cost: 100,
      wholesalePrice: 120,
      retailPrice: 150,
      stock: 10,
      minStock: 5,
      unit: "unidad",
      supplierId: suppliers[0].id,
      categoryId: categories[0].id,
      isActive: true,
    };

    console.log("🔄 Creando producto...");
    const response = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testProductData),
    });

    if (response.ok) {
      const product = await response.json();
      console.log(`✅ Producto creado: ${product.name}`);
      console.log(`✅ SKU: ${product.sku}`);
      console.log(`✅ Código de barras: ${product.barcode}`);
      console.log(`✅ ID: ${product.id}`);
      return product;
    } else {
      const errorData = await response.json();
      console.log(`❌ Error al crear producto: ${errorData.error}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
}

// Ejecutar
createTestProduct();
