const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkPurchase() {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: { purchaseNumber: "PC-000001" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (purchase) {
      console.log("Purchase found:");
      console.log("Total costs:", purchase.totalCosts);
      console.log("Subtotal pesos:", purchase.subtotalPesos);
      console.log("Items:");
      purchase.items.forEach((item) => {
        console.log(
          `- ${item.product.name}: quantity=${item.quantity}, unitPricePesos=${item.unitPricePesos}, distributedCosts=${item.distributedCosts}, finalUnitCost=${item.finalUnitCost}`
        );
      });
    } else {
      console.log("Purchase not found");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await prisma.$disconnect();
  }
}

checkPurchase();
