#!/usr/bin/env node

/**
 * Script para probar la cancelación de ventas con devolución de stock
 *
 * INSTRUCCIONES:
 * 1. Asegúrate de que el servidor esté corriendo: npm run dev
 * 2. Verifica que la base de datos esté conectada
 * 3. Ejecuta este script: node tests/test-sale-cancellation-simple.js
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

async function testCancellation() {
  console.log("🧪 TEST SIMPLIFICADO: Cancelación con devolución de stock");
  console.log("=".repeat(60));

  try {
    // 1. Obtener productos existentes
    console.log("\n1. Obteniendo productos existentes...");
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const productsData = await productsResponse.json();

    if (!productsData.data || productsData.data.length < 2) {
      console.log("❌ Necesitas al menos 2 productos en la base de datos");
      return;
    }

    const product1 = productsData.data[0];
    const product2 = productsData.data[1];

    console.log(`📦 Producto 1: ${product1.name} (Stock: ${product1.stock})`);
    console.log(`📦 Producto 2: ${product2.name} (Stock: ${product2.stock})`);

    const initialStock1 = product1.stock;
    const initialStock2 = product2.stock;

    // 2. Crear venta simple
    console.log("\n2. Creando venta con productos simples...");
    const saleData = {
      items: [
        {
          productId: product1.id,
          quantity: 2,
          unitPrice: product1.price,
        },
        {
          productId: product2.id,
          quantity: 1,
          unitPrice: product2.price,
        },
      ],
      total: 2 * product1.price + 1 * product2.price,
      paymentMethod: "cash",
      status: "completed",
    };

    const saleResponse = await fetch(`${BASE_URL}/api/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    if (!saleResponse.ok) {
      const error = await saleResponse.text();
      console.log("❌ Error creando venta:", error);
      return;
    }

    const saleResult = await saleResponse.json();
    console.log(`✅ Venta creada: ${saleResult.data.saleNumber}`);

    // 3. Verificar stock después de la venta
    console.log("\n3. Verificando stock después de la venta...");
    const afterSaleResponse1 = await fetch(
      `${BASE_URL}/api/products/${product1.id}`
    );
    const afterSaleResponse2 = await fetch(
      `${BASE_URL}/api/products/${product2.id}`
    );

    const afterSaleProduct1 = await afterSaleResponse1.json();
    const afterSaleProduct2 = await afterSaleResponse2.json();

    console.log(
      `📦 ${product1.name}: ${initialStock1} → ${
        afterSaleProduct1.data.stock
      } (diferencia: -${initialStock1 - afterSaleProduct1.data.stock})`
    );
    console.log(
      `📦 ${product2.name}: ${initialStock2} → ${
        afterSaleProduct2.data.stock
      } (diferencia: -${initialStock2 - afterSaleProduct2.data.stock})`
    );

    // 4. Cancelar la venta
    console.log("\n4. Cancelando la venta...");
    const cancelResponse = await fetch(
      `${BASE_URL}/api/sales/${saleResult.data.id}`,
      {
        method: "DELETE",
      }
    );

    if (!cancelResponse.ok) {
      const error = await cancelResponse.text();
      console.log("❌ Error cancelando venta:", error);
      return;
    }

    const cancelResult = await cancelResponse.json();
    console.log(`✅ ${cancelResult.message}`);

    // 5. Verificar stock después de la cancelación
    console.log("\n5. Verificando stock después de la cancelación...");
    const finalResponse1 = await fetch(
      `${BASE_URL}/api/products/${product1.id}`
    );
    const finalResponse2 = await fetch(
      `${BASE_URL}/api/products/${product2.id}`
    );

    const finalProduct1 = await finalResponse1.json();
    const finalProduct2 = await finalResponse2.json();

    console.log(
      `📦 ${product1.name}: ${afterSaleProduct1.data.stock} → ${
        finalProduct1.data.stock
      } (diferencia: +${
        finalProduct1.data.stock - afterSaleProduct1.data.stock
      })`
    );
    console.log(
      `📦 ${product2.name}: ${afterSaleProduct2.data.stock} → ${
        finalProduct2.data.stock
      } (diferencia: +${
        finalProduct2.data.stock - afterSaleProduct2.data.stock
      })`
    );

    // 6. Validar resultados
    console.log("\n6. RESULTADOS:");
    console.log("=".repeat(60));

    const test1Pass = finalProduct1.data.stock === initialStock1;
    const test2Pass = finalProduct2.data.stock === initialStock2;

    console.log(
      `${test1Pass ? "✅" : "❌"} ${product1.name}: ${
        test1Pass ? "CORRECTO" : "ERROR"
      } (Inicial: ${initialStock1}, Final: ${finalProduct1.data.stock})`
    );
    console.log(
      `${test2Pass ? "✅" : "❌"} ${product2.name}: ${
        test2Pass ? "CORRECTO" : "ERROR"
      } (Inicial: ${initialStock2}, Final: ${finalProduct2.data.stock})`
    );

    if (test1Pass && test2Pass) {
      console.log(
        "\n🎉 TEST EXITOSO: La cancelación devuelve correctamente el stock"
      );
    } else {
      console.log(
        "\n💥 TEST FALLIDO: Hay problemas con la devolución de stock"
      );
    }
  } catch (error) {
    console.error("\n💥 ERROR EN EL TEST:", error.message);
  }
}

// Ejecutar test
testCancellation();
