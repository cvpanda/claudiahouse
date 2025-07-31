"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  Package,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: {
    row: number;
    action: "created" | "updated" | "error" | "skipped";
    product?: {
      sku: string;
      name: string;
    };
    errors?: string[];
  }[];
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function ImportProductsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Verificar permisos
  const canCreate = hasPermission("products", "create");
  const canUpdate = hasPermission("products", "update");

  if (!canCreate && !canUpdate) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para importar productos.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    fetchCategoriesAndSuppliers();
  }, []);

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [categoriesResponse, suppliersResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/suppliers"),
      ]);

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || []);
      }

      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert("Por favor selecciona un archivo CSV válido");
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    // Crear el contenido del template CSV
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
    ];

    // Crear filas de ejemplo
    const exampleRows = [
      [
        "", // SKU vacío para auto-generar
        "Producto Ejemplo 1",
        "Descripción opcional del producto",
        "100",
        "10",
        "50.00",
        "70.00",
        "100.00",
        categories[0]?.name || "Ejemplo Categoria",
        suppliers[0]?.name || "Ejemplo Proveedor",
        "unidad",
      ],
      [
        "PROD-001", // SKU existente para actualizar
        "Producto Existente",
        "",
        "50",
        "5",
        "",
        "80.00",
        "",
        categories[1]?.name || "Otra Categoria",
        suppliers[1]?.name || "Otro Proveedor",
        "kilogramo",
      ],
    ];

    // Crear contenido CSV
    const csvContent = [
      headers.join(","),
      ...exampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Crear archivo de descarga
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_productos.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!file) {
      alert("Por favor selecciona un archivo CSV");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // Si hay éxitos, mostrar mensaje
        if (result.successCount > 0) {
          const message = `Importación completada: ${result.successCount} productos procesados correctamente`;
          if (result.errorCount > 0) {
            alert(`${message}. ${result.errorCount} errores encontrados.`);
          } else {
            alert(message);
          }
        }
      } else {
        alert("Error en la importación. Revisa los detalles abajo.");
      }
    } catch (error) {
      console.error("Error importing products:", error);
      alert("Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "updated":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "skipped":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "created":
        return "Creado";
      case "updated":
        return "Actualizado";
      case "error":
        return "Error";
      case "skipped":
        return "Omitido";
      default:
        return "Desconocido";
    }
  };

  const getActionBgColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-50 border-green-200";
      case "updated":
        return "bg-blue-50 border-blue-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "skipped":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loadingData) {
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/products"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Importar Productos
              </h1>
            </div>
            <p className="text-gray-600">
              Importa productos de forma masiva desde un archivo CSV
            </p>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-8">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Instrucciones de Importación
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Campos obligatorios:</strong> Categoría, Proveedor, Unidad
                    </li>
                    <li>
                      <strong>Al menos uno de estos:</strong> Stock (≥0), Costo (≥0.01), 
                      Precio Mayorista (≥0.01), o Precio Minorista (≥0.01)
                    </li>
                    <li>
                      <strong>SKU vacío:</strong> Se auto-genera un nuevo producto
                    </li>
                    <li>
                      <strong>SKU existente:</strong> Se actualiza el producto (solo campos con valores)
                    </li>
                    <li>
                      <strong>Formato números:</strong> Usar punto decimal (ej: 123.45)
                    </li>
                    <li>
                      <strong>Valores 0 o 0.00:</strong> Se consideran vacíos (excepto Stock)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Descarga de plantilla */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Plantilla CSV
            </h2>
            <p className="text-gray-600 mb-4">
              Descarga la plantilla con la estructura correcta y ejemplos de datos.
            </p>
            <button
              onClick={downloadTemplate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar Plantilla CSV
            </button>
          </div>

          {/* Carga de archivo */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subir Archivo CSV
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Archivo seleccionado: {file.name}</span>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar Productos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultados de la importación */}
          {importResult && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resultados de la Importación
              </h2>

              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {importResult.totalRows}
                  </div>
                  <div className="text-sm text-gray-600">Total Filas</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.successCount}
                  </div>
                  <div className="text-sm text-green-600">Exitosos</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errorCount}
                  </div>
                  <div className="text-sm text-red-600">Errores</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.skippedCount}
                  </div>
                  <div className="text-sm text-yellow-600">Omitidos</div>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Detalles por Fila</h3>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {importResult.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 border-b border-gray-100 last:border-b-0 ${getActionBgColor(
                        result.action
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        {getActionIcon(result.action)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Fila {result.row}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                result.action === "created"
                                  ? "bg-green-100 text-green-800"
                                  : result.action === "updated"
                                  ? "bg-blue-100 text-blue-800"
                                  : result.action === "error"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {getActionText(result.action)}
                            </span>
                          </div>
                          {result.product && (
                            <div className="text-sm text-gray-600 mt-1">
                              {result.product.sku} - {result.product.name}
                            </div>
                          )}
                          {result.errors && result.errors.length > 0 && (
                            <div className="mt-2">
                              {result.errors.map((error, errorIndex) => (
                                <div
                                  key={errorIndex}
                                  className="text-sm text-red-600"
                                >
                                  • {error}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón para volver */}
              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/products"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Productos
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
