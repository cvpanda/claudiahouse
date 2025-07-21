"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
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
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
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
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !filterCategory || product.category.id === filterCategory;

    return matchesSearch && matchesCategory;
  });

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

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
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
                  {products.length}
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
                  {products.filter((p) => p.stock <= p.minStock).length}
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
                  {formatPrice(
                    products.reduce((sum, p) => sum + p.cost * p.stock, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products - Mobile Cards / Desktop Table */}
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          {/* Mobile View - Cards */}
          <div className="block md:hidden">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">
                {filteredProducts.length} productos encontrados
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
        </div>
      </div>
    </Layout>
  );
}
