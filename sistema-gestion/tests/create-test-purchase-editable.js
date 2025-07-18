// Crear una compra de prueba en estado PENDING para testear edición
console.log("🏗️ Creating test purchase for edit testing...");

async function createTestPurchase() {
  try {
    // 1. Obtener proveedores y productos disponibles
    const [suppliersResponse, productsResponse] = await Promise.all([
      fetch("http://localhost:3000/api/suppliers"),
      fetch("http://localhost:3000/api/products"),
    ]);

    const suppliers = await suppliersResponse.json();
    const products = await productsResponse.json();

    const supplierData = suppliers.data || suppliers;
    const productData = products.data || products;

    if (!supplierData.length || !productData.length) {
      console.log("Suppliers found:", supplierData.length);
      console.log("Products found:", productData.length);
      throw new Error("No suppliers or products available");
    }

    const supplier = supplierData[0];
    const product1 = productData[0];
    const product2 = productData[1] || productData[0]; // Si solo hay un producto, usar el mismo

    console.log("✅ Using supplier:", supplier.name);
    console.log("✅ Using products:", product1.name, product2.name);

    // 2. Crear compra de prueba
    const purchaseData = {
      supplierId: supplier.id,
      type: "LOCAL",
      currency: "ARS",
      exchangeRate: null,
      exchangeType: "",
      freightCost: 500,
      customsCost: 200,
      taxCost: 100,
      insuranceCost: 50,
      otherCosts: 25,
      notes: "Compra de prueba para testear edición",
      orderDate: new Date().toISOString().split("T")[0], // Solo la fecha, no datetime
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // +7 días
      items: [
        {
          productId: product1.id,
          quantity: 5,
          unitPricePesos: 1000,
          unitPriceForeign: null,
        },
        {
          productId: product2.id,
          quantity: 3,
          unitPricePesos: 2000,
          unitPriceForeign: null,
        },
      ],
    };

    console.log("📦 Creating purchase with data:");
    console.log("- Supplier:", supplier.name);
    console.log("- Type:", purchaseData.type);
    console.log("- Items:", purchaseData.items.length);
    console.log(
      "- Total freight/costs:",
      purchaseData.freightCost +
        purchaseData.customsCost +
        purchaseData.taxCost +
        purchaseData.insuranceCost +
        purchaseData.otherCosts
    );

    const createResponse = await fetch("http://localhost:3000/api/purchases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create purchase: ${error.error}`);
    }

    const newPurchase = await createResponse.json();
    console.log("✅ Purchase created successfully!");
    console.log("- ID:", newPurchase.id);
    console.log("- Number:", newPurchase.purchaseNumber);
    console.log("- Status:", newPurchase.status);
    console.log(
      "- Total:",
      `$${newPurchase.total?.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`
    );
    console.log("- URL:", `http://localhost:3000/purchases/${newPurchase.id}`);

    // 3. Ahora testear la edición de esta compra
    console.log("\n✏️ Testing edit functionality on new purchase...");

    const editData = {
      supplierId: newPurchase.supplierId,
      type: "IMPORT", // Cambiar a importación
      currency: "USD", // Cambiar a USD
      exchangeRate: 1200, // Tipo de cambio
      exchangeType: "Blue",
      freightCost: 1000, // Aumentar flete
      customsCost: 500, // Aumentar gastos aduaneros
      taxCost: 300, // Aumentar impuestos
      insuranceCost: 100, // Aumentar seguro
      otherCosts: 75, // Aumentar otros gastos
      notes: "Compra editada - cambió a importación USD",
      items: [
        {
          id: newPurchase.items[0].id,
          productId: newPurchase.items[0].productId,
          quantity: 10, // Duplicar cantidad
          unitPriceForeign: 5, // $5 USD
          unitPricePesos: 6000, // $6000 ARS
        },
        {
          id: newPurchase.items[1].id,
          productId: newPurchase.items[1].productId,
          quantity: 7, // Aumentar cantidad
          unitPriceForeign: 8, // $8 USD
          unitPricePesos: 9600, // $9600 ARS
        },
      ],
    };

    console.log("📝 Editing purchase with changes:");
    console.log("- Changing from LOCAL to IMPORT");
    console.log("- Changing currency from ARS to USD");
    console.log("- Adding exchange rate: 1200");
    console.log("- Increasing costs and quantities");

    const editResponse = await fetch(
      `http://localhost:3000/api/purchases/${newPurchase.id}/edit`,
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
        "- Original total:",
        `$${newPurchase.total?.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "- New total:",
        `$${editedPurchase.total?.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log(
        "- Difference:",
        `$${(editedPurchase.total - newPurchase.total).toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
      console.log("- New type:", editedPurchase.type);
      console.log("- New currency:", editedPurchase.currency);
      console.log("- Exchange rate:", editedPurchase.exchangeRate);
      console.log("- Items count:", editedPurchase.items?.length || 0);

      return editedPurchase.id;
    } else {
      const error = await editResponse.json();
      console.log("❌ Edit failed:", error.error);
      return newPurchase.id;
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return null;
  }
}

createTestPurchase().then((purchaseId) => {
  if (purchaseId) {
    console.log("\n🎉 Test completed successfully!");
    console.log("📋 Test purchase ID for further testing:", purchaseId);
    console.log(
      "🌐 View in browser:",
      `http://localhost:3000/purchases/${purchaseId}`
    );
  }
});
