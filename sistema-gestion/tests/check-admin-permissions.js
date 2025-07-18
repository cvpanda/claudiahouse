/**
 * Script para verificar y corregir permisos del usuario administrador
 * Asegura que el usuario administrador tenga todos los permisos necesarios
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAndFixAdminPermissions() {
  console.log("🔍 Verificando permisos del usuario administrador...\n");

  try {
    // 1. Buscar el rol de administrador
    const adminRole = await prisma.role.findFirst({
      where: {
        OR: [
          { name: { contains: "admin", mode: "insensitive" } },
          { name: { contains: "Administrador", mode: "insensitive" } },
          { name: { contains: "Administrator", mode: "insensitive" } },
        ],
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: true,
      },
    });

    if (!adminRole) {
      console.log("❌ No se encontró rol de administrador");
      console.log("📝 Listando todos los roles disponibles:");

      const allRoles = await prisma.role.findMany({
        include: {
          users: true,
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      allRoles.forEach((role) => {
        console.log(
          `   - ${role.name} (ID: ${role.id}) - ${role.users.length} usuarios`
        );
        console.log(`     Permisos: ${role.permissions.length}`);
      });

      return;
    }

    console.log(
      `✅ Rol de administrador encontrado: ${adminRole.name} (ID: ${adminRole.id})`
    );
    console.log(`   Usuarios con este rol: ${adminRole.users.length}`);
    console.log(`   Permisos asignados: ${adminRole.permissions.length}\n`);

    // 2. Listar permisos actuales del administrador
    console.log("📋 Permisos actuales del administrador:");
    const currentPermissions = adminRole.permissions.map((rp) => ({
      module: rp.permission.module,
      action: rp.permission.action,
      granted: rp.granted,
    }));

    currentPermissions.forEach((p) => {
      const status = p.granted ? "✅" : "❌";
      console.log(`   ${status} ${p.module}.${p.action}`);
    });

    // 3. Verificar específicamente el permiso products.update
    const productsUpdatePermission = currentPermissions.find(
      (p) => p.module === "products" && p.action === "update"
    );

    if (!productsUpdatePermission) {
      console.log("\n❌ PROBLEMA ENCONTRADO: Falta el permiso products.update");
    } else if (!productsUpdatePermission.granted) {
      console.log(
        "\n❌ PROBLEMA ENCONTRADO: El permiso products.update existe pero está deshabilitado"
      );
    } else {
      console.log(
        "\n✅ El permiso products.update está correctamente asignado y habilitado"
      );
    }

    // 4. Lista de permisos que debería tener un administrador
    const requiredPermissions = [
      { module: "products", action: "view" },
      { module: "products", action: "create" },
      { module: "products", action: "update" },
      { module: "products", action: "delete" },
      { module: "sales", action: "view" },
      { module: "sales", action: "create" },
      { module: "sales", action: "update" },
      { module: "sales", action: "delete" },
      { module: "purchases", action: "view" },
      { module: "purchases", action: "create" },
      { module: "purchases", action: "update" },
      { module: "purchases", action: "delete" },
      { module: "customers", action: "view" },
      { module: "customers", action: "create" },
      { module: "customers", action: "update" },
      { module: "customers", action: "delete" },
      { module: "reports", action: "view" },
      { module: "reports", action: "export" },
      { module: "settings", action: "view" },
      { module: "settings", action: "update" },
    ];

    console.log("\n🔧 Verificando permisos requeridos...");
    const missingPermissions = [];

    for (const required of requiredPermissions) {
      const existing = currentPermissions.find(
        (p) => p.module === required.module && p.action === required.action
      );

      if (!existing) {
        missingPermissions.push(required);
        console.log(`   ❌ Falta: ${required.module}.${required.action}`);
      } else if (!existing.granted) {
        console.log(
          `   ⚠️ Deshabilitado: ${required.module}.${required.action}`
        );
      } else {
        console.log(`   ✅ OK: ${required.module}.${required.action}`);
      }
    }

    // 5. Corregir permisos faltantes
    if (missingPermissions.length > 0) {
      console.log(
        `\n🔨 Corrigiendo ${missingPermissions.length} permisos faltantes...`
      );

      for (const missing of missingPermissions) {
        // Buscar o crear el permiso
        let permission = await prisma.permission.findUnique({
          where: {
            module_action: {
              module: missing.module,
              action: missing.action,
            },
          },
        });

        if (!permission) {
          console.log(
            `   📝 Creando permiso: ${missing.module}.${missing.action}`
          );
          permission = await prisma.permission.create({
            data: {
              module: missing.module,
              action: missing.action,
              description: `${missing.action} access to ${missing.module}`,
            },
          });
        }

        // Asignar permiso al rol de administrador
        const existingRolePermission = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
        });

        if (!existingRolePermission) {
          console.log(
            `   ➕ Asignando permiso: ${missing.module}.${missing.action}`
          );
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
              granted: true,
            },
          });
        } else {
          console.log(
            `   🔄 Habilitando permiso: ${missing.module}.${missing.action}`
          );
          await prisma.rolePermission.update({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            },
            data: {
              granted: true,
            },
          });
        }
      }

      console.log("✅ Permisos corregidos exitosamente");
    }

    // 6. Verificar usuarios administradores
    console.log("\n👤 Usuarios con rol de administrador:");
    adminRole.users.forEach((user) => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // 7. Verificación final
    console.log("\n🔍 Verificación final de permisos...");
    const finalRole = await prisma.role.findUnique({
      where: { id: adminRole.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const finalPermissions = finalRole.permissions.map((rp) => ({
      module: rp.permission.module,
      action: rp.permission.action,
      granted: rp.granted,
    }));

    const productsUpdateFinal = finalPermissions.find(
      (p) => p.module === "products" && p.action === "update"
    );

    if (productsUpdateFinal && productsUpdateFinal.granted) {
      console.log("✅ CONFIRMADO: El permiso products.update está activo");
      console.log("✅ Los botones de editar deberían funcionar ahora");
    } else {
      console.log(
        "❌ PROBLEMA PERSISTENTE: El permiso products.update sigue sin estar disponible"
      );
    }

    console.log("\n📊 Resumen final:");
    console.log(`   Total de permisos: ${finalPermissions.length}`);
    console.log(
      `   Permisos activos: ${finalPermissions.filter((p) => p.granted).length}`
    );
    console.log(
      `   Permisos inactivos: ${
        finalPermissions.filter((p) => !p.granted).length
      }`
    );
  } catch (error) {
    console.error("❌ Error verificando permisos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
if (require.main === module) {
  checkAndFixAdminPermissions()
    .then(() => {
      console.log("\n✅ Verificación de permisos completada");
      console.log("💡 Si los problemas persisten, intenta:");
      console.log("   1. Cerrar sesión y volver a iniciar sesión");
      console.log("   2. Limpiar localStorage del navegador");
      console.log("   3. Verificar la consola del navegador para errores");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error en la verificación:", error);
      process.exit(1);
    });
}

module.exports = { checkAndFixAdminPermissions };
