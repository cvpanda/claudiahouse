import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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

    // Obtener todos los permisos
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    // Agrupar permisos por módulo
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({
      permissions,
      groupedPermissions,
    });
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
