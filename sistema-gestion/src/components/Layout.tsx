"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Store,
  Tag,
  Building2,
  Truck,
  LogOut,
  User,
} from "lucide-react";
import { useAuth, usePermission } from "@/contexts/AuthContext";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    module: "dashboard",
    action: "view",
  },
  {
    name: "Productos",
    href: "/products",
    icon: Package,
    module: "products",
    action: "view",
  },
  {
    name: "Ventas",
    href: "/sales",
    icon: ShoppingCart,
    module: "sales",
    action: "view",
  },
  {
    name: "Compras",
    href: "/purchases",
    icon: Truck,
    module: "purchases",
    action: "view",
  },
  {
    name: "Clientes",
    href: "/customers",
    icon: Users,
    module: "customers",
    action: "view",
  },
  {
    name: "Categorías",
    href: "/categories",
    icon: Tag,
    module: "categories",
    action: "view",
  },
  {
    name: "Proveedores",
    href: "/suppliers",
    icon: Building2,
    module: "suppliers",
    action: "view",
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3,
    module: "reports",
    action: "view",
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
    module: "settings",
    action: "view",
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  // Filtrar navegación basada en permisos
  const filteredNavigation = navigation.filter((item) => {
    // Si no hay usuario o está cargando, no mostrar navegación
    if (!user || loading) return false;

    // Si es administrador, mostrar todo
    if (user.role.name === "administrador") return true;

    // Verificar permisos específicos
    return user.role.permissions.some(
      (p) => p.module === item.module && p.action === item.action && p.granted
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // El AuthProvider redirigirá a /login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Claudia House
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info mobile */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role.name.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Logout button mobile */}
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <Store className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Claudia House
            </span>
          </div>

          {/* User info desktop */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role.name.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout button desktop */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            type="button"
            className="px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-between px-4 lg:px-6">
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString("es-AR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
