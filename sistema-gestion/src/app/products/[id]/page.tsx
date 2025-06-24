"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Package } from "lucide-react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  cost: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  isActive: boolean;
  supplierId: string;
  categoryId: string;
  supplier: Supplier;
  category: Category;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    cost: "",
    wholesalePrice: "",
    retailPrice: "",
    stock: "",
    minStock: "",
    maxStock: "",
    unit: "unidad",
    supplierId: "",
    categoryId: "",
    isActive: true,
  });

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchCategories();
      fetchSuppliers();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
        setFormData({
          name: productData.name,
          description: productData.description || "",
          sku: productData.sku || "",
          barcode: productData.barcode || "",
          cost: productData.cost.toString(),
          wholesalePrice: productData.wholesalePrice.toString(),
          retailPrice: productData.retailPrice.toString(),
          stock: productData.stock.toString(),
          minStock: productData.minStock.toString(),
          maxStock: productData.maxStock?.toString() || "",
          unit: productData.unit,
          supplierId: productData.supplierId,
          categoryId: productData.categoryId,
          isActive: productData.isActive,
        });
      } else {
        alert("Producto no encontrado");
        router.push("/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Error al cargar el producto");
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
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
        retailPrice: parseFloat(formData.retailPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 0,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      };

      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert("Producto actualizado correctamente");
        router.push("/products");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Error al actualizar el producto"}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error al actualizar el producto");
    } finally {
      setSaving(false);
    }
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

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Producto no encontrado
          </h3>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver a Productos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a Productos
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="mt-1 text-sm text-gray-600">
            Modifica la información del producto: {product.name}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Información Básica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="sku"
                  className="block text-sm font-medium text-gray-700"
                >
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="barcode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Código de Barras
                </label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Categoría *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="supplierId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Proveedor *
                </label>
                <select
                  id="supplierId"
                  name="supplierId"
                  required
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Producto activo
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Precios</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="cost"
                  className="block text-sm font-medium text-gray-700"
                >
                  Costo *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    required
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={handleChange}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="wholesalePrice"
                  className="block text-sm font-medium text-gray-700"
                >
                  Precio Mayorista *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="wholesalePrice"
                    name="wholesalePrice"
                    required
                    step="0.01"
                    min="0"
                    value={formData.wholesalePrice}
                    onChange={handleChange}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="retailPrice"
                  className="block text-sm font-medium text-gray-700"
                >
                  Precio Minorista *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="retailPrice"
                    name="retailPrice"
                    required
                    step="0.01"
                    min="0"
                    value={formData.retailPrice}
                    onChange={handleChange}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Inventario
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stock Actual *
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="minStock"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  id="minStock"
                  name="minStock"
                  required
                  min="0"
                  value={formData.minStock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="maxStock"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stock Máximo
                </label>
                <input
                  type="number"
                  id="maxStock"
                  name="maxStock"
                  min="0"
                  value={formData.maxStock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium text-gray-700"
                >
                  Unidad *
                </label>
                <select
                  id="unit"
                  name="unit"
                  required
                  value={formData.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="g">Gramo</option>
                  <option value="l">Litro</option>
                  <option value="ml">Mililitro</option>
                  <option value="m">Metro</option>
                  <option value="cm">Centímetro</option>
                  <option value="par">Par</option>
                  <option value="caja">Caja</option>
                  <option value="paquete">Paquete</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
