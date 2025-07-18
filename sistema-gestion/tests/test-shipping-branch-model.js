/**
 * Test rápido para verificar que el modelo ShippingBranch funciona correctamente
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testShippingBranch() {
  try {
    console.log("🧪 Testing ShippingBranch model...");

    // Verificar que el modelo existe
    console.log(
      "✅ ShippingBranch model exists:",
      typeof prisma.shippingBranch
    );

    // Verificar que podemos hacer una consulta básica
    const count = await prisma.shippingBranch.count();
    console.log("✅ ShippingBranch count query works:", count);

    // Verificar que podemos listar customers
    const customers = await prisma.customer.findMany({
      take: 1,
      include: {
        shippingBranches: true,
      },
    });
    console.log("✅ Customer with shippingBranches relation works");

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testShippingBranch();
