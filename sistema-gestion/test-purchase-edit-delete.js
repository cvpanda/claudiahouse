// Script para testear la funcionalidad de edición y eliminación de compras

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testPurchaseEditAndDelete() {
  console.log("=== TESTING PURCHASE EDIT AND DELETE FUNCTIONALITY ===\n");

  try {
    // 1. Obtener una compra existente para testear
    const existingPurchase = await prisma.purchase.findFirst({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingPurchase) {
      console.log("❌ No hay compras en la base de datos para testear");
      return;
    }

    console.log("📄 Compra a testear:");
    console.log(`   ID: ${existingPurchase.id}`);
    console.log(`   Número: ${existingPurchase.purchaseNumber}`);
    console.log(`   Estado: ${existingPurchase.status}`);
    console.log(`   Proveedor: ${existingPurchase.supplier?.name}`);
    console.log(`   Items: ${existingPurchase.items?.length || 0}`);
    console.log(`   Total: $${existingPurchase.total}\n`);

    // 2. Verificar qué acciones se pueden realizar según el estado
    const canEdit = ["PENDING", "ORDERED", "SHIPPED"].includes(
      existingPurchase.status
    );
    const canDelete = !["RECEIVED", "IN_TRANSIT"].includes(
      existingPurchase.status
    );

    console.log("🔍 Permisos según estado actual:");
    console.log(`   ✏️  Puede editar: ${canEdit ? "✅ SÍ" : "❌ NO"}`);
    console.log(`   🗑️  Puede eliminar: ${canDelete ? "✅ SÍ" : "❌ NO"}\n`);

    // 3. Si la compra está completada, mostrar el impacto en productos
    if (existingPurchase.status === "COMPLETED") {
      console.log("📦 Impacto en productos (compra completada):");

      for (const item of existingPurchase.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        console.log(`   ${product?.name}:`);
        console.log(`     - Stock actual: ${product?.stock}`);
        console.log(`     - Costo actual: $${product?.cost}`);
        console.log(`     - Cantidad en compra: ${item.quantity}`);
        console.log(`     - Costo final: $${item.finalUnitCost}`);
      }
      console.log();
    }

    // 4. Mostrar el endpoint para editar
    console.log("🔧 Endpoints disponibles:");
    console.log(`   GET    /api/purchases/${existingPurchase.id}`);
    console.log(`   PUT    /api/purchases/${existingPurchase.id}/edit`);
    console.log(`   DELETE /api/purchases/${existingPurchase.id}`);
    console.log();

    // 5. Simular estructura de datos para edición
    console.log(
      "📝 Estructura de datos para edición (PUT /api/purchases/[id]/edit):"
    );
    const editStructure = {
      supplierId: existingPurchase.supplierId,
      type: existingPurchase.type,
      currency: existingPurchase.currency || "ARS",
      exchangeRate: existingPurchase.exchangeRate,
      exchangeType: existingPurchase.exchangeType,
      freightCost: existingPurchase.freightCost || 0,
      customsCost: existingPurchase.customsCost || 0,
      taxCost: existingPurchase.taxCost || 0,
      insuranceCost: existingPurchase.insuranceCost || 0,
      otherCosts: existingPurchase.otherCosts || 0,
      notes: existingPurchase.notes || "",
      orderDate: existingPurchase.orderDate?.toISOString().split("T")[0],
      expectedDate: existingPurchase.expectedDate?.toISOString().split("T")[0],
      items:
        existingPurchase.items?.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceForeign: item.unitPriceForeign,
          unitPricePesos: item.unitPricePesos,
          _action: "update",
        })) || [],
    };

    console.log(JSON.stringify(editStructure, null, 2));
    console.log();

    // 6. Verificar movimientos de stock si existen
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        reference: {
          contains: existingPurchase.purchaseNumber,
        },
      },
      include: {
        product: true,
      },
    });

    if (stockMovements.length > 0) {
      console.log("📈 Movimientos de stock relacionados:");
      stockMovements.forEach((movement) => {
        console.log(
          `   ${movement.product.name}: ${movement.type} ${movement.quantity} (${movement.reason})`
        );
      });
      console.log();
    }

    console.log("✅ Test completado exitosamente");
  } catch (error) {
    console.error("❌ Error durante el test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el test
testPurchaseEditAndDelete();
