const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getPurchaseId() {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: { purchaseNumber: "PC-000001" },
      select: { id: true },
    });

    if (purchase) {
      console.log("Purchase ID:", purchase.id);
    } else {
      console.log("Purchase not found");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await prisma.$disconnect();
  }
}

getPurchaseId();
