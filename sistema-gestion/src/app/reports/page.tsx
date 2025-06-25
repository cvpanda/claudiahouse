"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  PieChart,
} from "lucide-react";
import Layout from "@/components/Layout";
import ExportMenu from "@/components/ExportMenu";
import { useReportExport } from "@/hooks/useReportExport";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface ReportData {
  salesByDay: Array<{ day: string; sales: number; revenue: number }>;
  salesByCategory: Array<{ name: string; value: number; color: string }>;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
  lowStockProducts: Array<{ name: string; stock: number; minStock: number }>;
  salesByMonth: Array<{ month: string; sales: number; revenue: number }>;
  customerStats: {
    totalCustomers: number;
    wholesaleCustomers: number;
    retailCustomers: number;
  };
  advancedMetrics: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    roi: number;
    averageTicket: number;
    revenueGrowth: number;
    salesGrowth: number;
  };
  productAnalysis: Array<{
    name: string;
    sold: number;
    revenue: number;
    profitMargin: number;
    contribution: number;
  }>;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);

  const { exportToPDF, exportToExcel, exportToCSV } = useReportExport();

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleExportPDF = async () => {
    if (!reportData) return;
    try {
      setExporting(true);
      await exportToPDF(reportData, selectedPeriod);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error al exportar PDF: " + (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    try {
      setExporting(true);
      await exportToExcel(reportData, selectedPeriod);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error al exportar Excel: " + (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!reportData) return;
    try {
      setExporting(true);
      await exportToCSV(reportData, selectedPeriod);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error al exportar CSV: " + (error as Error).message);
    } finally {
      setExporting(false);
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
  const tabs = [
    { id: "overview", name: "Resumen General", icon: BarChart3 },
    { id: "analytics", name: "Métricas Avanzadas", icon: TrendingUp },
    { id: "sales", name: "Análisis de Ventas", icon: ShoppingCart },
    { id: "products", name: "Productos", icon: Package },
    { id: "customers", name: "Clientes", icon: Users },
  ];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                Reportes y Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Analiza el rendimiento de tu negocio con datos detallados
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="7days">Últimos 7 días</option>
                <option value="30days">Últimos 30 días</option>
                <option value="90days">Últimos 90 días</option>
                <option value="1year">Último año</option>
              </select>{" "}
              <ExportMenu
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                disabled={exporting}
              />
              {exporting && (
                <div className="ml-2 inline-flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Exportando...
                </div>
              )}
            </div>
          </div>
        </div>{" "}
        {/* Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="border-b border-gray-200">
            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop tabs */}
            <nav className="hidden sm:flex -mb-px space-x-4 lg:space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 min-w-0 flex-shrink-0`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden lg:inline">{tab.name}</span>
                    <span className="lg:hidden">{tab.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>{" "}
        {/* Content based on active tab */}
        {activeTab === "overview" && <OverviewTab reportData={reportData} />}
        {activeTab === "analytics" && <AnalyticsTab reportData={reportData} />}
        {activeTab === "sales" && <SalesTab reportData={reportData} />}
        {activeTab === "products" && <ProductsTab reportData={reportData} />}
        {activeTab === "customers" && <CustomersTab reportData={reportData} />}
      </div>
    </Layout>
  );
}

// Overview Tab Component
function OverviewTab({ reportData }: { reportData: ReportData | null }) {
  if (!reportData) return <div>No hay datos disponibles</div>;

  return (
    <div className="space-y-8">
      {" "}
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                Ingresos
              </p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900 truncate">
                $
                {reportData.salesByDay
                  .reduce((sum, day) => sum + day.revenue, 0)
                  .toLocaleString("es-ES", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                Ventas
              </p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">
                {reportData.salesByDay.reduce((sum, day) => sum + day.sales, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                Clientes
              </p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">
                {reportData.customerStats.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
            </div>
            <div className="ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                Stock Bajo
              </p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">
                {reportData.lowStockProducts.length}
              </p>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {" "}
        {/* Sales by Day */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Ventas por Día
          </h3>
          <div id="sales-chart" className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} tick={{ fontSize: 12 }} />
                <YAxis fontSize={12} />
                <Tooltip
                  labelStyle={{ fontSize: "12px" }}
                  contentStyle={{ fontSize: "12px" }}
                />
                <Bar dataKey="sales" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Sales by Category */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          {" "}
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Ventas por Categoría
          </h3>
          <div id="category-chart" className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={reportData.salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    window.innerWidth > 768
                      ? `${name} ${(percent * 100).toFixed(0)}%`
                      : `${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={window.innerWidth > 768 ? 80 : 60}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={12}
                >
                  {reportData.salesByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: "12px" }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Tab Component - Métricas Avanzadas
function AnalyticsTab({ reportData }: { reportData: ReportData | null }) {
  if (!reportData || !reportData.advancedMetrics)
    return <div>No hay datos disponibles</div>;

  const { advancedMetrics } = reportData;

  return (
    <div className="space-y-8">
      {/* Métricas Financieras */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Métricas Financieras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${advancedMetrics.grossProfit.toLocaleString("es-ES")}
            </div>
            <div className="text-sm text-gray-600 mt-1">Ganancia Bruta</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {advancedMetrics.profitMargin.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Margen de Ganancia</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {advancedMetrics.roi.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">ROI</div>
          </div>
        </div>
      </div>

      {/* Métricas de Crecimiento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Tendencias de Crecimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">
                Crecimiento en Ingresos
              </div>
              <div className="text-xl font-bold text-gray-900">
                {advancedMetrics.revenueGrowth.toFixed(1)}%
              </div>
            </div>
            <div
              className={`text-2xl ${
                advancedMetrics.revenueGrowth >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {advancedMetrics.revenueGrowth >= 0 ? "↗️" : "↘️"}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Crecimiento en Ventas</div>
              <div className="text-xl font-bold text-gray-900">
                {advancedMetrics.salesGrowth.toFixed(1)}%
              </div>
            </div>
            <div
              className={`text-2xl ${
                advancedMetrics.salesGrowth >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {advancedMetrics.salesGrowth >= 0 ? "↗️" : "↘️"}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Promedio */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Análisis de Ticket
        </h3>
        <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg">
          <div className="text-3xl font-bold text-indigo-600">
            ${advancedMetrics.averageTicket.toLocaleString("es-ES")}
          </div>
          <div className="text-sm text-gray-600 mt-2">Ticket Promedio</div>
          <div className="text-xs text-gray-500 mt-1">
            Valor promedio por venta realizada
          </div>
        </div>
      </div>

      {/* Análisis de Productos por Rentabilidad */}
      {reportData.productAnalysis && reportData.productAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Análisis de Productos por Rentabilidad
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contribución
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.productAnalysis
                  .slice(0, 10)
                  .map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.revenue.toLocaleString("es-ES")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.profitMargin >= 40
                              ? "bg-green-100 text-green-800"
                              : product.profitMargin >= 30
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.contribution.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Sales Tab Component
function SalesTab({ reportData }: { reportData: ReportData | null }) {
  if (!reportData) return <div>No hay datos disponibles</div>;

  return (
    <div className="space-y-8">
      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tendencia de Ingresos
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={reportData.salesByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3B82F6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Productos Más Vendidos
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Vendida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.topProducts.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ reportData }: { reportData: ReportData | null }) {
  if (!reportData) return <div>No hay datos disponibles</div>;

  return (
    <div className="space-y-8">
      {/* Low Stock Alert */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Productos con Stock Bajo
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.lowStockProducts.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.minStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Stock Bajo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ reportData }: { reportData: ReportData | null }) {
  if (!reportData) return <div>No hay datos disponibles</div>;

  return (
    <div className="space-y-8">
      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Clientes
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.customerStats.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Mayoristas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.customerStats.wholesaleCustomers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Minoristas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.customerStats.retailCustomers}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
