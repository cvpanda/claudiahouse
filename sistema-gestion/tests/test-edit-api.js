// Script para testear los endpoints de edición de compras

async function testEditEndpoint() {
  console.log("=== TESTING EDIT PURCHASE ENDPOINT ===\n");

  const purchaseId = "cmd7u3nin0001bk51elt81r06"; // ID de la compra de prueba
  const baseUrl = "http://localhost:3000";

  try {
    // 1. Obtener la compra actual
    console.log("1. Obteniendo compra actual...");
    const getResponse = await fetch(`${baseUrl}/api/purchases/${purchaseId}`);

    if (!getResponse.ok) {
      throw new Error(`Error obteniendo compra: ${getResponse.status}`);
    }

    const purchase = await getResponse.json();
    console.log(
      `   ✅ Compra obtenida: ${purchase.purchaseNumber} (${purchase.status})`
    );
    console.log(`   📦 Items: ${purchase.items?.length || 0}`);
    console.log(`   💰 Total: $${purchase.total}\n`);

    // 2. Preparar datos para edición
    console.log("2. Preparando datos para edición...");
    const editData = {
      supplierId: purchase.supplierId,
      type: purchase.type,
      currency: purchase.currency || "ARS",
      exchangeRate: purchase.exchangeRate,
      exchangeType: purchase.exchangeType,
      freightCost: purchase.freightCost || 0,
      customsCost: purchase.customsCost || 0,
      taxCost: purchase.taxCost || 0,
      insuranceCost: purchase.insuranceCost || 0,
      otherCosts: purchase.otherCosts || 0,
      notes: purchase.notes || "Editado via API test",
      orderDate: purchase.orderDate
        ? purchase.orderDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      expectedDate: purchase.expectedDate
        ? purchase.expectedDate.split("T")[0]
        : null,
      items:
        purchase.items?.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity + 5, // Cambiar cantidad
          unitPriceForeign: item.unitPriceForeign,
          unitPricePesos: item.unitPricePesos * 1.1, // Aumentar precio 10%
          _action: "update",
        })) || [],
    };

    console.log("   📝 Datos preparados para edición:");
    console.log(`   - Notas: "${editData.notes}"`);
    editData.items.forEach((item, index) => {
      const originalItem = purchase.items[index];
      console.log(
        `   - Item ${index + 1}: cantidad ${originalItem.quantity} → ${
          item.quantity
        }, precio $${originalItem.unitPricePesos} → $${item.unitPricePesos}`
      );
    });
    console.log();

    // 3. Ejecutar edición
    console.log("3. Ejecutando edición...");
    const editResponse = await fetch(
      `${baseUrl}/api/purchases/${purchaseId}/edit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      }
    );

    if (!editResponse.ok) {
      const errorData = await editResponse.json();
      throw new Error(
        `Error editando compra: ${editResponse.status} - ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const updatedPurchase = await editResponse.json();
    console.log(`   ✅ Compra editada exitosamente`);
    console.log(
      `   📦 Items actualizados: ${updatedPurchase.items?.length || 0}`
    );
    console.log(`   💰 Nuevo total: $${updatedPurchase.total}\n`);

    // 4. Verificar los cambios
    console.log("4. Verificando cambios...");
    const verifyResponse = await fetch(
      `${baseUrl}/api/purchases/${purchaseId}`
    );

    if (!verifyResponse.ok) {
      throw new Error(`Error verificando compra: ${verifyResponse.status}`);
    }

    const verifiedPurchase = await verifyResponse.json();
    console.log("   ✅ Cambios verificados:");
    console.log(`   - Notas: "${verifiedPurchase.notes}"`);
    console.log(`   - Total anterior: $${purchase.total}`);
    console.log(`   - Total nuevo: $${verifiedPurchase.total}`);
    console.log(
      `   - Diferencia: $${verifiedPurchase.total - purchase.total}\n`
    );

    console.log("🎉 Test de edición completado exitosamente!");
  } catch (error) {
    console.error("❌ Error durante el test:", error.message);
  }
}

// Ejecutar test
testEditEndpoint();
