// Script para testear el endpoint de eliminación de compras

async function testDeleteEndpoint() {
  console.log("=== TESTING DELETE PURCHASE ENDPOINT ===\n");

  const baseUrl = "http://localhost:3000";

  try {
    // 1. Crear una nueva compra de prueba para eliminar
    console.log("1. Creando compra de prueba para eliminar...");

    // Obtener datos necesarios
    const suppliersResponse = await fetch(`${baseUrl}/api/suppliers`);
    const suppliersData = await suppliersResponse.json();
    const suppliers = suppliersData.data || suppliersData; // Manejar diferentes estructuras

    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const productsData = await productsResponse.json();
    const products = productsData.data || productsData; // Manejar diferentes estructuras

    if (
      !suppliers ||
      suppliers.length === 0 ||
      !products ||
      products.length === 0
    ) {
      throw new Error("No hay datos suficientes para crear la compra");
    }

    // Crear compra
    const createData = {
      supplierId: suppliers[0].id,
      type: "LOCAL",
      currency: "ARS",
      freightCost: 0,
      customsCost: 0,
      taxCost: 0,
      insuranceCost: 0,
      otherCosts: 0,
      orderDate: new Date().toISOString().split("T")[0],
      notes: "Compra de prueba para eliminar",
      items: [
        {
          productId: products[0].id,
          quantity: 5,
          unitPricePesos: 100,
        },
      ],
    };

    const createResponse = await fetch(`${baseUrl}/api/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(
        `Error creando compra: ${createResponse.status} - ${errorData.error}`
      );
    }

    const createdPurchase = await createResponse.json();
    console.log(`   ✅ Compra creada: ${createdPurchase.purchaseNumber}`);
    console.log(`   📦 ID: ${createdPurchase.id}`);
    console.log(`   💰 Total: $${createdPurchase.total}\n`);

    // 2. Verificar que la compra existe
    console.log("2. Verificando que la compra existe...");
    const getResponse = await fetch(
      `${baseUrl}/api/purchases/${createdPurchase.id}`
    );

    if (!getResponse.ok) {
      throw new Error(`Error obteniendo compra: ${getResponse.status}`);
    }

    const purchase = await getResponse.json();
    console.log(
      `   ✅ Compra confirmada: ${purchase.purchaseNumber} (${purchase.status})`
    );
    console.log(`   📦 Items: ${purchase.items?.length || 0}\n`);

    // 3. Eliminar la compra
    console.log("3. Eliminando compra...");
    const deleteResponse = await fetch(
      `${baseUrl}/api/purchases/${createdPurchase.id}`,
      {
        method: "DELETE",
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(
        `Error eliminando compra: ${deleteResponse.status} - ${errorData.error}`
      );
    }

    const deleteResult = await deleteResponse.json();
    console.log(`   ✅ ${deleteResult.message}`);
    if (deleteResult.revertedStock) {
      console.log("   🔄 Stock revertido");
    }
    console.log();

    // 4. Verificar que la compra fue eliminada
    console.log("4. Verificando eliminación...");
    const verifyResponse = await fetch(
      `${baseUrl}/api/purchases/${createdPurchase.id}`
    );

    if (verifyResponse.status === 404) {
      console.log("   ✅ Compra eliminada correctamente (404 Not Found)");
    } else {
      console.log(
        `   ❌ La compra aún existe (status: ${verifyResponse.status})`
      );
    }
    console.log();

    console.log("🎉 Test de eliminación completado exitosamente!");
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar test
testDeleteEndpoint();
