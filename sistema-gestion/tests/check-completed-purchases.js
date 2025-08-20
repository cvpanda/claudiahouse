/**
 * VERIFICAR COMPRAS COMPLETADAS DISPONIBLES
 * =========================================
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkCompletedPurchases() {
  try {
    console.log("📦 VERIFICANDO COMPRAS COMPLETADAS");
    console.log("=".repeat(50));

    const completedPurchases = await prisma.purchase.findMany({
      where: { status: "COMPLETED" },
      select: {
        id: true,
        purchaseNumber: true,
        status: true,
        total: true,
        items: {
          select: {
            id: true,
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `✅ Compras completadas encontradas: ${completedPurchases.length}`
    );

    completedPurchases.forEach((purchase) => {
      const itemsWithImages = purchase.items.filter(
        (item) => item.product.imageUrl
      ).length;
      const totalItems = purchase.items.length;

      console.log(`\n📦 ${purchase.purchaseNumber} (ID: ${purchase.id})`);
      console.log(`   💰 Total: $${purchase.total}`);
      console.log(`   📊 Items: ${totalItems}`);
      console.log(`   🖼️ Con imágenes: ${itemsWithImages}/${totalItems}`);
    });

    if (completedPurchases.length > 0) {
      const firstPurchase = completedPurchases[0];
      console.log(
        `\n🎯 Puedes usar la compra: ${firstPurchase.purchaseNumber}`
      );
      console.log(`   Para probar las imágenes en edición de compras`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompletedPurchases();
