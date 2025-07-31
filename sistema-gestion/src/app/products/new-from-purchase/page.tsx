"use client";

import React, { useState, useEffect, Suspense } from "react";
import ProductImageUploader from "@/components/ProductImageUploader";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Edit2, Check, X } from "lucide-react";
import Link from "next/link";

interface Supplier {
  id: string;
  name: string;
  country: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
}

const NewProductFromPurchaseComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    minStock: 1,
    unit: "unidad",
    supplierId: "",
    categoryId: "",
    imageUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSkuEditable, setIsSkuEditable] = useState(false);
  const [originalSku, setOriginalSku] = useState("");

  // Fetch suppliers and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersResponse, categoriesResponse] = await Promise.all([
          fetch("/api/suppliers"),
          fetch("/api/categories"),
        ]);

        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          setSuppliers(
            suppliersData.data || suppliersData.suppliers || suppliersData || []
          );
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(
            categoriesData.data ||
              categoriesData.categories ||
              categoriesData ||
              []
          );
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
  }, []);

  // Función para generar el próximo SKU automáticamente
  const generateNextSku = async (categoryId: string) => {
    if (!categoryId) return;

    try {
      const response = await fetch(
        `/api/products/next-sku?categoryId=${categoryId}`
      );
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          sku: data.nextSku,
        }));
        setOriginalSku(data.nextSku);
      }
    } catch (error) {
      console.error("Error generating SKU:", error);
    }
  };

  // Funciones para manejar la edición del SKU
  const handleEditSku = () => {
    setOriginalSku(formData.sku);
    setIsSkuEditable(true);
  };

  const handleSaveSku = () => {
    setIsSkuEditable(false);
    setOriginalSku(formData.sku);
  };

  const handleCancelSkuEdit = () => {
    setFormData((prev) => ({
      ...prev,
      sku: originalSku,
    }));
    setIsSkuEditable(false);
  };

  // useEffect para generar SKU automáticamente cuando cambie la categoría
  useEffect(() => {
    if (formData.categoryId) {
      generateNextSku(formData.categoryId);
    }
  }, [formData.categoryId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.supplierId) {
      newErrors.supplierId = "El proveedor es requerido";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "La categoría es requerida";
    }

    if (formData.minStock < 0) {
      newErrors.minStock = "El stock mínimo debe ser mayor o igual a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cost: 0, // Se definirá en la compra
          wholesalePrice: 0, // Se definirá opcionalmente después
          retailPrice: 0, // Se definirá opcionalmente después
          stock: 0, // Los productos nuevos desde compras inician con stock 0
        }),
      });

      if (response.ok) {
        const product = await response.json();

        // Redirigir de vuelta a la compra con el nuevo producto
        if (returnTo) {
          router.push(`${returnTo}?newProduct=${product.id}`);
        } else {
          router.push("/purchases/new");
        }
      } else {
        const error = await response.json();
        alert(error.error || "Error al crear el producto");
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      alert("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Manejar cambio de imagen
  const handleImageChange = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageUrl }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={returnTo || "/purchases/new"}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Nuevo Producto
              </h1>
              <p className="text-gray-600">
                Crear producto para agregar a la compra
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Información del Producto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Nombre del producto"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción del producto"
                />
              </div>

              {/* Integración de carga de imagen */}
              <div className="md:col-span-2">
                <ProductImageUploader
                  currentImageUrl={formData.imageUrl}
                  onImageChange={handleImageChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                  <span className="text-xs text-gray-500 ml-2">
                    {isSkuEditable
                      ? "(Editando SKU)"
                      : "(Se genera automáticamente al seleccionar categoría)"}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.sku}
                    readOnly={!isSkuEditable}
                    onChange={
                      isSkuEditable
                        ? (e) => handleChange("sku", e.target.value)
                        : undefined
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20 ${
                      isSkuEditable
                        ? "bg-white"
                        : "bg-gray-50 cursor-not-allowed"
                    }`}
                    placeholder="Selecciona una categoría para generar el SKU"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                    {!isSkuEditable ? (
                      <button
                        type="button"
                        onClick={handleEditSku}
                        disabled={!formData.sku}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Editar SKU"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveSku}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Guardar cambios"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelSkuEdit}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Cancelar edición"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isSkuEditable && (
                  <p className="mt-1 text-xs text-blue-600">
                    💡 Puedes modificar el SKU según tus necesidades. Asegúrate
                    de que sea único.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="unit">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="g">Gramo</option>
                  <option value="l">Litro</option>
                  <option value="ml">Mililitro</option>
                  <option value="m">Metro</option>
                  <option value="cm">Centímetro</option>
                  <option value="pack">Paquete</option>
                  <option value="box">Caja</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor *
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleChange("supplierId", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.supplierId ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.country})
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.supplierId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleChange("categoryId", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Inventario
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Los costos y precios se definirán cuando
                agregues este producto a una compra. Solo necesitas completar la
                información básica del producto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) =>
                    handleChange("minStock", parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.minStock ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="1"
                />
                {errors.minStock && (
                  <p className="mt-1 text-sm text-red-600">{errors.minStock}</p>
                )}
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center text-sm text-gray-500">
                  <p>El stock inicial será 0</p>
                  <p>Se actualizará al completar la compra</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <Link
              href={returnTo || "/purchases/new"}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Creando..." : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NewProductFromPurchasePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProductFromPurchaseComponent />
    </Suspense>
  );
};

export default NewProductFromPurchasePage;
