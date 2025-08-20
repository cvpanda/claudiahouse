/**
 * AGREGAR IMÁGENES DE PRUEBA: Productos de la compra PC-000005
 * ===========================================================
 *
 * Agrega URLs de imágenes a algunos productos de la compra para demostrar la funcionalidad
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addTestImagesToPC000005() {
  try {
    console.log("🖼️ AGREGANDO IMÁGENES DE PRUEBA: Compra PC-000005");
    console.log("=".repeat(60));

    // 1. Obtener productos de la compra PC-000005 que no tienen imagen
    const purchase = await prisma.purchase.findFirst({
      where: { purchaseNumber: "PC-000005" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      console.log("❌ Compra PC-000005 no encontrada");
      return;
    }

    const productsWithoutImages = purchase.items
      .filter((item) => !item.product.imageUrl)
      .slice(0, 10); // Solo primeros 10 para la demo

    console.log(`📦 Productos en la compra: ${purchase.items.length}`);
    console.log(
      `❌ Sin imagen: ${
        purchase.items.filter((item) => !item.product.imageUrl).length
      }`
    );
    console.log(
      `✅ Con imagen: ${
        purchase.items.filter((item) => item.product.imageUrl).length
      }`
    );
    console.log(
      `🎯 Agregando imágenes a: ${productsWithoutImages.length} productos`
    );

    // 2. URLs de imágenes de ejemplo (placeholder coloridos)
    const sampleImageUrls = [
      "https://picsum.photos/300/300?random=1", // Imagen aleatoria 1
      "https://picsum.photos/300/300?random=2", // Imagen aleatoria 2
      "https://picsum.photos/300/300?random=3", // Imagen aleatoria 3
      "https://picsum.photos/300/300?random=4", // Imagen aleatoria 4
      "https://picsum.photos/300/300?random=5", // Imagen aleatoria 5
      "https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Producto+6",
      "https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Producto+7",
      "https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Producto+8",
      "https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=Producto+9",
      "https://via.placeholder.com/300x300/FECA57/000000?text=Producto+10",
    ];

    // 3. Actualizar productos con imágenes de prueba
    console.log("\n🔧 Actualizando productos...");

    const updates = [];
    for (let i = 0; i < productsWithoutImages.length; i++) {
      const item = productsWithoutImages[i];
      const imageUrl = sampleImageUrls[i % sampleImageUrls.length];

      const updatePromise = prisma.product.update({
        where: { id: item.product.id },
        data: { imageUrl: imageUrl },
      });

      updates.push(updatePromise);

      console.log(`   ✅ ${item.product.sku} - ${item.product.name}`);
      console.log(`      🖼️ ${imageUrl}`);
    }

    // Ejecutar todas las actualizaciones
    await Promise.all(updates);

    console.log(
      `\n🎉 ¡${productsWithoutImages.length} productos actualizados con imágenes de prueba!`
    );
    console.log(`\n🎯 RESULTADO:`);
    console.log(`   Ahora puedes probar la edición de compras y verás:`);
    console.log(`   • Imágenes en la tabla de productos de la compra`);
    console.log(`   • Imágenes en el modal de búsqueda de productos`);
    console.log(
      `   • Indicador visual "Con imagen" para productos que tienen foto`
    );

    console.log(`\n📝 NOTA: Estas son imágenes de prueba temporales`);
    console.log(
      `   Reemplázalas con las imágenes reales de tus productos cuando las tengas`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestImagesToPC000005();
