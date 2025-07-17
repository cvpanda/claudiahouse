"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions: {
      module: string;
      action: string;
      granted: boolean;
    }[];
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login"];

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized]);

  useEffect(() => {
    // Verificar autenticación en cada cambio de ruta
    if (
      isInitialized &&
      !loading &&
      !user &&
      !publicRoutes.includes(pathname)
    ) {
      router.push("/login");
    }
  }, [user, loading, pathname, isInitialized]);

  const checkAuth = async () => {
    try {
      // Verificar si hay datos en localStorage
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem("user");
        }
      }

      // Verificar con el servidor
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
          if (!publicRoutes.includes(pathname)) {
            router.push("/login");
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
        if (!publicRoutes.includes(pathname)) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
      localStorage.removeItem("user");
      if (!publicRoutes.includes(pathname)) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error en logout:", error);
    }

    // Limpiar estado local inmediatamente
    setUser(null);
    localStorage.removeItem("user");

    // Redirigir después de limpiar el estado
    setLoading(false);
    router.push("/login");
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user || !user.role.permissions) {
      return false;
    }

    const permission = user.role.permissions.find(
      (p) => p.module === module && p.action === action
    );

    return permission ? permission.granted : false;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!user && isInitialized,
  };

  // No renderizar children hasta que esté inicializado
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook para verificar permisos específicos
export function usePermission(module: string, action: string) {
  const { hasPermission } = useAuth();
  return hasPermission(module, action);
}

// Hook para proteger componentes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  return { user, loading };
}
