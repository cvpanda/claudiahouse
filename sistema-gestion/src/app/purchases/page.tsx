"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: {
    id: string;
    name: string;
    country: string;
  };
  type: string;
  currency?: string;
  total: number;
  status: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      sku?: string;
    };
  }>;
}

interface PurchaseStats {
  totalPurchases: number;
  totalAmount: number;
  pendingPurchases: number;
  completedThisMonth: number;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ORDERED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  CUSTOMS: "bg-orange-100 text-orange-800",
  RECEIVED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  ORDERED: "Ordenada",
  SHIPPED: "Enviada",
  CUSTOMS: "En Aduana",
  RECEIVED: "Recibida",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const { hasPermission } = useAuth();

  // Verificar permisos
  const canView = hasPermission("purchases", "view");
  const canCreate = hasPermission("purchases", "create");
  const canUpdate = hasPermission("purchases", "update");
  const canDelete = hasPermission("purchases", "delete");

  if (!canView) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para ver las compras.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const [stats, setStats] = useState<PurchaseStats>({
    totalPurchases: 0,
    totalAmount: 0,
    pendingPurchases: 0,
    completedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);

      const response = await fetch(`/api/purchases?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPurchases(data.purchases);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error al cargar compras:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        // Calcular estadísticas de compras
        setStats({
          totalPurchases: purchases.length,
          totalAmount: purchases.reduce((sum, p) => sum + p.total, 0),
          pendingPurchases: purchases.filter((p) => p.status === "PENDING")
            .length,
          completedThisMonth: purchases.filter(
            (p) =>
              p.status === "COMPLETED" &&
              new Date(p.receivedDate || p.orderDate).getMonth() ===
                new Date().getMonth()
          ).length,
        });
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const completePurchase = async (purchaseId: string) => {
    if (
      !confirm(
        "¿Está seguro de completar esta compra? Esto actualizará el stock y los costos de los productos."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        fetchPurchases();
        alert("Compra completada exitosamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al completar la compra");
      }
    } catch (error) {
      console.error("Error al completar compra:", error);
      alert("Error al completar la compra");
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (!confirm("¿Está seguro de eliminar esta compra?")) {
      return;
    }

    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPurchases();
        alert("Compra eliminada exitosamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al eliminar la compra");
      }
    } catch (error) {
      console.error("Error al eliminar compra:", error);
      alert("Error al eliminar la compra");
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    if (purchases.length > 0) {
      fetchStats();
    }
  }, [purchases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  if (loading && purchases.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
              <p className="text-gray-600 mt-2">
                Gestión de compras y importaciones
              </p>
            </div>
            <Link
              href="/purchases/new"
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                canCreate
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
              onClick={(e) => !canCreate && e.preventDefault()}
            >
              <Plus className="h-5 w-5" />
              Nueva Compra
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Compras
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPurchases}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monto Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pendientes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingPurchases}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completadas este mes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedThisMonth}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar por número, proveedor o notas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="ORDERED">Ordenada</option>
                <option value="SHIPPED">Enviada</option>
                <option value="CUSTOMS">En Aduana</option>
                <option value="RECEIVED">Recibida</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="LOCAL">Local/Mayorista</option>
                <option value="IMPORT">Importación</option>
              </select>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.purchaseNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchase.items.length} producto
                            {purchase.items.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.supplier.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.supplier.country}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            purchase.type === "IMPORT"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {purchase.type === "IMPORT" ? "Importación" : "Local"}
                        </span>
                        {purchase.currency && purchase.currency !== "ARS" && (
                          <div className="text-xs text-gray-500 mt-1">
                            {purchase.currency}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(purchase.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[purchase.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusLabels[purchase.status] || purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(purchase.orderDate)}</div>
                        {purchase.expectedDate && (
                          <div className="text-xs text-gray-500">
                            Esperada: {formatDate(purchase.expectedDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/purchases/${purchase.id}`}
                            className={`${
                              canView
                                ? "text-blue-600 hover:text-blue-900"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            title="Ver detalles"
                            onClick={(e) => !canView && e.preventDefault()}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {canUpdate &&
                            (purchase.status === "RECEIVED" ||
                              purchase.status === "PENDING") && (
                              <button
                                onClick={() => completePurchase(purchase.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Completar compra"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}

                          {canDelete &&
                            ["PENDING", "CANCELLED"].includes(
                              purchase.status
                            ) && (
                              <button
                                onClick={() => deletePurchase(purchase.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">
                        {(page - 1) * pagination.limit + 1}
                      </span>{" "}
                      a{" "}
                      <span className="font-medium">
                        {Math.min(page * pagination.limit, pagination.total)}
                      </span>{" "}
                      de <span className="font-medium">{pagination.total}</span>{" "}
                      resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(
                          (pageNum) =>
                            pageNum === 1 ||
                            pageNum === pagination.pages ||
                            Math.abs(pageNum - page) <= 2
                        )
                        .map((pageNum, idx, arr) => (
                          <React.Fragment key={pageNum}>
                            {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pageNum
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        ))}
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {purchases.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay compras
              </h3>
              <p className="text-gray-500 mb-6">
                {search || statusFilter || typeFilter
                  ? "No se encontraron compras que coincidan con los filtros aplicados."
                  : "Comience creando su primera compra."}
              </p>
              <Link
                href="/purchases/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nueva Compra
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PurchasesPage;
