"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import Layout from "./Layout";
import StatsCard from "./StatsCard";
import { DashboardStats } from "@/types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    monthSales: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Productos"
            value={stats.totalProducts}
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="Stock Bajo"
            value={stats.lowStockProducts}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Clientes"
            value={stats.totalCustomers}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Ventas Hoy"
            value={stats.todaySales}
            icon={ShoppingCart}
            color="purple"
          />
          <StatsCard
            title="Ventas del Mes"
            value={stats.monthSales}
            icon={TrendingUp}
            color="indigo"
          />
          <StatsCard
            title="Ingresos Totales"
            value={stats.totalRevenue}
            icon={DollarSign}
            color="emerald"
            isCurrency
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Productos con Stock Bajo
            </h3>
            <LowStockAlert />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ventas Recientes
            </h3>
            <RecentSales />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch("/api/products?lowStock=true&limit=5");
      if (response.ok) {
        const data = await response.json();
        setLowStockProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching low stock products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-200 rounded"></div>;
  }

  if (lowStockProducts.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        ¡Excelente! No hay productos con stock bajo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {lowStockProducts.map((product: any) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-600">Stock: {product.stock}</p>
          </div>
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            Crítico
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentSales() {
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSales();
  }, []);

  const fetchRecentSales = async () => {
    try {
      const response = await fetch(
        "/api/sales?limit=5&orderBy=createdAt&order=desc"
      );
      if (response.ok) {
        const data = await response.json();
        setRecentSales(data.sales || []);
      }
    } catch (error) {
      console.error("Error fetching recent sales:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-200 rounded"></div>;
  }

  if (recentSales.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No hay ventas recientes.</p>
    );
  }

  return (
    <div className="space-y-3">
      {recentSales.map((sale: any) => (
        <div
          key={sale.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900">#{sale.saleNumber}</p>
            <p className="text-sm text-gray-600">
              {sale.customer?.name || "Cliente sin registrar"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">
              ${sale.total.toLocaleString("es-AR")}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(sale.createdAt).toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
