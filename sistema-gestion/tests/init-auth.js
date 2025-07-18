const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Inicializando sistema de autenticación...");

  try {
    // 1. Crear permisos básicos
    console.log("📋 Creando permisos...");

    const permissions = [
      // Dashboard
      {
        module: "dashboard",
        action: "view",
        description: "Ver dashboard principal",
      },

      // Productos
      { module: "products", action: "view", description: "Ver productos" },
      { module: "products", action: "create", description: "Crear productos" },
      { module: "products", action: "edit", description: "Editar productos" },
      {
        module: "products",
        action: "delete",
        description: "Eliminar productos",
      },

      // Ventas
      { module: "sales", action: "view", description: "Ver ventas" },
      { module: "sales", action: "create", description: "Crear ventas" },
      { module: "sales", action: "edit", description: "Editar ventas" },
      { module: "sales", action: "delete", description: "Eliminar ventas" },

      // Compras
      { module: "purchases", action: "view", description: "Ver compras" },
      { module: "purchases", action: "create", description: "Crear compras" },
      { module: "purchases", action: "edit", description: "Editar compras" },
      {
        module: "purchases",
        action: "delete",
        description: "Eliminar compras",
      },

      // Clientes
      { module: "customers", action: "view", description: "Ver clientes" },
      { module: "customers", action: "create", description: "Crear clientes" },
      { module: "customers", action: "edit", description: "Editar clientes" },
      {
        module: "customers",
        action: "delete",
        description: "Eliminar clientes",
      },

      // Proveedores
      { module: "suppliers", action: "view", description: "Ver proveedores" },
      {
        module: "suppliers",
        action: "create",
        description: "Crear proveedores",
      },
      {
        module: "suppliers",
        action: "edit",
        description: "Editar proveedores",
      },
      {
        module: "suppliers",
        action: "delete",
        description: "Eliminar proveedores",
      },

      // Categorías
      { module: "categories", action: "view", description: "Ver categorías" },
      {
        module: "categories",
        action: "create",
        description: "Crear categorías",
      },
      {
        module: "categories",
        action: "edit",
        description: "Editar categorías",
      },
      {
        module: "categories",
        action: "delete",
        description: "Eliminar categorías",
      },

      // Reportes
      { module: "reports", action: "view", description: "Ver reportes" },
      { module: "reports", action: "export", description: "Exportar reportes" },

      // Configuración
      { module: "settings", action: "view", description: "Ver configuración" },
      {
        module: "settings",
        action: "edit",
        description: "Editar configuración",
      },
      {
        module: "users",
        action: "manage",
        description: "Gestionar usuarios y roles",
      },
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: {
          module_action: {
            module: permission.module,
            action: permission.action,
          },
        },
        update: {},
        create: permission,
      });
    }

    console.log(`✅ ${permissions.length} permisos creados/actualizados`);

    // 2. Crear roles básicos
    console.log("👥 Creando roles...");

    // Rol Administrador - Acceso total
    const adminRole = await prisma.role.upsert({
      where: { name: "administrador" },
      update: {},
      create: {
        name: "administrador",
        description: "Acceso completo al sistema",
        isSystem: true,
      },
    });

    // Rol Gerente - Acceso a todo excepto gestión de usuarios
    const managerRole = await prisma.role.upsert({
      where: { name: "gerente" },
      update: {},
      create: {
        name: "gerente",
        description: "Gestión operativa completa",
        isSystem: true,
      },
    });

    // Rol Vendedor - Solo ventas, clientes y productos (lectura)
    const salesRole = await prisma.role.upsert({
      where: { name: "vendedor" },
      update: {},
      create: {
        name: "vendedor",
        description: "Gestión de ventas y clientes",
        isSystem: true,
      },
    });

    // Rol Almacenero - Solo productos, compras y proveedores
    const warehouseRole = await prisma.role.upsert({
      where: { name: "almacenero" },
      update: {},
      create: {
        name: "almacenero",
        description: "Gestión de inventario y compras",
        isSystem: true,
      },
    });

    // Rol Solo Lectura - Ver todo, modificar nada
    const viewerRole = await prisma.role.upsert({
      where: { name: "solo_lectura" },
      update: {},
      create: {
        name: "solo_lectura",
        description: "Solo visualización de datos",
        isSystem: true,
      },
    });

    console.log("✅ 5 roles creados/actualizados");

    // 3. Asignar permisos a roles
    console.log("🔗 Asignando permisos a roles...");

    // Obtener todos los permisos
    const allPermissions = await prisma.permission.findMany();

    // ADMINISTRADOR - Todos los permisos
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
          granted: true,
        },
      });
    }

    // GERENTE - Todos excepto gestión de usuarios
    const managerPermissions = allPermissions.filter(
      (p) => !(p.module === "users" && p.action === "manage")
    );
    for (const permission of managerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
          granted: true,
        },
      });
    }

    // VENDEDOR - Dashboard, ventas, clientes, productos (solo lectura)
    const salesPermissions = allPermissions.filter(
      (p) =>
        p.module === "dashboard" ||
        p.module === "sales" ||
        p.module === "customers" ||
        (p.module === "products" && p.action === "view")
    );
    for (const permission of salesPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: salesRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: salesRole.id,
          permissionId: permission.id,
          granted: true,
        },
      });
    }

    // ALMACENERO - Dashboard, productos, compras, proveedores, categorías
    const warehousePermissions = allPermissions.filter(
      (p) =>
        p.module === "dashboard" ||
        p.module === "products" ||
        p.module === "purchases" ||
        p.module === "suppliers" ||
        p.module === "categories"
    );
    for (const permission of warehousePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: warehouseRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: warehouseRole.id,
          permissionId: permission.id,
          granted: true,
        },
      });
    }

    // SOLO LECTURA - Solo permisos de visualización
    const viewPermissions = allPermissions.filter((p) => p.action === "view");
    for (const permission of viewPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: viewerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: viewerRole.id,
          permissionId: permission.id,
          granted: true,
        },
      });
    }

    console.log("✅ Permisos asignados a roles");

    // 4. Crear usuario administrador por defecto
    console.log("👤 Creando usuario administrador...");

    const adminPassword = await bcrypt.hash("skato77", 12);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@claudiahouse.com" },
      update: { password: adminPassword }, // Actualizar contraseña si ya existe
      create: {
        email: "admin@claudiahouse.com",
        password: adminPassword,
        firstName: "Administrador",
        lastName: "Sistema",
        roleId: adminRole.id,
        isActive: true,
      },
    });

    console.log("✅ Usuario administrador creado/actualizado");
    console.log("📧 Email: admin@claudiahouse.com");
    console.log("🔐 Contraseña: skato77");

    // 5. Crear algunos usuarios de ejemplo
    console.log("👥 Creando usuarios de ejemplo...");

    // Vendedor
    const salesPassword = await bcrypt.hash("vendedor123", 12);
    await prisma.user.upsert({
      where: { email: "vendedor@claudiahouse.com" },
      update: {},
      create: {
        email: "vendedor@claudiahouse.com",
        password: salesPassword,
        firstName: "Juan",
        lastName: "Vendedor",
        phone: "+54 9 11 1234-5678",
        roleId: salesRole.id,
        isActive: true,
      },
    });

    // Almacenero
    const warehousePassword = await bcrypt.hash("almacen123", 12);
    await prisma.user.upsert({
      where: { email: "almacen@claudiahouse.com" },
      update: {},
      create: {
        email: "almacen@claudiahouse.com",
        password: warehousePassword,
        firstName: "María",
        lastName: "Almacenera",
        phone: "+54 9 11 8765-4321",
        roleId: warehouseRole.id,
        isActive: true,
      },
    });

    console.log("✅ Usuarios de ejemplo creados");

    console.log("\n🎉 ¡Sistema de autenticación inicializado correctamente!");
    console.log("\n📋 Usuarios disponibles:");
    console.log("  👑 Administrador: admin@claudiahouse.com / skato77");
    console.log("  💼 Vendedor: vendedor@claudiahouse.com / vendedor123");
    console.log("  📦 Almacenero: almacen@claudiahouse.com / almacen123");
  } catch (error) {
    console.error("❌ Error inicializando sistema:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
