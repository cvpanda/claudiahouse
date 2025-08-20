/**
 * PRUEBA: Verificar compras disponibles para testear imágenes
 * ========================================================
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAvailablePurchases() {
  try {
    console.log("🔍 Buscando compras disponibles para testear...");
    console.log("=".repeat(50));

    // Buscar compras con productos que tengan imágenes
    const purchasesWithImages = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                sku: true,
              },
            },
          },
        },
      },
      where: {
        items: {
          some: {
            product: {
              imageUrl: {
                not: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(
      `✅ Encontradas ${purchasesWithImages.length} compras con productos que tienen imágenes:`
    );
    console.log("");

    for (const purchase of purchasesWithImages) {
      const productsWithImages = purchase.items.filter(
        (item) => item.product.imageUrl
      );

      console.log(`📦 Compra: ${purchase.purchaseNumber}`);
      console.log(`   Estado: ${purchase.status}`);
      console.log(`   Proveedor: ${purchase.supplier.name}`);
      console.log(`   Items totales: ${purchase.items.length}`);
      console.log(`   Items con imagen: ${productsWithImages.length}`);

      if (productsWithImages.length > 0) {
        console.log(`   🖼️ Productos con imagen:`);
        productsWithImages.slice(0, 3).forEach((item) => {
          console.log(
            `      • ${item.product.name} (${item.product.sku || "Sin SKU"})`
          );
          console.log(`        URL: ${item.product.imageUrl}`);
        });
        if (productsWithImages.length > 3) {
          console.log(`      ... y ${productsWithImages.length - 3} más`);
        }
      }
      console.log("");
    }

    if (purchasesWithImages.length > 0) {
      const bestPurchase = purchasesWithImages[0];
      console.log("🎯 RECOMENDACIÓN PARA PROBAR:");
      console.log(`   Usar compra: ${bestPurchase.purchaseNumber}`);
      console.log(`   URL para editar: /purchases/${bestPurchase.id}/edit`);
      console.log(`   URL para ver: /purchases/${bestPurchase.id}`);
    } else {
      console.log(
        "❌ No se encontraron compras con productos que tengan imágenes"
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailablePurchases();
