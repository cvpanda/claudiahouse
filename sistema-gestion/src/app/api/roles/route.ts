import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización
    const { user, authorized } = await authorizeRequest(
      request,
      "users",
      "manage"
    );

    if (!authorized) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    // Obtener roles con sus permisos
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error obteniendo roles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización
    const { user, authorized } = await authorizeRequest(
      request,
      "users",
      "manage"
    );

    if (!authorized) {
      return NextResponse.json(
        { error: "No tienes permisos para crear roles" },
        { status: 403 }
      );
    }

    const { name, description, permissions } = await request.json();

    // Validar campos requeridos
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del rol es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Ya existe un rol con este nombre" },
        { status: 400 }
      );
    }

    // Crear rol
    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: false,
      },
    });

    // Si se proporcionaron permisos, crearlos
    if (permissions && Array.isArray(permissions)) {
      const rolePermissions = permissions.map((permissionId) => ({
        roleId: newRole.id,
        permissionId,
        granted: true,
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions,
      });
    }

    // Obtener el rol creado con sus permisos
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: newRole.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json(roleWithPermissions, { status: 201 });
  } catch (error) {
    console.error("Error creando rol:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
