// Script para crear una venta de prueba
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestSale() {
  try {
    // Verificar si ya existen productos
    const products = await prisma.product.findMany({ take: 3 });

    if (products.length === 0) {
      console.log(
        "No hay productos disponibles. Creando productos de prueba..."
      );

      // Crear categoría de prueba
      const category = await prisma.category.create({
        data: {
          name: "Electrónicos",
          description: "Productos electrónicos varios",
        },
      });

      // Crear productos de prueba
      const product1 = await prisma.product.create({
        data: {
          name: "Smartphone Samsung Galaxy",
          sku: "SMSG001",
          barcode: "1234567890123",
          stock: 10,
          wholesalePrice: 850000,
          retailPrice: 950000,
          unit: "unidad",
          categoryId: category.id,
        },
      });

      const product2 = await prisma.product.create({
        data: {
          name: "Auriculares Bluetooth",
          sku: "AUR001",
          barcode: "1234567890124",
          stock: 25,
          wholesalePrice: 45000,
          retailPrice: 55000,
          unit: "unidad",
          categoryId: category.id,
        },
      });

      const product3 = await prisma.product.create({
        data: {
          name: "Cargador USB-C",
          sku: "CHGR001",
          barcode: "1234567890125",
          stock: 50,
          wholesalePrice: 15000,
          retailPrice: 20000,
          unit: "unidad",
          categoryId: category.id,
        },
      });

      console.log("Productos de prueba creados.");
    }

    // Buscar o crear cliente de prueba
    let customer = await prisma.customer.findFirst({
      where: { name: "Cliente de Prueba" },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: "Cliente de Prueba",
          customerType: "retail",
          phone: "+54 11 1234-5678",
          email: "cliente@prueba.com",
        },
      });
      console.log("Cliente de prueba creado.");
    }

    // Obtener productos actualizados
    const availableProducts = await prisma.product.findMany({ take: 3 });

    // Crear venta de prueba
    const saleItems = [
      {
        productId: availableProducts[0].id,
        quantity: 1,
        unitPrice: availableProducts[0].retailPrice,
        totalPrice: availableProducts[0].retailPrice * 1,
      },
      {
        productId: availableProducts[1].id,
        quantity: 2,
        unitPrice: availableProducts[1].retailPrice,
        totalPrice: availableProducts[1].retailPrice * 2,
      },
    ];

    const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.21; // 21% IVA
    const shippingCost = 5000; // $5000 de envío
    const total = subtotal + tax + shippingCost;

    const sale = await prisma.sale.create({
      data: {
        saleNumber: `TEST-${Date.now()}`,
        subtotal: subtotal,
        total: total,
        tax: tax,
        discount: 0,
        shippingCost: shippingCost,
        shippingType: "envio_domicilio",
        paymentMethod: "efectivo",
        status: "completed",
        customerId: customer.id,
        notes: "Venta de prueba para testing de remitos",
        saleItems: {
          create: saleItems,
        },
      },
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log("¡Venta de prueba creada exitosamente!");
    console.log(`ID de la venta: ${sale.id}`);
    console.log(`Número de venta: ${sale.saleNumber}`);
    console.log(`Total: $${sale.total.toLocaleString("es-AR")}`);
    console.log(`URL para probar: http://localhost:3000/sales/${sale.id}`);

    return sale;
  } catch (error) {
    console.error("Error creando venta de prueba:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSale();
