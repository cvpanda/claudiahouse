// Test específico para la compra cmd7sls2l0009q63du89lmiel
const purchaseId = "cmd7sls2l0009q63du89lmiel";

console.log("🧪 Testing purchase edit/delete functionality");
console.log("Purchase ID:", purchaseId);
console.log("URL:", `http://localhost:3000/purchases/${purchaseId}`);

async function testPurchaseOperations() {
  try {
    // 1. Obtener datos actuales de la compra
    console.log("\n📊 Getting current purchase data...");
    const response = await fetch(
      `http://localhost:3000/api/purchases/${purchaseId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase: ${response.status}`);
    }

    const purchase = await response.json();
    console.log("✅ Purchase found:");
    console.log("- Number:", purchase.purchaseNumber);
    console.log("- Status:", purchase.status);
    console.log("- Supplier:", purchase.supplier?.name);
    console.log(
      "- Total:",
      `$${purchase.total?.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`
    );
    console.log("- Items:", purchase.items?.length || 0);

    // Mostrar si se puede editar o eliminar
    const canEdit = ["PENDING", "ORDERED", "SHIPPED"].includes(purchase.status);
    const canDelete = !["RECEIVED", "IN_TRANSIT"].includes(purchase.status);

    console.log("\n🔐 Permissions:");
    console.log("- Can Edit:", canEdit ? "✅" : "❌");
    console.log("- Can Delete:", canDelete ? "✅" : "❌");

    // 2. Test de edición (si es posible)
    if (canEdit) {
      console.log("\n✏️ Testing edit functionality...");

      // Preparar datos de prueba para edición
      const editData = {
        supplierId: purchase.supplier.id,
        type: purchase.type || "LOCAL",
        currency: purchase.currency || "ARS",
        exchangeRate: purchase.exchangeRate,
        freightCost: (purchase.freightCost || 0) + 100, // Agregar $100 de flete
        customsCost: purchase.customsCost || 0,
        taxCost: purchase.taxCost || 0,
        insuranceCost: purchase.insuranceCost || 0,
        otherCosts: purchase.otherCosts || 0,
        notes: (purchase.notes || "") + " - EDITADO POR TEST",
        items: purchase.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity + 1, // Aumentar cantidad en 1
          unitPriceForeign: item.unitPriceForeign,
          unitPricePesos: item.unitPricePesos + 10, // Aumentar precio en $10
        })),
      };

      console.log("📝 Edit data prepared:");
      console.log("- Adding $100 to freight cost");
      console.log("- Adding 1 to quantity of each item");
      console.log("- Adding $10 to unit price of each item");
      console.log('- Adding note: "EDITADO POR TEST"');

      // Ejecutar edición
      const editResponse = await fetch(
        `http://localhost:3000/api/purchases/${purchaseId}/edit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editData),
        }
      );

      if (editResponse.ok) {
        const editedPurchase = await editResponse.json();
        console.log("✅ Edit successful!");
        console.log(
          "- New total:",
          `$${editedPurchase.total?.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`
        );
        console.log(
          "- Original total:",
          `$${purchase.total?.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`
        );
        console.log(
          "- Difference:",
          `$${(editedPurchase.total - purchase.total).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`
        );
      } else {
        const error = await editResponse.json();
        console.log("❌ Edit failed:", error.error);
      }
    } else {
      console.log(
        "\n❌ Cannot test edit - purchase status does not allow editing"
      );
    }

    // 3. Test de eliminación (ADVERTENCIA: solo si queremos probar realmente)
    console.log(
      "\n🗑️ Delete test available but not executed (would actually delete the purchase)"
    );
    console.log("To test delete, uncomment the delete test section below");

    /* UNCOMMENT TO TEST DELETE (WARNING: WILL ACTUALLY DELETE THE PURCHASE)
    if (canDelete) {
      console.log('\n🗑️ Testing delete functionality...');
      
      const deleteResponse = await fetch(`http://localhost:3000/api/purchases/${purchaseId}`, {
        method: 'DELETE',
      });
      
      if (deleteResponse.ok) {
        const result = await deleteResponse.json();
        console.log('✅ Delete successful!');
        console.log('- Message:', result.message);
        console.log('- Stock reverted:', result.revertedStock ? 'Yes' : 'No');
      } else {
        const error = await deleteResponse.json();
        console.log('❌ Delete failed:', error.error);
      }
    } else {
      console.log('❌ Cannot delete - purchase status does not allow deletion');
    }
    */
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testPurchaseOperations();
