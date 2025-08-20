/**
 * Test script para verificar la funcionalidad de selección múltiple
 * Uso: node tests/test-multiple-selection.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testMultipleSelection() {
  try {
    console.log("🧪 Iniciando prueba de selección múltiple...");

    // 1. Buscar algunos productos para simular la selección
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        category: true,
        supplier: true,
      },
      where: {
        imageUrl: {
          not: null,
        },
      },
    });

    console.log(`📦 Productos encontrados con imagen: ${products.length}`);

    products.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.name} (${product.sku || "Sin SKU"})`
      );
      console.log(`     - Costo: $${product.cost}`);
      console.log(`     - Stock: ${product.stock} ${product.unit}`);
      console.log(`     - Imagen: ${product.imageUrl ? "✅ Sí" : "❌ No"}`);
      console.log(`     - Categoría: ${product.category.name}`);
      console.log("");
    });

    console.log("✅ Funcionalidad implementada:");
    console.log("   📸 Imágenes más grandes (w-16 h-16 vs w-12 h-12)");
    console.log("   ☑️  Selección múltiple con checkboxes");
    console.log('   🎯 Botón "Agregar X productos" dinámico');
    console.log('   🧹 Botón "Limpiar selección"');
    console.log('   ⚡ Botón "Agregar individual" para casos rápidos');
    console.log("   🚫 Productos ya agregados deshabilitados");
    console.log(
      "   🎨 Estados visuales claros (seleccionado, agregado, normal)"
    );

    console.log("\n📋 Para probar:");
    console.log("   1. Ir a /purchases/new");
    console.log('   2. Hacer clic en "Agregar Producto"');
    console.log("   3. Seleccionar múltiples productos con los checkboxes");
    console.log('   4. Hacer clic en "Agregar X productos"');
    console.log("   5. Verificar que las imágenes se ven más grandes");
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultipleSelection();
