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
    if (
      selectedFile &&
      (selectedFile.type === "text/csv" ||
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel")
    ) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert("Por favor selecciona un archivo CSV o Excel válido");
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    // Usar xlsx para crear un archivo Excel con múltiples hojas y dropdowns
    import("xlsx")
      .then((XLSX) => {
        // Crear un nuevo workbook
        const workbook = XLSX.utils.book_new();

        // 1. Hoja principal con la plantilla
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

        // Crear filas de ejemplo con datos reales
        const exampleRows = [
          [
            "", // SKU vacío para auto-generar
            "Producto Nuevo Ejemplo",
            "Descripción del producto nuevo",
            "50",
            "5",
            "25.50",
            "35.75",
            "50.00",
            categories.length > 0 ? categories[0].name : "Categoria1",
            suppliers.length > 0 ? suppliers[0].name : "Proveedor1",
            "unidad",
            "https://ejemplo.com/imagen.jpg",
            "1234567890123",
          ],
          [
            "PROD-001", // SKU existente para actualizar
            "Producto Para Actualizar",
            "", // Descripción vacía - no se actualizará si el producto ya existe
            "100",
            "10",
            "", // Costo vacío - no se actualizará
            "80.00",
            "120.00",
            categories.length > 1
              ? categories[1].name
              : categories.length > 0
              ? categories[0].name
              : "Categoria2",
            suppliers.length > 1
              ? suppliers[1].name
              : suppliers.length > 0
              ? suppliers[0].name
              : "Proveedor2",
            "kilogramo",
            "",
            "",
          ],
          [
            "", // Ejemplo solo con stock
            "Producto Solo Stock",
            "Solo actualizar stock",
            "200",
            "20",
            "", // Sin precios - válido porque tiene stock
            "",
            "",
            categories.length > 0 ? categories[0].name : "Categoria1",
            suppliers.length > 0 ? suppliers[0].name : "Proveedor1",
            "litro",
            "",
            "",
          ],
        ];

        // Crear datos para la hoja principal
        const mainSheetData = [headers, ...exampleRows];
        const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);

        // Agregar la hoja principal
        XLSX.utils.book_append_sheet(workbook, mainSheet, "Productos");

        // 2. Hoja de referencia con categorías
        const categoriesData = [
          ["Categorias"],
          ...categories.map((cat) => [cat.name]),
        ];
        const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categorias");

        // 3. Hoja de referencia con proveedores
        const suppliersData = [
          ["Proveedores"],
          ...suppliers.map((sup) => [sup.name]),
        ];
        const suppliersSheet = XLSX.utils.aoa_to_sheet(suppliersData);
        XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Proveedores");

        // 4. Hoja de referencia con unidades comunes
        const unitsData = [
          ["Unidades"],
          ["unidad"],
          ["kilogramo"],
          ["gramo"],
          ["litro"],
          ["mililitro"],
          ["metro"],
          ["centimetro"],
          ["caja"],
          ["paquete"],
          ["docena"],
        ];
        const unitsSheet = XLSX.utils.aoa_to_sheet(unitsData);
        XLSX.utils.book_append_sheet(workbook, unitsSheet, "Unidades");

        // 5. Hoja de instrucciones
        const instructionsData = [
          ["INSTRUCCIONES PARA IMPORTACION DE PRODUCTOS"],
          [""],
          ["CAMPOS OBLIGATORIOS:"],
          ["- Categoria: Debe existir en el sistema (ver hoja Categorias)"],
          ["- Proveedor: Debe existir en el sistema (ver hoja Proveedores)"],
          ["- Unidad: Si esta vacio se usa 'unidad' (ver hoja Unidades)"],
          [""],
          ["VALIDACION MINIMA:"],
          ["Al menos UNO de estos campos debe tener valor:"],
          ["- Stock (numero entero, 0 o mayor)"],
          ["- Costo (numero decimal mayor a 0.01)"],
          ["- Precio Mayorista (numero decimal mayor a 0.01)"],
          ["- Precio Minorista (numero decimal mayor a 0.01)"],
          [""],
          ["LOGICA DE IMPORTACION:"],
          ["- SKU vacio: Se crea un producto NUEVO con SKU auto-generado"],
          [
            "- SKU existente: Se ACTUALIZA el producto (solo campos con valores)",
          ],
          [""],
          ["FORMATO DE NUMEROS:"],
          ["- Usar PUNTO decimal (ejemplo: 123.45)"],
          ["- Valores 0 o 0.00 se consideran VACIOS (excepto Stock)"],
          ["- Maximo 2 decimales"],
          [""],
          ["CAMPOS OPCIONALES:"],
          ["- SKU: Dejar vacio para auto-generar"],
          ["- Descripcion: Texto libre"],
          ["- URL Imagen: URL completa de la imagen"],
          ["- Codigo de Barras: Codigo numerico (se ignora si ya existe)"],
          [""],
          ["IMPORTANTE:"],
          ["- Los campos vacios en actualizacion NO se modifican"],
          ["- Solo se actualizan campos que tengan un valor"],
          ["- Guardar como CSV antes de subir al sistema"],
        ];
        const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(
          workbook,
          instructionsSheet,
          "Instrucciones"
        );

        // Generar el archivo Excel
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

        // Descargar el archivo
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_productos.xlsx");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error("Error creando plantilla Excel:", error);
        // Fallback a CSV simple
        downloadSimpleCSV();
      });
  };

  // Función fallback para CSV simple
  const downloadSimpleCSV = () => {
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

    // Comentarios explicativos
    const comments = [
      "# INSTRUCCIONES:",
      "# - SKU: Dejar vacío para auto-generar, o completar para actualizar producto existente",
      "# - Nombre: Obligatorio",
      "# - Stock: Número entero (0 o mayor)",
      "# - Precios: Usar punto decimal (ej: 123.45). Valores 0 o 0.00 se consideran vacíos",
      "# - Categoria/Proveedor: Deben existir en el sistema",
      "# - Unidad: Si vacío, se usa 'unidad'",
      "# - URL Imagen: URL completa (opcional)",
      "# - Codigo de Barras: Código numérico (se ignora si ya existe en otro producto)",
      "# - Al menos uno debe tener valor: Stock, Costo, Precio Mayorista o Precio Minorista",
      "",
    ];

    // Crear filas de ejemplo con datos reales
    const exampleRows = [
      [
        "", // SKU vacío para auto-generar
        "Producto Nuevo Ejemplo",
        "Descripción del producto nuevo",
        "50",
        "5",
        "25.50",
        "35.75",
        "50.00",
        categories.length > 0 ? categories[0].name : "Categoria1",
        suppliers.length > 0 ? suppliers[0].name : "Proveedor1",
        "unidad",
        "https://ejemplo.com/imagen.jpg",
        "1234567890123",
      ],
      [
        "PROD-001", // SKU existente para actualizar
        "Producto Para Actualizar",
        "", // Descripción vacía - no se actualizará si el producto ya existe
        "100",
        "10",
        "", // Costo vacío - no se actualizará
        "80.00",
        "120.00",
        categories.length > 1
          ? categories[1].name
          : categories.length > 0
          ? categories[0].name
          : "Categoria2",
        suppliers.length > 1
          ? suppliers[1].name
          : suppliers.length > 0
          ? suppliers[0].name
          : "Proveedor2",
        "kilogramo",
        "",
        "",
      ],
    ];

    // Crear contenido CSV
    const csvContent = [
      ...comments,
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
                      <strong>Campos obligatorios:</strong> Categoría,
                      Proveedor, Unidad
                    </li>
                    <li>
                      <strong>Al menos uno de estos:</strong> Stock (≥0), Costo
                      (≥0.01), Precio Mayorista (≥0.01), o Precio Minorista
                      (≥0.01)
                    </li>
                    <li>
                      <strong>Campos opcionales:</strong> URL Imagen, Código de
                      Barras
                    </li>
                    <li>
                      <strong>Código de barras duplicado:</strong> Se ignora
                      automáticamente si ya existe en otro producto
                    </li>
                    <li>
                      <strong>SKU vacío:</strong> Se auto-genera un nuevo
                      producto
                    </li>
                    <li>
                      <strong>SKU existente:</strong> Se actualiza el producto
                      (solo campos con valores)
                    </li>
                    <li>
                      <strong>Formato números:</strong> Usar punto decimal (ej:
                      123.45)
                    </li>
                    <li>
                      <strong>Valores 0 o 0.00:</strong> Se consideran vacíos
                      (excepto Stock)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Descarga de plantilla */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Plantilla Excel/CSV
            </h2>
            <p className="text-gray-600 mb-4">
              Descarga la plantilla Excel con múltiples hojas, dropdowns y
              ejemplos de datos. La plantilla incluye hojas de referencia para
              categorías, proveedores y unidades.
            </p>

            {/* Mostrar valores disponibles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  📂 Categorías Disponibles ({categories.length}):
                </h4>
                <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                  {categories.length > 0 ? (
                    categories.map((cat, index) => (
                      <span key={cat.id} className="inline-block mr-2 mb-1">
                        {cat.name}
                        {index < categories.length - 1 && ","}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Cargando...</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  🏢 Proveedores Disponibles ({suppliers.length}):
                </h4>
                <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                  {suppliers.length > 0 ? (
                    suppliers.map((sup, index) => (
                      <span key={sup.id} className="inline-block mr-2 mb-1">
                        {sup.name}
                        {index < suppliers.length - 1 && ","}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Cargando...</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  📏 Unidades Comunes:
                </h4>
                <div className="text-xs text-gray-600">
                  unidad, kilogramo, gramo, litro, mililitro, metro, centímetro,
                  caja, paquete, docena
                </div>
              </div>
            </div>

            {/* Características de la plantilla */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                ✨ Nueva Plantilla Excel Mejorada:
              </h4>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>
                  <strong>Hoja "Productos":</strong> Plantilla principal con
                  ejemplos
                </li>
                <li>
                  <strong>Hoja "Categorias":</strong> Lista completa de
                  categorías del sistema
                </li>
                <li>
                  <strong>Hoja "Proveedores":</strong> Lista completa de
                  proveedores del sistema
                </li>
                <li>
                  <strong>Hoja "Unidades":</strong> Unidades de medida más
                  comunes
                </li>
                <li>
                  <strong>Hoja "Instrucciones":</strong> Guía completa paso a
                  paso
                </li>
                <li>
                  <strong>Nuevos campos:</strong> URL de imagen y código de
                  barras
                </li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadTemplate}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Descargar Plantilla Excel
              </button>
              <button
                onClick={downloadSimpleCSV}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Descargar CSV Simple
              </button>
            </div>
          </div>

          {/* Carga de archivo */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subir Archivo CSV o Excel
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo CSV o Excel
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos soportados: CSV, Excel (.xlsx, .xls)
                </p>
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
