// Test completo para la edición de compras
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const BASE_URL = "http://localhost:3000";

async function testEditPurchase() {
  console.log("🧪 Iniciando test completo de edición de compras...\n");

  try {
    // 1. Primero obtener una compra existente para editar
    console.log("📋 1. Obteniendo lista de compras...");
    const purchasesResponse = await fetch(`${BASE_URL}/api/purchases`);
    const purchasesData = await purchasesResponse.json();

    if (!purchasesData.purchases || purchasesData.purchases.length === 0) {
      console.log("❌ No hay compras disponibles para editar");
      return;
    }

    // Buscar una compra que se pueda editar (no COMPLETED)
    const editablePurchase = purchasesData.purchases.find(
      (p) => p.status !== "COMPLETED" && p.items && p.items.length > 0
    );

    if (!editablePurchase) {
      console.log("❌ No hay compras editables disponibles");
      return;
    }

    console.log(
      `✅ Compra encontrada: #${editablePurchase.purchaseNumber} (ID: ${editablePurchase.id})`
    );

    // 2. Obtener detalles completos de la compra
    console.log("\n📋 2. Obteniendo detalles de la compra...");
    const detailResponse = await fetch(
      `${BASE_URL}/api/purchases/${editablePurchase.id}`
    );
    const originalPurchase = await detailResponse.json();

    console.log(`   - Estado: ${originalPurchase.status}`);
    console.log(`   - Total original: $${originalPurchase.total}`);
    console.log(`   - Productos: ${originalPurchase.items.length}`);

    // 3. Preparar datos de edición
    console.log("\n✏️ 3. Preparando edición...");

    // Modificar el primer producto
    const modifiedItems = [...originalPurchase.items];
    if (modifiedItems.length > 0) {
      // Cambiar cantidad del primer producto
      modifiedItems[0] = {
        ...modifiedItems[0],
        quantity: modifiedItems[0].quantity + 1,
        _action: "update",
      };
    }

    // Agregar un producto nuevo si tenemos productos disponibles
    console.log("📦 Obteniendo productos disponibles...");
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const productsData = await productsResponse.json();

    let newProduct = null;
    if (productsData.products && productsData.products.length > 0) {
      // Buscar un producto que no esté ya en la compra
      newProduct = productsData.products.find(
        (p) => !originalPurchase.items.some((item) => item.product.id === p.id)
      );
    }

    if (newProduct) {
      modifiedItems.push({
        productId: newProduct.id,
        quantity: 2,
        unitPricePesos: 1500,
        _action: "create",
      });
      console.log(`   + Agregando producto: ${newProduct.name}`);
    }

    const editData = {
      supplierId: originalPurchase.supplier.id,
      type: originalPurchase.type,
      currency: originalPurchase.currency || "ARS",
      exchangeRate: originalPurchase.exchangeRate,
      exchangeType: originalPurchase.exchangeType || "",
      freightCost: originalPurchase.freightCost + 100, // Aumentar flete
      customsCost: originalPurchase.customsCost,
      taxCost: originalPurchase.taxCost,
      insuranceCost: originalPurchase.insuranceCost,
      otherCosts: originalPurchase.otherCosts,
      notes: (originalPurchase.notes || "") + " - Editado en test",
      orderDate: originalPurchase.orderDate,
      expectedDate: originalPurchase.expectedDate,
      items: modifiedItems,
    };

    console.log(
      `   - Modificando cantidad del primer producto: ${originalPurchase.items[0].quantity} → ${modifiedItems[0].quantity}`
    );
    console.log(
      `   - Aumentando flete: $${originalPurchase.freightCost} → $${editData.freightCost}`
    );
    console.log(`   - Total de items: ${editData.items.length}`);

    // 4. Realizar la edición
    console.log("\n💾 4. Guardando cambios...");
    const editResponse = await fetch(
      `${BASE_URL}/api/purchases/${originalPurchase.id}/edit`,
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
      console.log("❌ Error al editar:", errorData);
      return;
    }

    const updatedPurchase = await editResponse.json();
    console.log("✅ Compra editada exitosamente");

    // 5. Verificar los cambios
    console.log("\n🔍 5. Verificando cambios...");

    console.log(`   - Total anterior: $${originalPurchase.total}`);
    console.log(`   - Total nuevo: $${updatedPurchase.total}`);
    console.log(
      `   - Diferencia: $${updatedPurchase.total - originalPurchase.total}`
    );

    console.log(`   - Items anteriores: ${originalPurchase.items.length}`);
    console.log(`   - Items nuevos: ${updatedPurchase.items.length}`);

    // 6. Verificar que los cálculos son correctos
    console.log("\n🧮 6. Verificando cálculos...");

    let calculatedSubtotal = 0;
    updatedPurchase.items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPricePesos;
      calculatedSubtotal += itemTotal;
      console.log(
        `   - ${item.product.name}: ${item.quantity} x $${item.unitPricePesos} = $${itemTotal}`
      );
    });

    const calculatedTotal =
      calculatedSubtotal +
      updatedPurchase.freightCost +
      updatedPurchase.customsCost +
      updatedPurchase.taxCost +
      updatedPurchase.insuranceCost +
      updatedPurchase.otherCosts;

    console.log(`   - Subtotal calculado: $${calculatedSubtotal}`);
    console.log(`   - Subtotal API: $${updatedPurchase.subtotalPesos}`);
    console.log(`   - Total calculado: $${calculatedTotal}`);
    console.log(`   - Total API: $${updatedPurchase.total}`);

    if (Math.abs(calculatedTotal - updatedPurchase.total) < 0.01) {
      console.log("✅ Los cálculos son correctos");
    } else {
      console.log("❌ Hay diferencias en los cálculos");
    }

    // 7. Test de validaciones
    console.log("\n🚫 7. Probando validaciones...");

    // Intentar editar sin productos
    const invalidEditResponse = await fetch(
      `${BASE_URL}/api/purchases/${originalPurchase.id}/edit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editData,
          items: [], // Sin productos
        }),
      }
    );

    if (invalidEditResponse.ok) {
      console.log("❌ ERROR: Se permitió editar sin productos");
    } else {
      const errorData = await invalidEditResponse.json();
      console.log("✅ Validación correcta: No se permite editar sin productos");
      console.log(`   - Error: ${errorData.error}`);
    }

    console.log("\n🎉 Test de edición completado exitosamente!");
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
}

// Ejecutar el test
testEditPurchase();
