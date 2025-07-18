"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Package } from "lucide-react";
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
  imageUrl?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    imageUrl: "",
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
          cost: formatArgentineNumber(productData.cost.toString()),
          wholesalePrice: formatArgentineNumber(
            productData.wholesalePrice.toString()
          ),
          retailPrice: formatArgentineNumber(
            productData.retailPrice.toString()
          ),
          stock: productData.stock.toString(),
          minStock: productData.minStock.toString(),
          maxStock: productData.maxStock?.toString() || "",
          unit: productData.unit,
          imageUrl: productData.imageUrl || "",
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

  // Función para formatear números con separadores argentinos
  const formatArgentineNumber = (value: string): string => {
    // Remover todos los caracteres que no sean dígitos o punto decimal
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Asegurar que solo haya un punto decimal
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    // Si hay parte entera, formatearla con separadores de miles
    if (parts[0]) {
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
    }

    return cleanValue;
  };

  // Función para convertir formato argentino a número
  const parseArgentineNumber = (value: string): number => {
    if (!value) return 0;
    // Remover puntos de miles y reemplazar coma decimal por punto
    const cleanValue = value.replace(/\./g, "").replace(/,/g, ".");
    return parseFloat(cleanValue) || 0;
  };

  // Función helper para clases de input con manejo de errores
  const getInputClasses = (fieldName: string): string => {
    const baseClasses =
      "mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500";
    const hasError = fieldErrors[fieldName];

    if (hasError) {
      return `${baseClasses} border-red-300 focus:border-red-500 text-red-900 placeholder-red-300`;
    }

    return `${baseClasses} border-gray-300 focus:border-blue-500`;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Limpiar errores del campo cuando el usuario empieza a escribir
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (
      name === "cost" ||
      name === "wholesalePrice" ||
      name === "retailPrice"
    ) {
      // Para campos de precio, aplicar formato argentino
      const formattedValue = formatArgentineNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const productData = {
        ...formData,
        cost: parseArgentineNumber(formData.cost),
        wholesalePrice: parseArgentineNumber(formData.wholesalePrice),
        retailPrice: parseArgentineNumber(formData.retailPrice),
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 0,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      };

      // Validaciones adicionales
      if (productData.wholesalePrice < productData.cost) {
        setError("El precio mayorista no puede ser menor al costo");
        setSaving(false);
        return;
      }

      if (productData.retailPrice < productData.wholesalePrice) {
        setError("El precio minorista no puede ser menor al precio mayorista");
        setSaving(false);
        return;
      }

      if (productData.maxStock && productData.maxStock < productData.minStock) {
        setError("El stock máximo no puede ser menor al stock mínimo");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        router.push("/products");
      } else {
        const errorData = await response.json();

        // Manejar errores específicos
        if (response.status === 409) {
          // Error de duplicado
          if (errorData.field) {
            setFieldErrors({ [errorData.field]: errorData.error });
          } else {
            setError(errorData.error);
          }
        } else if (errorData.details) {
          // Errores de validación de Zod
          const errors: Record<string, string> = {};
          errorData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              errors[detail.path[0]] = detail.message;
            }
          });
          setFieldErrors(errors);
        } else {
          setError(errorData.error || "Error al actualizar el producto");
        }
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Error de conexión. Por favor, inténtelo de nuevo.");
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

        {/* Product Image Preview */}
        {product.imageUrl && (
          <div className="bg-white shadow-sm rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Imagen del Producto
            </h2>
            <div className="flex justify-center">
              <ImagePreview
                url={product.imageUrl}
                alt={product.name}
                className="max-w-md max-h-64 object-cover rounded-lg border shadow-sm"
                showInstructions={true}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  de imágenes
                </p>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <ImagePreview
                      url={formData.imageUrl}
                      alt="Vista previa"
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
                  className={getInputClasses("sku")}
                />
                {fieldErrors.sku && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.sku}</p>
                )}
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
                  className={getInputClasses("barcode")}
                />
                {fieldErrors.barcode && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.barcode}
                  </p>
                )}
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
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Importante:</strong> Los precios deben seguir la lógica:
                Costo ≤ Precio Mayorista ≤ Precio Minorista
              </p>
            </div>

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
                    type="text"
                    id="cost"
                    name="cost"
                    required
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="0"
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Costo base del producto
                </p>
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
                    type="text"
                    id="wholesalePrice"
                    name="wholesalePrice"
                    required
                    value={formData.wholesalePrice}
                    onChange={handleChange}
                    placeholder="0"
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Precio para venta al por mayor
                </p>
                {formData.cost &&
                  formData.wholesalePrice &&
                  parseArgentineNumber(formData.wholesalePrice) <
                    parseArgentineNumber(formData.cost) && (
                    <p className="mt-1 text-xs text-red-600">
                      ⚠️ Precio menor al costo
                    </p>
                  )}
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
                    type="text"
                    id="retailPrice"
                    name="retailPrice"
                    required
                    value={formData.retailPrice}
                    onChange={handleChange}
                    placeholder="0"
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Precio para venta al por menor
                </p>
                {formData.wholesalePrice &&
                  formData.retailPrice &&
                  parseArgentineNumber(formData.retailPrice) <
                    parseArgentineNumber(formData.wholesalePrice) && (
                    <p className="mt-1 text-xs text-red-600">
                      ⚠️ Precio menor al mayorista
                    </p>
                  )}
              </div>
            </div>

            {/* Resumen de márgenes */}
            {formData.cost &&
              formData.wholesalePrice &&
              formData.retailPrice && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Márgenes de Ganancia
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Margen Mayorista:</span>
                      <span className="ml-2 font-medium">
                        {parseArgentineNumber(formData.cost) > 0
                          ? `${(
                              ((parseArgentineNumber(formData.wholesalePrice) -
                                parseArgentineNumber(formData.cost)) /
                                parseArgentineNumber(formData.cost)) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Margen Minorista:</span>
                      <span className="ml-2 font-medium">
                        {parseArgentineNumber(formData.cost) > 0
                          ? `${(
                              ((parseArgentineNumber(formData.retailPrice) -
                                parseArgentineNumber(formData.cost)) /
                                parseArgentineNumber(formData.cost)) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
