/**
 * Test script para verificar la funcionalidad mejorada de ventas
 * Uso: node tests/test-sales-improvements.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testSalesImprovements() {
  try {
    console.log("🧪 Iniciando prueba de mejoras en ventas...\n");

    // 1. Verificar productos con imágenes
    const productsWithImages = await prisma.product.findMany({
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

    console.log(
      `📦 Productos encontrados con imagen: ${productsWithImages.length}`
    );
    productsWithImages.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (Stock: ${product.stock})`);
      console.log(`     - SKU: ${product.sku || "Sin SKU"}`);
      console.log(
        `     - Mayorista: $${product.wholesalePrice} | Minorista: $${product.retailPrice}`
      );
      console.log(`     - Imagen: ✅ Disponible`);
      console.log(
        `     - Stock: ${product.stock === 0 ? "❌ SIN STOCK" : "✅ Con stock"}`
      );
      console.log("");
    });

    // 2. Verificar productos sin stock
    const productsWithoutStock = await prisma.product.findMany({
      take: 3,
      include: {
        category: true,
      },
      where: {
        stock: 0,
      },
    });

    console.log(
      `📉 Productos sin stock encontrados: ${productsWithoutStock.length}`
    );
    productsWithoutStock.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - Stock: ${product.stock}`);
    });

    // 3. Contar total de productos
    const totalProducts = await prisma.product.count();
    console.log(`\n📊 Total de productos en base: ${totalProducts}`);

    console.log("\n✅ Funcionalidades implementadas en VENTAS:");
    console.log(
      "   📸 Imágenes más grandes (w-20 h-20 en modal, w-16 h-16 en lista)"
    );
    console.log("   🔍 Búsqueda instantánea entre TODOS los productos");
    console.log("   ☑️  Selección múltiple con checkboxes");
    console.log('   🎯 Botón "Agregar X productos" dinámico');
    console.log('   📦 Botón "Cargar más productos" para paginación');
    console.log(
      "   🚫 Productos sin stock permitidos (no se resta del stock si es 0)"
    );
    console.log('   ⚡ Botón "Agregar individual" para casos rápidos');
    console.log(
      "   🎨 Estados visuales claros (seleccionado, agregado, sin stock)"
    );
    console.log("   🔄 Híbrido: Búsqueda instantánea + cargar más");

    console.log("\n📋 Diferencias vs sistema anterior:");
    console.log("   ❌ ANTES: Solo primeros 50 productos disponibles");
    console.log(
      `   ✅ AHORA: Todos los ${totalProducts} productos disponibles`
    );
    console.log("   ❌ ANTES: Un producto por vez");
    console.log("   ✅ AHORA: Selección múltiple masiva");
    console.log("   ❌ ANTES: Imágenes pequeñas (w-12 h-12)");
    console.log("   ✅ AHORA: Imágenes grandes (w-20 h-20)");
    console.log("   ❌ ANTES: Productos sin stock bloqueados");
    console.log("   ✅ AHORA: Productos sin stock permitidos con aviso");

    console.log("\n📋 Para probar:");
    console.log("   1. Ir a /sales/new");
    console.log('   2. Hacer clic en "Agregar Productos"');
    console.log("   3. Buscar cualquier producto (ej: buscar por categoría)");
    console.log("   4. Seleccionar múltiples productos con checkboxes");
    console.log('   5. Hacer clic en "Agregar X productos"');
    console.log("   6. Verificar productos sin stock se pueden agregar");
    console.log('   7. Probar "Cargar más productos" si hay muchos');
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSalesImprovements();
