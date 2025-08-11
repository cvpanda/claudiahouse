"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  Upload,
  Download,
} from "lucide-react";
import Layout from "@/components/Layout";
import ImagePreview from "@/components/ImagePreview";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  cost: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  supplier: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50); // Puedes ajustar el tamaño de página aquí
  const [globalStats, setGlobalStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalStockValue: 0,
  });

  // Estados para exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const { hasPermission } = useAuth();

  // Verificar permisos
  const canView = hasPermission("products", "view");
  const canCreate = hasPermission("products", "create");
  const canUpdate = hasPermission("products", "update");
  const canDelete = hasPermission("products", "delete");

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
              No tienes permisos para ver los productos.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterCategory]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  // useEffect(() => {
  //   console.log("Suppliers state updated:", suppliers);
  // }, [suppliers]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(filterCategory ? { category: filterCategory } : {}),
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        // Usar el total de la paginación del backend
        setTotal(data.pagination?.total || 0);
        // Leer stats globales si existen
        if (data.stats) {
          setGlobalStats({
            totalProducts:
              data.stats.totalProducts ?? data.pagination?.total ?? 0,
            lowStock: data.stats.lowStock ?? 0,
            totalStockValue: data.stats.totalStockValue ?? 0,
          });
        } else {
          // fallback: usar total y calcular localmente (no ideal)
          setGlobalStats({
            totalProducts: data.pagination?.total ?? 0,
            lowStock: (data.data || []).filter(
              (p: Product) => p.stock <= p.minStock
            ).length,
            totalStockValue: (data.data || []).reduce(
              (sum: number, p: Product) => sum + p.cost * p.stock,
              0
            ),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      // console.log("Fetching suppliers...");
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        // console.log("Suppliers response:", data);
        // console.log("Setting suppliers:", data.data || []);
        setSuppliers(data.data || []);
      } else {
        console.error("Failed to fetch suppliers, status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleExport = async (
    categoryId?: string,
    supplierId?: string,
    format: "excel" | "csv" = "excel"
  ) => {
    setExportLoading(true);

    try {
      const params = new URLSearchParams({
        format,
        ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
        ...(supplierId && supplierId !== "all" ? { supplierId } : {}),
      });

      const response = await fetch(`/api/products/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Error al exportar productos");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error desconocido");
      }

      // Generar archivo Excel o CSV
      if (format === "excel") {
        await generateExcelFile(data);
      } else {
        generateCSVFile(data);
      }

      // Cerrar modal
      setShowExportModal(false);

      // Mensaje de éxito
      alert(
        `Exportación completada: ${data.summary.totalProducts} productos exportados`
      );
    } catch (error) {
      console.error("Error exporting products:", error);
      alert("Error al exportar productos. Por favor intenta nuevamente.");
    } finally {
      setExportLoading(false);
    }
  };

  const generateExcelFile = async (exportData: any) => {
    const XLSX = await import("xlsx");

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Hoja principal con datos
    const mainSheetData = [
      [
        "SKU",
        "Nombre",
        "Descripcion",
        "Stock",
        "Stock Minimo",
        "Costo",
        "Precio Mayorista",
        "Precio Minorista",
        "Categoria",
        "Proveedor",
        "Unidad",
        "URL Imagen",
        "Codigo de Barras",
      ],
      ...exportData.data.map((product: any) => [
        product.SKU,
        product.Nombre,
        product.Descripcion,
        product.Stock,
        product["Stock Minimo"],
        product.Costo,
        product["Precio Mayorista"],
        product["Precio Minorista"],
        product.Categoria,
        product.Proveedor,
        product.Unidad,
        product["URL Imagen"],
        product["Codigo de Barras"],
      ]),
    ];

    const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, "Productos");

    // Hojas de referencia
    const categoriesSheet = XLSX.utils.aoa_to_sheet([
      ["Categorias"],
      ...exportData.referenceData.categories.map((cat: string) => [cat]),
    ]);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categorias");

    const suppliersSheet = XLSX.utils.aoa_to_sheet([
      ["Proveedores"],
      ...exportData.referenceData.suppliers.map((sup: string) => [sup]),
    ]);
    XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Proveedores");

    const unitsSheet = XLSX.utils.aoa_to_sheet([
      ["Unidades"],
      ...exportData.referenceData.units.map((unit: string) => [unit]),
    ]);
    XLSX.utils.book_append_sheet(workbook, unitsSheet, "Unidades");

    // Generar y descargar archivo
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `productos_exportados_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVFile = (exportData: any) => {
    const headers = [
      "SKU",
      "Nombre",
      "Descripcion",
      "Stock",
      "Stock Minimo",
      "Costo",
      "Precio Mayorista",
      "Precio Minorista",
      "Categoria",
      "Proveedor",
      "Unidad",
      "URL Imagen",
      "Codigo de Barras",
    ];

    const csvContent = [
      headers.join(","),
      ...exportData.data.map((product: any) =>
        [
          product.SKU,
          product.Nombre,
          product.Descripcion,
          product.Stock,
          product["Stock Minimo"],
          product.Costo,
          product["Precio Mayorista"],
          product["Precio Minorista"],
          product.Categoria,
          product.Proveedor,
          product.Unidad,
          product["URL Imagen"],
          product["Codigo de Barras"],
        ]
          .map((cell) => `"${cell || ""}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `productos_exportados_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id));
        alert("Producto eliminado correctamente");
      } else {
        alert("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar el producto");
    }
  };

  // La búsqueda y filtrado ahora se hace en el backend, así que usamos products directamente
  const filteredProducts = products;

  // Handler para submit de búsqueda
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchTerm(pendingSearch);
    setPage(1);
  };

  // Handler para cambio de categoría
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
    setPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
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

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Handlers para paginación
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageClick = (p: number) => setPage(p);

  // Componente de paginación reutilizable
  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex justify-center items-center gap-2 py-4 border-t bg-gray-50">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className={`px-3 py-1 rounded border text-sm font-medium ${
            page === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-50"
          }`}
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => handlePageClick(p)}
            className={`px-3 py-1 rounded border text-sm font-medium ${
              p === page
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
            disabled={p === page}
          >
            {p}
          </button>
        ))}
        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded border text-sm font-medium ${
            page === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-50"
          }`}
        >
          Siguiente
        </button>
      </div>
    ) : null;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Productos
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona tu inventario de productos
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!canView}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                canView
                  ? "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            <Link
              href="/products/import"
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                canCreate || canUpdate
                  ? "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => !(canCreate || canUpdate) && e.preventDefault()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Link>
            <Link
              href="/products/new"
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                canCreate
                  ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => !canCreate && e.preventDefault()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <form
            className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
            onSubmit={handleSearchSubmit}
            autoComplete="off"
          >
            <div className="relative flex">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-full text-gray-400 hover:text-blue-600"
                tabIndex={-1}
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <select
              value={filterCategory}
              onChange={handleCategoryChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Productos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {globalStats.totalProducts}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Stock Bajo
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {globalStats.lowStock}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Valor Total Stock
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatPrice(globalStats.totalStockValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products - Mobile Cards / Desktop Table */}
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          {/* Pagination arriba */}
          <Pagination />
          {/* Mobile View - Cards */}
          <div className="block md:hidden">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">
                {total} productos encontrados
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.imageUrl ? (
                        <ImagePreview
                          url={product.imageUrl}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover border"
                          showInstructions={false}
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            SKU: {product.sku || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.supplier.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.category.name}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="ml-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>

                      {/* Stock and Prices */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Stock</p>
                          <p
                            className={`text-sm font-medium ${
                              product.stock <= product.minStock
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {product.stock} {product.unit}
                            {product.stock <= product.minStock && (
                              <span className="ml-1 text-red-500">⚠</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Precio Minorista
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(product.retailPrice)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center space-x-2">
                        <Link
                          href={`/products/${product.id}`}
                          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium ${
                            canUpdate
                              ? "text-gray-700 bg-white hover:bg-gray-50"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={(e) => !canUpdate && e.preventDefault()}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={!canDelete}
                          className={`px-3 py-2 border border-gray-300 rounded-md text-xs font-medium ${
                            canDelete
                              ? "text-red-700 bg-white hover:bg-red-50 border-red-300"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precios
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
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.imageUrl && (
                          <div className="flex-shrink-0 h-12 w-12 mr-4">
                            <ImagePreview
                              url={product.imageUrl}
                              alt={product.name}
                              className="h-12 w-12 rounded-md object-cover border"
                              showInstructions={false}
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.supplier.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stock} {product.unit}
                      </div>
                      {product.stock <= product.minStock && (
                        <div className="flex items-center text-xs text-orange-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Stock bajo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Costo: {formatPrice(product.cost)}</div>
                      <div>
                        Mayorista: {formatPrice(product.wholesalePrice)}
                      </div>
                      <div>Minorista: {formatPrice(product.retailPrice)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/products/${product.id}`}
                          className={`${
                            canUpdate
                              ? "text-blue-600 hover:text-blue-900"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={(e) => !canUpdate && e.preventDefault()}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {canDelete && (
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay productos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando un nuevo producto.
              </p>
              <div className="mt-6">
                <Link
                  href="/products/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Link>
              </div>
            </div>
          )}

          {/* Pagination abajo */}
          <Pagination />
        </div>
      </div>

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Exportar Productos
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Cerrar</span>✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Categoría
                  </label>
                  <select
                    id="exportCategoryFilter"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="all"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Proveedor
                  </label>
                  <select
                    id="exportSupplierFilter"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="all"
                  >
                    <option value="all">Todos los proveedores</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Exportación
                  </label>
                  <select
                    id="exportFormat"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="excel"
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={exportLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const categorySelect = document.getElementById(
                      "exportCategoryFilter"
                    ) as HTMLSelectElement;
                    const supplierSelect = document.getElementById(
                      "exportSupplierFilter"
                    ) as HTMLSelectElement;
                    const formatSelect = document.getElementById(
                      "exportFormat"
                    ) as HTMLSelectElement;

                    handleExport(
                      categorySelect.value,
                      supplierSelect.value,
                      formatSelect.value as "excel" | "csv"
                    );
                  }}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 flex items-center"
                >
                  {exportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
