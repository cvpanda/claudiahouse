// Test simple para verificar endpoint de compras
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const BASE_URL = "http://localhost:3000";

async function checkPurchases() {
  try {
    console.log("📋 Verificando endpoint de compras...");
    const response = await fetch(`${BASE_URL}/api/purchases`);

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    if (!response.ok) {
      console.log("❌ Error en la respuesta");
      return;
    }

    const data = await response.json();
    console.log("Respuesta:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkPurchases();
