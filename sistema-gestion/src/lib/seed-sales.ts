import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSales() {
  console.log("🌱 Sembrando datos de ventas...");

  try {
    // Obtener productos existentes
    const products = await prisma.product.findMany();
    const customers = await prisma.customer.findMany();

    if (products.length === 0) {
      console.log(
        "❌ No hay productos disponibles. Ejecuta primero el seed principal."
      );
      return;
    }

    // Crear ventas de los últimos 30 días
    const salesData = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const saleDate = new Date(
        now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
      );

      // Seleccionar productos aleatorios para la venta
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 productos por venta
      const selectedProducts = [];

      for (let j = 0; j < numItems; j++) {
        const randomProduct =
          products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 unidades
        const isWholesale = Math.random() < 0.3; // 30% chance wholesale
        const unitPrice = isWholesale
          ? randomProduct.wholesalePrice
          : randomProduct.retailPrice;

        selectedProducts.push({
          productId: randomProduct.id,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        });
      }

      const subtotal = selectedProducts.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const tax = subtotal * 0.21; // 21% IVA
      const discount = Math.random() < 0.2 ? subtotal * 0.1 : 0; // 20% chance de 10% descuento
      const total = subtotal + tax - discount;

      salesData.push({
        saleNumber: `VTA-${String(Date.now() + i).slice(-6)}`,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: ["cash", "card", "transfer"][
          Math.floor(Math.random() * 3)
        ],
        status: "completed",
        customerId:
          customers.length > 0 && Math.random() < 0.7
            ? customers[Math.floor(Math.random() * customers.length)].id
            : null,
        createdAt: saleDate,
        items: selectedProducts,
      });
    }

    // Crear las ventas en la base de datos
    for (const saleData of salesData) {
      const { items, ...saleInfo } = saleData;

      const sale = await prisma.sale.create({
        data: saleInfo,
      });

      // Crear los items de la venta
      for (const item of items) {
        await prisma.saleItem.create({
          data: {
            ...item,
            saleId: sale.id,
          },
        });
      }

      console.log(
        `✅ Venta creada: ${sale.saleNumber} - $${sale.total.toFixed(2)}`
      );
    }

    console.log(
      `🎉 ${salesData.length} ventas de ejemplo creadas exitosamente!`
    );
  } catch (error) {
    console.error("❌ Error sembrando ventas:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  seedSales();
}

export default seedSales;
