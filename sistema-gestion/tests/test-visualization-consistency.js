const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function formatNumber(num) {
  if (!num && num !== 0) return "";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

async function testVisualizationConsistency() {
  console.log("=== TESTING VISUALIZATION CONSISTENCY ===");

  try {
    // Get the test purchase
    const purchase = await prisma.purchase.findFirst({
      where: {
        number: {
          contains: "PC-TEST-",
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      console.log("❌ No test purchase found");
      return;
    }

    console.log(`\n📋 Testing Purchase: ${purchase.number}`);
    console.log(`   ID: ${purchase.id}`);
    console.log(`   Exchange Rate: ${purchase.exchangeRate}`);
    console.log(`   Shipping Cost: ${formatNumber(purchase.shippingCost)} USD`);
    console.log(
      `   Additional Costs: ${formatNumber(purchase.additionalCosts)} ARS`
    );

    console.log("\n📦 Items Analysis:");
    let totalCostUSD = 0;
    let totalFinalCostARS = 0;

    purchase.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.product.name}`);
      console.log(`   Quantity: ${item.quantity}`);
      console.log(`   Unit Price USD: ${formatNumber(item.unitPriceUSD)}`);
      console.log(`   Unit Price ARS: ${formatNumber(item.unitPriceARS)}`);
      console.log(`   Subtotal USD: ${formatNumber(item.subtotalUSD)}`);
      console.log(`   Subtotal ARS: ${formatNumber(item.subtotalARS)}`);
      console.log(
        `   Distributed Costs: ${formatNumber(item.distributedCosts)}`
      );
      console.log(`   Final Unit Cost: ${formatNumber(item.finalUnitCost)}`);

      // Verify calculations
      const expectedSubtotalUSD = item.quantity * item.unitPriceUSD;
      const expectedSubtotalARS = item.quantity * item.unitPriceARS;
      const expectedDistributedUnitCost = item.distributedCosts / item.quantity;

      console.log(`\n   ✓ Validation:`);
      console.log(
        `     Subtotal USD: ${formatNumber(expectedSubtotalUSD)} ${
          expectedSubtotalUSD === item.subtotalUSD ? "✅" : "❌"
        }`
      );
      console.log(
        `     Subtotal ARS: ${formatNumber(expectedSubtotalARS)} ${
          expectedSubtotalARS === item.subtotalARS ? "✅" : "❌"
        }`
      );
      console.log(
        `     Distributed Unit Cost: ${formatNumber(
          expectedDistributedUnitCost
        )} ${
          Math.abs(
            expectedDistributedUnitCost - item.distributedCosts / item.quantity
          ) < 0.01
            ? "✅"
            : "❌"
        }`
      );

      totalCostUSD += item.subtotalUSD;
      totalFinalCostARS += item.finalUnitCost * item.quantity;
    });

    // Calculate expected totals
    const expectedShippingCostARS =
      purchase.shippingCost * purchase.exchangeRate;
    const expectedTotalDistributableCosts =
      expectedShippingCostARS + purchase.additionalCosts;
    const expectedTotalCostARS =
      totalCostUSD * purchase.exchangeRate + expectedTotalDistributableCosts;

    console.log("\n💰 Purchase Totals:");
    console.log(`   Total Cost USD: ${formatNumber(totalCostUSD)}`);
    console.log(
      `   Shipping Cost ARS: ${formatNumber(expectedShippingCostARS)}`
    );
    console.log(
      `   Total Distributable Costs: ${formatNumber(
        expectedTotalDistributableCosts
      )}`
    );
    console.log(
      `   Expected Total Cost ARS: ${formatNumber(expectedTotalCostARS)}`
    );
    console.log(
      `   Calculated Final Cost ARS: ${formatNumber(totalFinalCostARS)}`
    );

    // Test the GET endpoint
    console.log("\n🔗 Testing GET Endpoint Response:");
    const response = await fetch(
      `http://localhost:3000/api/purchases/${purchase.id}`
    );

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }

    const apiData = await response.json();
    console.log(`   ✅ API Response received`);
    console.log(`   Items count: ${apiData.items?.length || 0}`);

    if (apiData.items && apiData.items.length > 0) {
      console.log("\n📊 API vs Database Comparison:");
      apiData.items.forEach((apiItem, index) => {
        const dbItem = purchase.items[index];
        console.log(`\n${index + 1}. ${apiItem.product.name}`);
        console.log(
          `   DB Final Unit Cost: ${formatNumber(dbItem.finalUnitCost)}`
        );
        console.log(
          `   API Final Unit Cost: ${formatNumber(apiItem.finalUnitCost)}`
        );
        console.log(
          `   DB Distributed Costs: ${formatNumber(dbItem.distributedCosts)}`
        );
        console.log(
          `   API Distributed Costs: ${formatNumber(apiItem.distributedCosts)}`
        );

        const costMatch =
          Math.abs(dbItem.finalUnitCost - apiItem.finalUnitCost) < 0.01;
        const distributedMatch =
          Math.abs(dbItem.distributedCosts - apiItem.distributedCosts) < 0.01;

        console.log(`   Final Cost Match: ${costMatch ? "✅" : "❌"}`);
        console.log(
          `   Distributed Cost Match: ${distributedMatch ? "✅" : "❌"}`
        );
      });
    }

    console.log("\n✅ Visualization consistency test completed");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVisualizationConsistency();
