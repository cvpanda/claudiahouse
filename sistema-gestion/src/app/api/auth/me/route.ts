import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Retornar información del usuario sin contraseña
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions.map((rp) => ({
            module: rp.permission.module,
            action: rp.permission.action,
            granted: rp.granted,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    return NextResponse.json(
      { authenticated: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
