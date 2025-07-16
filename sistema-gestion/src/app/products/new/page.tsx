"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Layout from "@/components/Layout";
import ImagePreview from "@/components/ImagePreview";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    imageUrl: "",
    supplierId: "",
    categoryId: "",
  });
  const [wholesaleMargin, setWholesaleMargin] = useState(0);
  const [retailMargin, setRetailMargin] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const cost = parseFloat(formData.cost) || 0;
    const wholesale = parseFloat(formData.wholesalePrice) || 0;
    const retail = parseFloat(formData.retailPrice) || 0;
    setWholesaleMargin(
      cost > 0 && wholesale > 0
        ? Math.round((1 - cost / wholesale) * 100 * 100) / 100
        : 0
    );
    setRetailMargin(
      cost > 0 && retail > 0
        ? Math.round((1 - cost / retail) * 100 * 100) / 100
        : 0
    );
  }, [formData.cost, formData.wholesalePrice, formData.retailPrice]);

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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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

      console.log("Sending product data:", productData);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      if (response.ok) {
        alert("Producto creado correctamente");
        router.push("/products");
      } else {
        const error = await response.json();
        console.error("Error details:", error);
        if (error.details) {
          const errorMessages = error.details
            .map((d: any) => `${d.path.join(".")}: ${d.message}`)
            .join("\n");
          alert(`Error de validación:\n${errorMessages}`);
        } else {
          alert(`Error: ${error.error || "Error al crear el producto"}`);
        }
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="mt-1 text-sm text-gray-600">
            Completa la información del nuevo producto
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

              <div className="md:col-span-2">
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  URL de Imagen
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Puedes usar URLs de Google Drive, Dropbox o cualquier servicio
                  de imágenes. Las URLs de Google Drive se convertirán
                  automáticamente.
                </p>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <ImagePreview
                      url={formData.imageUrl}
                      alt="Vista previa del producto"
                      className="h-32 w-32 object-cover rounded-md border"
                      showInstructions={true}
                    />
                  </div>
                )}
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
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Precios</h2>

            <div className="space-y-6">
              {/* Costo - Primera línea */}
              <div className="max-w-xs">
                <label
                  htmlFor="cost"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Costo *
                </label>
                <div className="relative">
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
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Precios de Venta - Segunda línea */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Precio Mayorista */}
                <div>
                  <label
                    htmlFor="wholesalePrice"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Precio Mayorista *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
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
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-28 flex-shrink-0">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={wholesaleMargin}
                            readOnly
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-center cursor-not-allowed"
                            placeholder="0"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Margen: {wholesaleMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Precio Minorista */}
                <div>
                  <label
                    htmlFor="retailPrice"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Precio Minorista *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
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
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-28 flex-shrink-0">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={retailMargin}
                            readOnly
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-center cursor-not-allowed"
                            placeholder="0"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Margen: {retailMargin.toFixed(1)}%
                    </p>
                  </div>
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
                  Stock Inicial *
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
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
