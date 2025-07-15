#!/usr/bin/env node

/**
 * Script de inicialización para producción
 * Este script se ejecuta después del deploy para inicializar la base de datos
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function initializeProduction() {
  console.log("🚀 Inicializando base de datos en producción...");

  try {
    // Verificar si ya hay datos
    const existingUsers = await prisma.user.findMany();
    if (existingUsers.length > 0) {
      console.log("✅ Base de datos ya inicializada");
      return;
    }

    console.log("📋 Creando permisos...");

    // Crear permisos básicos
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

      // Configuración
      { module: "settings", action: "view", description: "Ver configuración" },
      { module: "users", action: "view", description: "Ver usuarios" },
      { module: "users", action: "create", description: "Crear usuarios" },
      { module: "users", action: "edit", description: "Editar usuarios" },
      { module: "users", action: "delete", description: "Eliminar usuarios" },
      { module: "roles", action: "view", description: "Ver roles" },
      { module: "roles", action: "create", description: "Crear roles" },
      { module: "roles", action: "edit", description: "Editar roles" },
      { module: "roles", action: "delete", description: "Eliminar roles" },
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { module_action: { module: perm.module, action: perm.action } },
        update: {},
        create: perm,
      });
    }

    console.log("👤 Creando roles...");

    // Crear roles
    const adminRole = await prisma.role.upsert({
      where: { name: "administrador" },
      update: {},
      create: {
        name: "administrador",
        description: "Acceso completo al sistema",
        isSystem: true,
      },
    });

    const salesRole = await prisma.role.upsert({
      where: { name: "vendedor" },
      update: {},
      create: {
        name: "vendedor",
        description: "Acceso a ventas y clientes",
        isSystem: true,
      },
    });

    const warehouseRole = await prisma.role.upsert({
      where: { name: "almacenero" },
      update: {},
      create: {
        name: "almacenero",
        description: "Acceso a productos y compras",
        isSystem: true,
      },
    });

    console.log("🔗 Asignando permisos a roles...");

    // Asignar todos los permisos al administrador
    const allPermissions = await prisma.permission.findMany();
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

    // Permisos para vendedor
    const salesPermissions = [
      "dashboard-view",
      "sales-view",
      "sales-create",
      "sales-edit",
      "sales-delete",
      "customers-view",
      "customers-create",
      "customers-edit",
      "customers-delete",
      "products-view",
      "categories-view",
    ];

    for (const permStr of salesPermissions) {
      const [module, action] = permStr.split("-");
      const permission = await prisma.permission.findFirst({
        where: { module, action },
      });
      if (permission) {
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
    }

    // Permisos para almacenero
    const warehousePermissions = [
      "dashboard-view",
      "products-view",
      "products-create",
      "products-edit",
      "products-delete",
      "purchases-view",
      "purchases-create",
      "purchases-edit",
      "purchases-delete",
      "suppliers-view",
      "suppliers-create",
      "suppliers-edit",
      "suppliers-delete",
      "categories-view",
      "categories-create",
      "categories-edit",
      "categories-delete",
    ];

    for (const permStr of warehousePermissions) {
      const [module, action] = permStr.split("-");
      const permission = await prisma.permission.findFirst({
        where: { module, action },
      });
      if (permission) {
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
    }

    console.log("👥 Creando usuario administrador...");

    // Crear usuario administrador
    const adminPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.upsert({
      where: { email: "admin@claudiahouse.com" },
      update: {},
      create: {
        email: "admin@claudiahouse.com",
        password: adminPassword,
        firstName: "Administrador",
        lastName: "Sistema",
        roleId: adminRole.id,
        isActive: true,
      },
    });

    console.log("✅ Base de datos inicializada correctamente");
    console.log("🔑 Usuario administrador:");
    console.log("   Email: admin@claudiahouse.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  initializeProduction()
    .then(() => {
      console.log("🎉 Inicialización completada");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error en inicialización:", error);
      process.exit(1);
    });
}

module.exports = { initializeProduction };
