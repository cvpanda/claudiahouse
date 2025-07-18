import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpiar datos existentes
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Electrónicos",
        code: "ELE",
        description: "Productos electrónicos y tecnológicos",
      },
    }),
    prisma.category.create({
      data: {
        name: "Ropa",
        code: "ROP",
        description: "Prendas de vestir y accesorios",
      },
    }),
    prisma.category.create({
      data: {
        name: "Hogar",
        code: "HOG",
        description: "Artículos para el hogar",
      },
    }),
    prisma.category.create({
      data: {
        name: "Alimentos",
        code: "ALI",
        description: "Productos alimenticios",
      },
    }),
  ]);

  // Crear proveedores
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Tech Solutions SA",
        contact: "Juan Pérez",
        phone: "+54 11 1234-5678",
        email: "juan@techsolutions.com",
        address: "Av. Corrientes 1234, CABA",
        cuit: "30-12345678-9",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Textiles del Sur",
        contact: "María García",
        phone: "+54 11 8765-4321",
        email: "maria@textilesdelsur.com",
        address: "Av. Rivadavia 5678, CABA",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Distribuidora Central",
        contact: "Carlos López",
        phone: "+54 11 9999-8888",
        email: "carlos@distribuidoracentral.com",
        address: "Av. San Martín 999, CABA",
      },
    }),
  ]);

  // Crear productos
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Smartphone Galaxy A54",
        description: "Smartphone Samsung Galaxy A54 128GB",
        sku: "PHONE001",
        barcode: "7891234567890",
        cost: 120000,
        wholesalePrice: 150000,
        retailPrice: 180000,
        stock: 15,
        minStock: 5,
        maxStock: 50,
        unit: "unit",
        supplierId: suppliers[0].id,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Camisa Formal Blanca",
        description: "Camisa formal de algodón, color blanco, talla M",
        sku: "SHIRT001",
        cost: 2500,
        wholesalePrice: 3500,
        retailPrice: 4500,
        stock: 25,
        minStock: 10,
        unit: "unit",
        supplierId: suppliers[1].id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Café Premium 500g",
        description: "Café molido premium, bolsa de 500g",
        sku: "COFFEE001",
        cost: 1200,
        wholesalePrice: 1800,
        retailPrice: 2200,
        stock: 50,
        minStock: 20,
        unit: "unit",
        supplierId: suppliers[2].id,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lámpara LED Escritorio",
        description: "Lámpara LED ajustable para escritorio",
        sku: "LAMP001",
        cost: 3500,
        wholesalePrice: 5000,
        retailPrice: 6500,
        stock: 8,
        minStock: 5,
        unit: "unit",
        supplierId: suppliers[0].id,
        categoryId: categories[2].id,
      },
    }),
  ]);

  // Crear clientes
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Ana Rodríguez",
        email: "ana@email.com",
        phone: "+54 11 5555-1111",
        address: "Av. Libertador 1000, CABA",
        customerType: "retail",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Negocio Los Andes",
        email: "negocio@email.com",
        phone: "+54 11 5555-2222",
        address: "Av. Cabildo 2000, CABA",
        cuit: "27-12345678-9",
        customerType: "wholesale",
      },
    }),
  ]);

  // Crear movimientos de stock iniciales
  for (const product of products) {
    await prisma.stockMovement.create({
      data: {
        type: "in",
        quantity: product.stock,
        reason: "Stock inicial",
        productId: product.id,
      },
    });
  }

  console.log("✅ Seed completado exitosamente!");
  console.log(`📦 Creadas ${categories.length} categorías`);
  console.log(`🏢 Creados ${suppliers.length} proveedores`);
  console.log(`📱 Creados ${products.length} productos`);
  console.log(`👥 Creados ${customers.length} clientes`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
