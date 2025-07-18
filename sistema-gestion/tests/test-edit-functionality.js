// Test específico para edición de compra
const purchaseId = "cmd7xwtgf000zutb5m5vnw75t"; // La compra que acabamos de crear

console.log("🧪 Testing purchase edit functionality");
console.log("Purchase ID:", purchaseId);
console.log("URL:", `http://localhost:3000/purchases/${purchaseId}`);

async function testPurchaseEdit() {
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
    console.log("- Type:", purchase.type);
    console.log("- Currency:", purchase.currency || "ARS");
    console.log(
      "- Total:",
      `$${purchase.total?.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`
    );
    console.log("- Items:", purchase.items?.length || 0);

    const canEdit = ["PENDING", "ORDERED", "SHIPPED"].includes(purchase.status);
    console.log("- Can Edit:", canEdit ? "✅" : "❌");

    if (!canEdit) {
      console.log("❌ Cannot edit this purchase due to status");
      return;
    }

    // 2. Preparar datos de edición
    console.log("\n✏️ Preparing edit data...");

    const editData = {
      supplierId: purchase.supplier.id,
      type: "IMPORT", // Cambiar de LOCAL a IMPORT
      currency: "USD", // Cambiar a USD
      exchangeRate: 1200, // Agregar tipo de cambio
      exchangeType: "Blue",
      freightCost: 500, // Agregar costos de importación
      customsCost: 300,
      taxCost: 200,
      insuranceCost: 100,
      otherCosts: 50,
      notes: "Compra editada - convertida a importación USD",
      orderDate: purchase.orderDate
        ? new Date(purchase.orderDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // +14 días
      items: purchase.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity + 2, // Aumentar cantidad en 2
        unitPriceForeign: 5.5, // $5.50 USD
        unitPricePesos: item.unitPricePesos + 500, // Aumentar precio en $500 ARS
      })),
    };

    console.log("📝 Changes to apply:");
    console.log("- Type: LOCAL → IMPORT");
    console.log("- Currency: ARS → USD");
    console.log("- Exchange rate: 1200 (Blue)");
    console.log("- Add import costs: $1150 total");
    console.log("- Increase quantity by 2 units");
    console.log("- Add foreign price: $5.50 USD");
    console.log("- Increase ARS price by $500");

    // 3. Ejecutar edición
    console.log("\n🔄 Executing edit...");

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

    console.log("Response status:", editResponse.status);

    if (editResponse.ok) {
      const editedPurchase = await editResponse.json();
      console.log("✅ Edit successful!");
      console.log("\n📊 Before vs After:");
      console.log("Type:", purchase.type, "→", editedPurchase.type);
      console.log(
        "Currency:",
        purchase.currency || "ARS",
        "→",
        editedPurchase.currency
      );
      console.log(
        "Exchange Rate:",
        purchase.exchangeRate || "N/A",
        "→",
        editedPurchase.exchangeRate
      );
      console.log(
        "Subtotal Pesos:",
        `$${purchase.subtotalPesos.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`,
        "→",
        `$${editedPurchase.subtotalPesos.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "Total Costs:",
        `$${purchase.totalCosts.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`,
        "→",
        `$${editedPurchase.totalCosts.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "Total:",
        `$${purchase.total.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`,
        "→",
        `$${editedPurchase.total.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "Items count:",
        purchase.items.length,
        "→",
        editedPurchase.items?.length || 0
      );

      if (editedPurchase.subtotalForeign) {
        console.log(
          "Subtotal Foreign:",
          editedPurchase.subtotalForeign.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })
        );
      }

      console.log("\n💰 Cost breakdown:");
      console.log(
        "- Freight:",
        `$${editedPurchase.freightCost.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "- Customs:",
        `$${editedPurchase.customsCost.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "- Tax:",
        `$${editedPurchase.taxCost.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "- Insurance:",
        `$${editedPurchase.insuranceCost.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "- Other:",
        `$${editedPurchase.otherCosts.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );

      if (editedPurchase.items && editedPurchase.items.length > 0) {
        console.log("\n📦 Item details:");
        editedPurchase.items.forEach((item, index) => {
          console.log(`Item ${index + 1}:`);
          console.log(`  - Product: ${item.product?.name}`);
          console.log(`  - Quantity: ${item.quantity}`);
          console.log(
            `  - Unit Price USD: ${
              item.unitPriceForeign
                ? "$" + item.unitPriceForeign.toFixed(2)
                : "N/A"
            }`
          );
          console.log(
            `  - Unit Price ARS: $${item.unitPricePesos.toLocaleString(
              "es-AR",
              { minimumFractionDigits: 2 }
            )}`
          );
          console.log(
            `  - Subtotal ARS: $${item.subtotalPesos.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}`
          );
          console.log(
            `  - Distributed Cost: $${item.distributedCostPesos.toLocaleString(
              "es-AR",
              { minimumFractionDigits: 2 }
            )}`
          );
          console.log(
            `  - Final Cost: $${item.finalCostPesos.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}`
          );
        });
      }

      console.log("\n🎉 Edit test completed successfully!");
      console.log(
        "🌐 View edited purchase:",
        `http://localhost:3000/purchases/${purchaseId}`
      );
    } else {
      const error = await editResponse.json();
      console.log("❌ Edit failed:", error.error);
      if (error.details) {
        console.log("Details:", error.details);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testPurchaseEdit();
