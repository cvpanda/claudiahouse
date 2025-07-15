import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización
    const { user, authorized } = await authorizeRequest(
      request,
      "users",
      "view"
    );

    if (!authorized) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 401 }
      );
    }

    // Obtener usuarios con sus roles
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mapear usuarios sin contraseñas
    const safeUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
      },
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
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
        { error: "No tienes permisos para crear usuarios" },
        { status: 403 }
      );
    }

    const { email, password, firstName, lastName, phone, roleId } =
      await request.json();

    // Validar campos requeridos
    if (!email || !password || !firstName || !lastName || !roleId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    // Verificar que el rol exista
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: "El rol especificado no existe" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        roleId,
      },
      include: {
        role: true,
      },
    });

    // Retornar usuario sin contraseña
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
