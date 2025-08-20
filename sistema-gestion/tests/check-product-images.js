/**
 * VERIFICACIÓN: Productos con imágenes para pruebas visuales
 * ========================================================
 *
 * Este script verifica qué productos tienen imágenes y agrega algunas de prueba
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkProductImages() {
  try {
    console.log("🖼️ VERIFICACIÓN: Productos con imágenes");
    console.log("=".repeat(50));

    // 1. Contar productos con/sin imágenes
    const [productsWithImages, productsWithoutImages] = await Promise.all([
      prisma.product.count({
        where: {
          imageUrl: { not: null },
          isActive: true,
        },
      }),
      prisma.product.count({
        where: {
          imageUrl: null,
          isActive: true,
        },
      }),
    ]);

    console.log(`📊 Estadísticas de imágenes:`);
    console.log(`   ✅ Productos CON imagen: ${productsWithImages}`);
    console.log(`   ❌ Productos SIN imagen: ${productsWithoutImages}`);
    console.log(
      `   📦 Total productos activos: ${
        productsWithImages + productsWithoutImages
      }`
    );

    // 2. Mostrar algunos productos con imágenes (si los hay)
    if (productsWithImages > 0) {
      console.log(`\n🖼️ Productos con imágenes (primeros 5):`);
      const sampleProducts = await prisma.product.findMany({
        where: {
          imageUrl: { not: null },
          isActive: true,
        },
        select: {
          name: true,
          sku: true,
          imageUrl: true,
        },
        take: 5,
      });

      sampleProducts.forEach((product) => {
        console.log(`   📦 ${product.sku} - ${product.name}`);
        console.log(`      🖼️ ${product.imageUrl}`);
      });
    }

    // 3. Sugerir agregar imágenes de prueba si no hay muchas
    if (productsWithImages < 3) {
      console.log(`\n💡 SUGERENCIA: Pocos productos con imágenes para pruebas`);
      console.log(
        `   Considera agregar URLs de imágenes de prueba a algunos productos`
      );
      console.log(`   Ejemplo de URLs de prueba:`);
      console.log(
        `   - https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=Producto1`
      );
      console.log(
        `   - https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=Producto2`
      );
      console.log(
        `   - https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=Producto3`
      );

      // Opcional: Agregar imágenes de prueba a los primeros productos
      const productsForImages = await prisma.product.findMany({
        where: {
          imageUrl: null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
        },
        take: 3,
      });

      if (productsForImages.length > 0) {
        console.log(
          `\n🔧 ¿Quieres agregar imágenes de prueba? (Solo para demo)`
        );
        console.log(
          `   Ejecuta este comando para agregar imágenes temporales:`
        );
        console.log(
          `   (Cambia las URLs por imágenes reales cuando las tengas)`
        );

        const testImageUrls = [
          "https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=Demo1",
          "https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=Demo2",
          "https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=Demo3",
        ];

        for (let i = 0; i < productsForImages.length && i < 3; i++) {
          const product = productsForImages[i];
          console.log(
            `   UPDATE products SET imageUrl='${testImageUrls[i]}' WHERE id='${product.id}'; -- ${product.name}`
          );
        }
      }
    }

    // 4. Verificar que las URLs de imágenes son válidas
    if (productsWithImages > 0) {
      console.log(`\n🔍 Verificando validez de URLs de imágenes...`);
      const allProductsWithImages = await prisma.product.findMany({
        where: {
          imageUrl: { not: null },
          isActive: true,
        },
        select: {
          name: true,
          imageUrl: true,
        },
      });

      let validUrls = 0;
      let invalidUrls = 0;

      allProductsWithImages.forEach((product) => {
        try {
          new URL(product.imageUrl);
          validUrls++;
        } catch {
          console.log(
            `   ⚠️ URL inválida en "${product.name}": ${product.imageUrl}`
          );
          invalidUrls++;
        }
      });

      console.log(`   ✅ URLs válidas: ${validUrls}`);
      console.log(`   ❌ URLs inválidas: ${invalidUrls}`);
    }

    console.log(`\n🎯 LISTO: Verificación de imágenes completada`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductImages();
