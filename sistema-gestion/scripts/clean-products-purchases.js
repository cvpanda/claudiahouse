/**
 * Script para limpiar productos y compras de la base de datos
 * Mantiene: proveedores, usuarios, roles, permisos y clientes
 * Elimina: productos, compras, ventas y movimientos de stock
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Iniciando limpieza de la base de datos...");

  try {
    // Eliminar en orden correcto respetando las relaciones

    console.log("📦 Eliminando movimientos de stock...");
    const deletedMovements = await prisma.stockMovement.deleteMany({});
    console.log(`   ✅ ${deletedMovements.count} movimientos eliminados`);

    console.log("🛒 Eliminando items de venta...");
    const deletedSaleItems = await prisma.saleItem.deleteMany({});
    console.log(`   ✅ ${deletedSaleItems.count} items de venta eliminados`);

    console.log("💰 Eliminando ventas...");
    const deletedSales = await prisma.sale.deleteMany({});
    console.log(`   ✅ ${deletedSales.count} ventas eliminadas`);

    console.log("📋 Eliminando items de compra...");
    const deletedPurchaseItems = await prisma.purchaseItem.deleteMany({});
    console.log(
      `   ✅ ${deletedPurchaseItems.count} items de compra eliminados`
    );

    console.log("🛍️ Eliminando compras...");
    const deletedPurchases = await prisma.purchase.deleteMany({});
    console.log(`   ✅ ${deletedPurchases.count} compras eliminadas`);

    console.log("🏷️ Eliminando productos...");
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`   ✅ ${deletedProducts.count} productos eliminados`);

    // Mostrar resumen de lo que queda
    console.log("\n📊 Resumen de datos mantenidos:");

    const suppliersCount = await prisma.supplier.count();
    console.log(`   👥 Proveedores: ${suppliersCount}`);

    const usersCount = await prisma.user.count();
    console.log(`   🔐 Usuarios: ${usersCount}`);

    const rolesCount = await prisma.role.count();
    console.log(`   🎭 Roles: ${rolesCount}`);

    const customersCount = await prisma.customer.count();
    console.log(`   🤝 Clientes: ${customersCount}`);

    const categoriesCount = await prisma.category.count();
    console.log(`   📂 Categorías: ${categoriesCount}`);

    const permissionsCount = await prisma.permission.count();
    console.log(`   🔑 Permisos: ${permissionsCount}`);

    console.log("\n✨ Limpieza completada exitosamente");
    console.log(
      "📝 Base de datos lista para agregar nuevos productos y compras"
    );
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para confirmar la operación
async function confirmAndClean() {
  console.log(
    "⚠️  ADVERTENCIA: Esta operación eliminará TODOS los productos y compras"
  );
  console.log(
    "📋 Se mantendrán: proveedores, usuarios, roles, clientes y categorías"
  );
  console.log("");

  // En un entorno de producción, aquí se podría agregar confirmación interactiva
  // Por ahora, ejecutamos directamente

  await cleanDatabase();
}

if (require.main === module) {
  confirmAndClean()
    .then(() => {
      console.log("🎉 Proceso completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase };
