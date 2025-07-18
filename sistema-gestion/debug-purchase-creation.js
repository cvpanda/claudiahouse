// Debug script para ver el error exacto
async function debugPurchaseCreation() {
  try {
    const suppliersResponse = await fetch(
      "http://localhost:3000/api/suppliers"
    );
    const productsResponse = await fetch("http://localhost:3000/api/products");

    const suppliers = await suppliersResponse.json();
    const products = await productsResponse.json();

    const supplierData = suppliers.data || suppliers;
    const productData = products.data || products;

    const supplier = supplierData[0];
    const product1 = productData[0];

    console.log("Supplier ID:", supplier.id);
    console.log("Product ID:", product1.id);

    const purchaseData = {
      supplierId: supplier.id,
      type: "LOCAL",
      orderDate: new Date().toISOString().split("T")[0],
      items: [
        {
          productId: product1.id,
          quantity: 5,
          unitPricePesos: 1000,
        },
      ],
    };

    console.log("Sending data:", JSON.stringify(purchaseData, null, 2));

    const createResponse = await fetch("http://localhost:3000/api/purchases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseData),
    });

    console.log("Response status:", createResponse.status);
    console.log("Response headers:", createResponse.headers);

    const responseText = await createResponse.text();
    console.log("Response body:", responseText);

    if (!createResponse.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.log("Error data:", errorData);
      } catch (e) {
        console.log("Could not parse error as JSON");
      }
    }
  } catch (error) {
    console.error("Debug failed:", error.message);
  }
}

debugPurchaseCreation();
