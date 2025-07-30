const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanProductPrices() {
  console.log("🧹 Iniciando limpieza de precios de productos...");

  try {
    // Obtener todos los productos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        cost: true,
        wholesalePrice: true,
        retailPrice: true,
      },
    });

    console.log(`📊 Encontrados ${products.length} productos para revisar`);

    let updatedCount = 0;

    for (const product of products) {
      const originalCost = product.cost;
      const originalWholesale = product.wholesalePrice;
      const originalRetail = product.retailPrice;

      // Redondear precios a 2 decimales
      const cleanCost = Math.round(originalCost * 100) / 100;
      const cleanWholesale = Math.round(originalWholesale * 100) / 100;
      const cleanRetail = Math.round(originalRetail * 100) / 100;

      // Solo actualizar si hay cambios
      const needsUpdate =
        cleanCost !== originalCost ||
        cleanWholesale !== originalWholesale ||
        cleanRetail !== originalRetail;

      if (needsUpdate) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            cost: cleanCost,
            wholesalePrice: cleanWholesale,
            retailPrice: cleanRetail,
          },
        });

        console.log(`✅ ${product.name}:`);
        if (cleanCost !== originalCost) {
          console.log(`   Costo: ${originalCost} → ${cleanCost}`);
        }
        if (cleanWholesale !== originalWholesale) {
          console.log(`   Mayorista: ${originalWholesale} → ${cleanWholesale}`);
        }
        if (cleanRetail !== originalRetail) {
          console.log(`   Minorista: ${originalRetail} → ${cleanRetail}`);
        }

        updatedCount++;
      }
    }

    console.log(`\n🎉 Limpieza completada!`);
    console.log(
      `📈 Productos actualizados: ${updatedCount} de ${products.length}`
    );

    if (updatedCount === 0) {
      console.log("✨ No se encontraron precios que necesiten corrección");
    }
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  cleanProductPrices();
}

module.exports = { cleanProductPrices };
