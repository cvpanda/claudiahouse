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
  const router = useRouter();
  const pathname = usePathname();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login"];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Verificar autenticación en cada cambio de ruta
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  const checkAuth = async () => {
    try {
      // Verificar si hay datos en localStorage
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
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
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      router.push("/login");
    }
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
    isAuthenticated: !!user,
  };

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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return { user, loading };
}
