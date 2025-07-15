"use client";

import { useState, useEffect } from "react";
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

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || sale.status === filterStatus;
    const matchesPayment =
      !filterPayment || sale.paymentMethod === filterPayment;

    // Filtros de fecha
    let matchesDate = true;
    if (dateFilter.from || dateFilter.to) {
      const saleDate = new Date(sale.createdAt);
      if (dateFilter.from) {
        const fromDate = new Date(dateFilter.from);
        matchesDate = matchesDate && saleDate >= fromDate;
      }
      if (dateFilter.to) {
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999); // Incluir todo el día
        matchesDate = matchesDate && saleDate <= toDate;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo";
      case "card":
        return "Tarjeta";
      case "transfer":
        return "Transferencia";
      default:
        return method;
    }
  };

  // Calculate stats
  const completedSales = sales.filter((s) => s.status === "completed");
  const totalRevenue = completedSales.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  const todaySales = sales.filter((sale) => {
    const today = new Date().toDateString();
    const saleDate = new Date(sale.createdAt).toDateString();
    return saleDate === today && sale.status === "completed";
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  const filteredStats = {
    total: filteredSales.length,
    completed: filteredSales.filter((s) => s.status === "completed").length,
    revenue: filteredSales
      .filter((s) => s.status === "completed")
      .reduce((sum, sale) => sum + sale.total, 0),
  };

  const exportToCSV = () => {
    const headers = [
      "Número de Venta",
      "Fecha",
      "Cliente",
      "Tipo Cliente",
      "Productos",
      "Subtotal",
      "Impuestos",
      "Descuento",
      "Total",
      "Método de Pago",
      "Estado",
    ];

    const csvData = filteredSales.map((sale) => [
      sale.saleNumber,
      formatDate(sale.createdAt),
      sale.customer?.name || "Cliente sin registrar",
      sale.customer?.customerType === "retail" ? "Minorista" : "Mayorista",
      sale.saleItems.length,
      sale.subtotal,
      sale.tax,
      sale.discount,
      sale.total,
      getPaymentMethodLabel(sale.paymentMethod),
      getStatusLabel(sale.status),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ventas_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterPayment("");
    setDateFilter({ from: "", to: "" });
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona las ventas de tu negocio
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar ({filteredStats.total})
            </button>
            <Link
              href="/sales/new"
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
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
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, from: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, to: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="completed">Completada</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los métodos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          {/* Filtros activos */}
          {(searchTerm ||
            filterStatus ||
            filterPayment ||
            dateFilter.from ||
            dateFilter.to) && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">
                Filtros activos:
              </span>
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Buscar: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Estado: {getStatusLabel(filterStatus)}
                  <button
                    onClick={() => setFilterStatus("")}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterPayment && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Pago: {getPaymentMethodLabel(filterPayment)}
                  <button
                    onClick={() => setFilterPayment("")}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(dateFilter.from || dateFilter.to) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Fecha: {dateFilter.from || "..."} - {dateFilter.to || "..."}
                  <button
                    onClick={() => setDateFilter({ from: "", to: "" })}
                    className="ml-1 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Ventas Filtradas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredStats.completed}/{filteredStats.total}
                </p>
                <p className="text-xs text-gray-500">completadas/total</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todaySales.length}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(todayRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Ingresos{" "}
                  {filteredStats.total !== sales.length
                    ? "Filtrados"
                    : "Totales"}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(filteredStats.revenue)}
                </p>
                {filteredStats.total !== sales.length && (
                  <p className="text-xs text-gray-500">
                    Total: {formatPrice(totalRevenue)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Promedio por Venta
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {completedSales.length > 0
                    ? formatPrice(totalRevenue / completedSales.length)
                    : formatPrice(0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
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
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
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
                  <>
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sale.saleNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(sale.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.customer?.name || "Cliente sin registrar"}
                            </div>
                            {sale.customer && (
                              <div className="text-sm text-gray-500">
                                {sale.customer.customerType === "retail"
                                  ? "Minorista"
                                  : "Mayorista"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div className="text-sm text-gray-900">
                            {sale.saleItems.length}{" "}
                            {sale.saleItems.length === 1
                              ? "producto"
                              : "productos"}
                          </div>
                          <button
                            onClick={() => toggleSaleExpansion(sale.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedSales.has(sale.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
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

                    {/* Fila expandible con detalles de productos */}
                    {expandedSales.has(sale.id) && (
                      <tr key={`${sale.id}-details`}>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Productos de la venta:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {sale.saleItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded-md border flex justify-between items-center"
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.product.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {item.quantity} {item.product.unit} ×{" "}
                                      {formatPrice(item.unitPrice)}
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatPrice(item.totalPrice)}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Resumen de la venta */}
                            <div className="bg-white p-3 rounded-md border border-blue-200">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">
                                    Subtotal:
                                  </span>
                                  <span className="ml-1 font-medium">
                                    {formatPrice(sale.subtotal)}
                                  </span>
                                </div>
                                {sale.tax > 0 && (
                                  <div>
                                    <span className="text-gray-600">
                                      Impuestos:
                                    </span>
                                    <span className="ml-1 font-medium">
                                      {formatPrice(sale.tax)}
                                    </span>
                                  </div>
                                )}
                                {sale.discount > 0 && (
                                  <div>
                                    <span className="text-gray-600">
                                      Descuento:
                                    </span>
                                    <span className="ml-1 font-medium text-red-600">
                                      -{formatPrice(sale.discount)}
                                    </span>
                                  </div>
                                )}
                                <div className="md:text-right">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="ml-1 font-bold text-blue-600">
                                    {formatPrice(sale.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && !loading && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {sales.length === 0
                  ? "No hay ventas"
                  : "No se encontraron ventas"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {sales.length === 0
                  ? "Comienza realizando tu primera venta."
                  : "Intenta cambiar los filtros para encontrar más resultados."}
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                {sales.length === 0 ? (
                  <Link
                    href="/sales/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Venta
                  </Link>
                ) : (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
