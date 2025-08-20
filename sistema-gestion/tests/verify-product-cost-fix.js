/**
 * Verificación específica del producto "Separador carpeta Hello cactus" (SKU: LIB62)
 * Para confirmar que el costo fue corregido correctamente
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyProductCost() {
  try {
    console.log("🔍 Verificando corrección del producto LIB62");
    console.log("=".repeat(50));

    const product = await prisma.product.findUnique({
      where: { sku: "LIB62" },
    });

    if (!product) {
      console.log("❌ Producto no encontrado");
      return;
    }

    console.log("📦 Producto encontrado:");
    console.log(`   Nombre: ${product.name}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   Costo actual: $${product.cost}`);
    console.log(`   Precio mayorista: $${product.wholesalePrice}`);
    console.log(`   Precio minorista: $${product.retailPrice}`);

    // Verificar si el costo es correcto (debería ser $4.607,80)
    const expectedCost = 4607.8;
    const actualCost = parseFloat(product.cost);

    console.log(`\n✅ Verificación:`);
    console.log(
      `   Costo esperado: $${expectedCost.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`
    );
    console.log(
      `   Costo actual: $${actualCost.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`
    );
    console.log(
      `   Diferencia: $${Math.abs(expectedCost - actualCost).toLocaleString(
        "es-AR",
        { minimumFractionDigits: 2 }
      )}`
    );

    if (Math.abs(expectedCost - actualCost) < 0.01) {
      console.log("\n🎉 ¡CORRECCIÓN EXITOSA!");
      console.log("   ✅ El costo del producto es correcto");
      console.log(
        "   ✅ Se guardó el Costo Final Unitario (incluye distribución de costos)"
      );
      console.log("   ✅ Ya no se usa el costo base incorrecto");
    } else {
      console.log("\n❌ PROBLEMA DETECTADO:");
      console.log("   El costo no coincide con el esperado");
    }

    // Verificar los márgenes
    const wholesaleMargin =
      ((product.wholesalePrice - actualCost) / actualCost) * 100;
    const retailMargin =
      ((product.retailPrice - actualCost) / actualCost) * 100;

    console.log(`\n📊 Márgenes actualizados:`);
    console.log(`   Margen mayorista: ${wholesaleMargin.toFixed(1)}%`);
    console.log(`   Margen minorista: ${retailMargin.toFixed(1)}%`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProductCost();
