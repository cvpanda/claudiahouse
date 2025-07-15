import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions: {
      permission: {
        module: string;
        action: string;
      };
      granted: boolean;
    }[];
  };
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verificar contraseña
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generar JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

// Verificar JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Obtener usuario desde la request
export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const token =
      request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

// Verificar si el usuario tiene un permiso específico
export function hasPermission(
  user: AuthUser,
  module: string,
  action: string
): boolean {
  if (!user.role.permissions) {
    return false;
  }

  const permission = user.role.permissions.find(
    (rp) => rp.permission.module === module && rp.permission.action === action
  );

  return permission ? permission.granted : false;
}

// Middleware de autenticación
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  return getUserFromRequest(request);
}

// Middleware de autorización
export async function authorizeRequest(
  request: NextRequest,
  module: string,
  action: string
): Promise<{ user: AuthUser | null; authorized: boolean }> {
  const user = await authenticateRequest(request);

  if (!user) {
    return { user: null, authorized: false };
  }

  const authorized = hasPermission(user, module, action);
  return { user, authorized };
}

// Roles predefinidos del sistema
export const SYSTEM_ROLES = {
  ADMIN: "administrador",
  MANAGER: "gerente",
  SALES: "vendedor",
  WAREHOUSE: "almacenero",
  VIEWER: "solo_lectura",
} as const;

// Permisos predefinidos
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: { module: "dashboard", action: "view" },

  // Productos
  PRODUCTS_VIEW: { module: "products", action: "view" },
  PRODUCTS_CREATE: { module: "products", action: "create" },
  PRODUCTS_EDIT: { module: "products", action: "edit" },
  PRODUCTS_DELETE: { module: "products", action: "delete" },

  // Ventas
  SALES_VIEW: { module: "sales", action: "view" },
  SALES_CREATE: { module: "sales", action: "create" },
  SALES_EDIT: { module: "sales", action: "edit" },
  SALES_DELETE: { module: "sales", action: "delete" },

  // Compras
  PURCHASES_VIEW: { module: "purchases", action: "view" },
  PURCHASES_CREATE: { module: "purchases", action: "create" },
  PURCHASES_EDIT: { module: "purchases", action: "edit" },
  PURCHASES_DELETE: { module: "purchases", action: "delete" },

  // Clientes
  CUSTOMERS_VIEW: { module: "customers", action: "view" },
  CUSTOMERS_CREATE: { module: "customers", action: "create" },
  CUSTOMERS_EDIT: { module: "customers", action: "edit" },
  CUSTOMERS_DELETE: { module: "customers", action: "delete" },

  // Proveedores
  SUPPLIERS_VIEW: { module: "suppliers", action: "view" },
  SUPPLIERS_CREATE: { module: "suppliers", action: "create" },
  SUPPLIERS_EDIT: { module: "suppliers", action: "edit" },
  SUPPLIERS_DELETE: { module: "suppliers", action: "delete" },

  // Categorías
  CATEGORIES_VIEW: { module: "categories", action: "view" },
  CATEGORIES_CREATE: { module: "categories", action: "create" },
  CATEGORIES_EDIT: { module: "categories", action: "edit" },
  CATEGORIES_DELETE: { module: "categories", action: "delete" },

  // Reportes
  REPORTS_VIEW: { module: "reports", action: "view" },
  REPORTS_EXPORT: { module: "reports", action: "export" },

  // Configuración
  SETTINGS_VIEW: { module: "settings", action: "view" },
  SETTINGS_EDIT: { module: "settings", action: "edit" },
  USERS_MANAGE: { module: "users", action: "manage" },
} as const;
