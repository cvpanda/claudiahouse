const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testPurchaseAPI() {
  try {
    // Simular lo que hace el endpoint GET
    const purchase = await prisma.purchase.findUnique({
      where: { id: "cmd7sls2l0009q63du89lmiel" },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      console.log("Purchase not found");
      return;
    }

    console.log("Raw purchase from DB:");
    console.log(
      "- totalCosts:",
      purchase.totalCosts,
      typeof purchase.totalCosts
    );
    console.log(
      "- subtotalPesos:",
      purchase.subtotalPesos,
      typeof purchase.subtotalPesos
    );
    console.log("Items from DB:");
    purchase.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        quantity: item.quantity,
        unitPricePesos: item.unitPricePesos,
        distributedCosts: item.distributedCosts,
        finalUnitCost: item.finalUnitCost,
        totalCost: item.totalCost,
      });
    });

    // Calcular distribución como en el endpoint
    const totalSubtotalPesos = purchase.items.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPricePesos || 0);
    }, 0);

    const totalImportCosts =
      (purchase.freightCost || 0) +
      (purchase.customsCost || 0) +
      (purchase.taxCost || 0) +
      (purchase.insuranceCost || 0) +
      (purchase.otherCosts || 0);

    console.log("\nCalculated values:");
    console.log("- totalSubtotalPesos:", totalSubtotalPesos);
    console.log("- totalImportCosts:", totalImportCosts);

    const processedItems = purchase.items.map((item) => {
      const itemSubtotalPesos =
        (item.quantity || 0) * (item.unitPricePesos || 0);

      // Calcular el costo distribuido proporcionalmente
      const distributedCostPesos =
        totalSubtotalPesos > 0
          ? (itemSubtotalPesos / totalSubtotalPesos) * totalImportCosts
          : 0;

      // Calcular el costo distribuido por unidad
      const distributedCostPerUnit =
        (item.quantity || 0) > 0
          ? distributedCostPesos / (item.quantity || 0)
          : 0;

      // Costo final por unidad (precio + costo distribuido por unidad)
      const finalCostPesos =
        (item.unitPricePesos || 0) + distributedCostPerUnit;

      return {
        id: item.id,
        productName: item.product?.name || "Unknown",
        quantity: item.quantity || 0,
        unitPricePesos: item.unitPricePesos || 0,
        subtotalPesos: itemSubtotalPesos,
        distributedCostPesos: Math.round(distributedCostPesos * 100) / 100,
        finalCostPesos: Math.round(finalCostPesos * 100) / 100,
      };
    });

    console.log("\nProcessed items (as API should return):");
    processedItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, item);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
  }
}

testPurchaseAPI();
