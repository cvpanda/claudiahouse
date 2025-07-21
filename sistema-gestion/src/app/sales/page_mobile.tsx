"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  DollarSign,
  Calendar,
  User,
  Package,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
} from "lucide-react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    customerType: string;
  };
  saleItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
      unit: string;
    };
  }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const { hasPermission } = useAuth();

  // Verificar permisos
  const canView = hasPermission("sales", "view");
  const canCreate = hasPermission("sales", "create");
  const canUpdate = hasPermission("sales", "update");
  const canDelete = hasPermission("sales", "delete");

  if (!canView) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para ver las ventas.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    from: "",
    to: "",
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales");
      if (response.ok) {
        const data = await response.json();
        setSales(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.saleItems.some((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = !filterStatus || sale.status === filterStatus;
    const matchesPayment =
      !filterPayment || sale.paymentMethod === filterPayment;

    const saleDate = new Date(sale.createdAt);
    const matchesDateFrom =
      !dateFilter.from || saleDate >= new Date(dateFilter.from);
    const matchesDateTo = !dateFilter.to || saleDate <= new Date(dateFilter.to);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendiente",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
      check: "Cheque",
    };
    return labels[method] || method;
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterPayment("");
    setDateFilter({ from: "", to: "" });
  };

  const hasActiveFilters =
    searchTerm ||
    filterStatus ||
    filterPayment ||
    dateFilter.from ||
    dateFilter.to;

  // Calculate stats
  const todaySales = sales.filter(
    (sale) =>
      new Date(sale.createdAt).toDateString() === new Date().toDateString()
  );

  const filteredStats = {
    total: filteredSales.length,
    completed: filteredSales.filter((s) => s.status === "completed").length,
    totalRevenue: filteredSales
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.total, 0),
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Ventas
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona las ventas de tu negocio
            </p>
          </div>
          <Link
            href="/sales/new"
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              canCreate
                ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={(e) => !canCreate && e.preventDefault()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Ventas Filtradas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredStats.completed}/{filteredStats.total}
                </p>
                <p className="text-xs text-gray-500">completadas/total</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Hoy
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {todaySales.length}
                </p>
                <p className="text-xs text-gray-500">ventas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Ingresos Filtrados
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatPrice(filteredStats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Items Vendidos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredSales
                    .filter((s) => s.status === "completed")
                    .reduce(
                      (sum, s) =>
                        sum +
                        s.saleItems.reduce(
                          (itemSum, item) => itemSum + item.quantity,
                          0
                        ),
                      0
                    )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                >
                  <option value="">Todos los métodos</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="check">Cheque</option>
                </select>

                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, from: e.target.value })
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                  placeholder="Desde"
                />

                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, to: e.target.value })
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                  placeholder="Hasta"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sales - Mobile Cards / Desktop Table */}
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          {/* Mobile View - Cards */}
          <div className="block lg:hidden">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">
                {filteredSales.length} ventas encontradas
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          #{sale.saleNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            sale.status
                          )}`}
                        >
                          {getStatusLabel(sale.status)}
                        </span>
                      </div>

                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">
                          {formatDate(sale.createdAt)}
                        </p>
                        {sale.customer && (
                          <p className="text-xs text-gray-500">
                            <User className="inline w-3 h-3 mr-1" />
                            {sale.customer.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </p>
                      </div>

                      <div className="mt-2">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(sale.total)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sale.saleItems.length} productos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={() => toggleSaleExpansion(sale.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Ver productos"
                      >
                        {expandedSales.has(sale.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <Link
                        href={`/sales/${sale.id}`}
                        className={`p-2 ${
                          canView
                            ? "text-blue-600 hover:text-blue-900"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={(e) => !canView && e.preventDefault()}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Expanded Products */}
                  {expandedSales.has(sale.id) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        Productos:
                      </h4>
                      <div className="space-y-2">
                        {sale.saleItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.product.name}
                              </p>
                              <p className="text-gray-500">
                                {item.quantity} {item.product.unit} ×{" "}
                                {formatPrice(item.unitPrice)}
                              </p>
                            </div>
                            <p className="font-medium text-gray-900">
                              {formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{sale.saleNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.saleItems.length} productos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.customer ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.customer.name}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {sale.customer.customerType === "retail"
                                ? "Minorista"
                                : "Mayorista"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Sin cliente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(sale.total)}
                        </div>
                        {sale.discount > 0 && (
                          <div className="text-sm text-gray-500">
                            Desc: {formatPrice(sale.discount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            sale.status
                          )}`}
                        >
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleSaleExpansion(sale.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Ver detalles"
                          >
                            {expandedSales.has(sale.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            href={`/sales/${sale.id}`}
                            className={`${
                              canView
                                ? "text-blue-600 hover:text-blue-900"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            title="Ver detalles completos"
                            onClick={(e) => !canView && e.preventDefault()}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row with product details */}
                    {expandedSales.has(sale.id) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Productos:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {sale.saleItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center bg-white p-2 rounded"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {item.product.name}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      {item.quantity} {item.product.unit} ×{" "}
                                      {formatPrice(item.unitPrice)}
                                    </span>
                                  </div>
                                  <span className="font-medium">
                                    {formatPrice(item.totalPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay ventas
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando una nueva venta.
              </p>
              <div className="mt-6">
                <Link
                  href="/sales/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Venta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
