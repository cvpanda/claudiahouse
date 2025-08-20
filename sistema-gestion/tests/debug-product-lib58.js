/**
 * DEBUGGING: Verificar producto específico LIB58
 * =============================================
 *
 * Verificar si el producto tiene imageUrl y por qué no se muestra en purchases/new
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugProductLIB58() {
  try {
    console.log("🔍 DEBUGGING: Producto LIB58");
    console.log("=".repeat(50));

    // 1. Verificar el producto directo en la base de datos
    const product = await prisma.product.findFirst({
      where: { sku: "LIB58" },
      include: {
        supplier: true,
        category: true,
      },
    });

    if (!product) {
      console.log("❌ Producto LIB58 no encontrado");
      return;
    }

    console.log("📦 PRODUCTO ENCONTRADO:");
    console.log(`   ID: ${product.id}`);
    console.log(`   Nombre: ${product.name}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   ImageURL: ${product.imageUrl || "NULL"}`);
    console.log(`   Activo: ${product.isActive}`);
    console.log(`   Categoría: ${product.category.name}`);
    console.log(`   Proveedor: ${product.supplier.name}`);

    // 2. Probar el API endpoint que usa purchases/new
    console.log("\n🌐 PROBANDO API /api/products:");

    try {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(
        "http://localhost:3000/api/products?search=LIB58"
      );

      if (response.ok) {
        const data = await response.json();
        const foundProduct = data.data.find((p) => p.sku === "LIB58");

        if (foundProduct) {
          console.log("✅ Producto encontrado en API:");
          console.log(`   Nombre: ${foundProduct.name}`);
          console.log(`   SKU: ${foundProduct.sku}`);
          console.log(`   ImageURL en API: ${foundProduct.imageUrl || "NULL"}`);
          console.log(
            `   ¿Tiene imageUrl?: ${
              foundProduct.hasOwnProperty("imageUrl") ? "SÍ" : "NO"
            }`
          );
        } else {
          console.log("❌ Producto no encontrado en respuesta de API");
          console.log(`   Total productos en respuesta: ${data.data.length}`);
        }
      } else {
        console.log(`❌ API respondió con error: ${response.status}`);
      }
    } catch (apiError) {
      console.log(
        "⚠️ No se pudo probar API (servidor posiblemente no está corriendo)"
      );
      console.log("   Esto es normal si el servidor no está iniciado");
    }

    // 3. Verificar estructura del producto tal como la espera el frontend
    console.log("\n🎯 ESTRUCTURA ESPERADA POR EL FRONTEND:");
    const frontendProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      cost: product.cost,
      imageUrl: product.imageUrl, // ← Campo crítico
      supplier: {
        id: product.supplier.id,
        name: product.supplier.name,
      },
      category: {
        id: product.category.id,
        name: product.category.name,
      },
    };

    console.log("   ✅ Objeto que debería recibir el frontend:");
    console.log(JSON.stringify(frontendProduct, null, 2));

    // 4. Verificar URL de imagen específicamente
    if (product.imageUrl) {
      console.log("\n🖼️ VERIFICACIÓN DE URL DE IMAGEN:");
      console.log(`   URL: ${product.imageUrl}`);
      console.log(`   Tipo: ${typeof product.imageUrl}`);
      console.log(`   Longitud: ${product.imageUrl.length}`);
      console.log(
        `   ¿Es Google Drive?: ${
          product.imageUrl.includes("drive.google.com") ? "SÍ" : "NO"
        }`
      );

      // Sugerir URL de prueba si es necesario
      if (product.imageUrl.includes("drive.google.com")) {
        console.log("   💡 URL de Google Drive detectada - debería funcionar");
      } else {
        console.log(
          "   ⚠️ URL no es de Google Drive - puede haber problemas de CORS"
        );
      }
    } else {
      console.log("\n❌ PROBLEMA: imageUrl está NULL/vacío");
      console.log("   El producto no tiene imagen asignada");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductLIB58();
