"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  Package,
  Calculator,
  AlertCircle,
  Info,
  Trash2,
  Save,
} from "lucide-react";
import Link from "next/link";

interface Supplier {
  id: string;
  name: string;
  country: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  cost: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  unit: string;
  supplier: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface PurchaseItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPriceForeign?: number;
  unitPricePesos: number;
  distributedCosts?: number;
  finalUnitCost?: number;
  totalCost?: number;
  subtotalForeign?: number;
  subtotalPesos?: number;
  isNew?: boolean;
}

interface ImportCosts {
  freightCost: number;
  customsCost: number;
  taxCost: number;
  insuranceCost: number;
  otherCosts: number;
}

const currencies = [
  { code: "ARS", name: "Peso Argentino", symbol: "$" },
  { code: "USD", name: "Dólar Estadounidense", symbol: "US$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "BRL", name: "Real Brasileño", symbol: "R$" },
  { code: "CNY", name: "Yuan Chino", symbol: "¥" },
];

const NewPurchasePage = () => {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [supplierId, setSupplierId] = useState("");
  const [type, setType] = useState<"LOCAL" | "IMPORT">("LOCAL");
  const [currency, setCurrency] = useState("ARS");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [exchangeType, setExchangeType] = useState("Oficial");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [importCosts, setImportCosts] = useState<ImportCosts>({
    freightCost: 0,
    customsCost: 0,
    taxCost: 0,
    insuranceCost: 0,
    otherCosts: 0,
  });

  // Función para formatear números con puntos de miles y coma decimal
  const formatNumber = (value: number): string => {
    return value.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Función para parsear números del formato argentino
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  // Función para auto-calcular precio ARS cuando cambia precio USD
  const updateItemWithAutoCalculation = (
    productId: string,
    field: keyof PurchaseItem,
    value: any
  ) => {
    const newItems = [...items];
    const itemIndex = newItems.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex !== -1) {
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };

      // Auto-calcular precio ARS cuando cambia precio USD
      if (field === "unitPriceForeign" && currency !== "ARS") {
        const foreignPrice = parseFloat(value) || 0;
        const arsPrice = foreignPrice * exchangeRate;
        newItems[itemIndex].unitPricePesos = Math.round(arsPrice * 100) / 100;
      }

      setItems(newItems);
    }
  };

  // Efecto para recalcular precios ARS cuando cambia el tipo de cambio
  useEffect(() => {
    if (currency !== "ARS" && exchangeRate > 0) {
      const updatedItems = items.map((item) => {
        if (item.unitPriceForeign && item.unitPriceForeign > 0) {
          return {
            ...item,
            unitPricePesos:
              Math.round(item.unitPriceForeign * exchangeRate * 100) / 100,
          };
        }
        return item;
      });
      setItems(updatedItems);
    }
  }, [exchangeRate, currency]);

  // Persistencia de datos
  const STORAGE_KEY = "purchase_draft";

  const saveDraftToStorage = useCallback(() => {
    const draftData = {
      supplierId,
      type,
      currency,
      exchangeRate,
      exchangeType,
      orderDate,
      expectedDate,
      notes,
      items,
      importCosts,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  }, [
    supplierId,
    type,
    currency,
    exchangeRate,
    exchangeType,
    orderDate,
    expectedDate,
    notes,
    items,
    importCosts,
  ]);

  const loadDraftFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const draftData = JSON.parse(savedData);
        // Solo cargar si los datos son de las últimas 24 horas
        if (Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000) {
          setSupplierId(draftData.supplierId || "");
          setType(draftData.type || "LOCAL");
          setCurrency(draftData.currency || "ARS");
          setExchangeRate(draftData.exchangeRate || 1);
          setExchangeType(draftData.exchangeType || "Oficial");
          setOrderDate(
            draftData.orderDate || new Date().toISOString().split("T")[0]
          );
          setExpectedDate(draftData.expectedDate || "");
          setNotes(draftData.notes || "");
          setItems(draftData.items || []);
          setImportCosts(
            draftData.importCosts || {
              freightCost: 0,
              customsCost: 0,
              taxCost: 0,
              insuranceCost: 0,
              otherCosts: 0,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  }, []);

  const clearDraftFromStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDraftFromStorage();
  }, [loadDraftFromStorage]);

  // Guardar automáticamente cuando cambian los datos importantes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (supplierId || items.length > 0 || notes.trim()) {
        saveDraftToStorage();
      }
    }, 1000); // Guardar después de 1 segundo de inactividad

    return () => clearTimeout(timeoutId);
  }, [
    supplierId,
    type,
    currency,
    exchangeRate,
    exchangeType,
    orderDate,
    expectedDate,
    notes,
    items,
    importCosts,
    saveDraftToStorage,
  ]);

  // Fetch data
  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || data.suppliers || data || []);
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        const productsData = data.products || data.data || data || [];
        setProducts(productsData);
        setFilteredProducts(productsData);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
      setFilteredProducts([]);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (productSearch) {
      filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (product.sku &&
            product.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
          product.category.name
            .toLowerCase()
            .includes(productSearch.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [productSearch, products]);

  // Add product to purchase - mejorado como en edición
  const addProduct = (product: Product) => {
    const newItem: PurchaseItem = {
      productId: product.id,
      product,
      quantity: 1,
      unitPriceForeign: currency !== "ARS" ? undefined : undefined,
      unitPricePesos: product.cost,
      isNew: true,
    };
    setItems([...items, newItem]);
    setShowProductModal(false);
  };

  // Update item
  const updateItem = (
    productId: string,
    field: keyof PurchaseItem,
    value: any
  ) => {
    setItems(
      items.map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    );
  };

  // Update multiple fields of an item at once
  const updateItemFields = useCallback(
    (productId: string, updates: Partial<PurchaseItem>) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  // Update product prices within an item
  const updateItemProductPrice = useCallback(
    (
      productId: string,
      priceField: "wholesalePrice" | "retailPrice",
      value: number
    ) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId
            ? {
                ...item,
                product: {
                  ...item.product,
                  [priceField]: value,
                },
              }
            : item
        )
      );
    },
    []
  );

  // Auto-resize function for price inputs
  const getInputWidth = useCallback((value: string | number) => {
    if (!value || value === "" || value === 0) return "80px"; // Mínimo para placeholder

    const stringValue = value.toString();
    const length = stringValue.length;

    // Base width for mobile and desktop
    const baseWidth = 60; // Ancho base
    const charWidth = 8; // Aproximadamente 8px por carácter
    const padding = 24; // Padding interno del input

    const calculatedWidth = baseWidth + length * charWidth + padding;

    // Límites mínimo y máximo
    const minWidth = 80;
    const maxWidth = 200;

    return `${Math.min(Math.max(calculatedWidth, minWidth), maxWidth)}px`;
  }, []);

  // Remove item
  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  // Calculate totals - mejorado con la misma lógica de edición
  const calculateTotals = () => {
    const subtotalPesos = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPricePesos;
    }, 0);

    const subtotalForeign =
      currency !== "ARS"
        ? items.reduce((sum, item) => {
            const foreignPrice = item.unitPriceForeign || 0;
            return sum + item.quantity * foreignPrice;
          }, 0)
        : null;

    // Separar costos por moneda de forma más clara
    const costsForeign =
      currency !== "ARS"
        ? {
            freight: importCosts.freightCost,
            customs: importCosts.customsCost,
            insurance: importCosts.insuranceCost,
            other: importCosts.otherCosts,
          }
        : {
            freight: 0,
            customs: 0,
            insurance: 0,
            other: 0,
          };

    const costsLocal = {
      // Impuestos SIEMPRE en pesos (IIBB, IVA, etc. son locales)
      tax: importCosts.taxCost,
      // Si es compra local (ARS), todos los costos van en pesos
      ...(currency === "ARS"
        ? {
            freight: importCosts.freightCost,
            customs: importCosts.customsCost,
            insurance: importCosts.insuranceCost,
            other: importCosts.otherCosts,
          }
        : {
            // Si es importación, solo algunos costos pueden estar en pesos
            // Por ejemplo: algunos impuestos, algunos seguros locales, etc.
            // Por ahora dejamos solo tax, pero se podría expandir
          }),
    };

    const totalCostsForeign = Object.values(costsForeign).reduce(
      (sum, cost) => sum + cost,
      0
    );
    const totalCostsLocal = Object.values(costsLocal).reduce(
      (sum, cost) => sum + cost,
      0
    );

    // Convertir costos extranjeros a pesos usando el tipo de cambio
    const totalCostsForeignInPesos = totalCostsForeign * exchangeRate;
    const totalCostsInPesos = totalCostsForeignInPesos + totalCostsLocal;

    const total = subtotalPesos + totalCostsInPesos;

    // Calcular costos distribuidos por item
    const itemsWithDistributedCosts = items.map((item) => {
      const itemSubtotalPesos = item.quantity * item.unitPricePesos;
      const distributedCosts =
        subtotalPesos > 0
          ? (itemSubtotalPesos / subtotalPesos) * totalCostsInPesos
          : 0;
      const finalUnitCost =
        item.unitPricePesos + distributedCosts / item.quantity;
      const finalTotalCost = finalUnitCost * item.quantity;

      return {
        ...item,
        distributedCosts,
        finalUnitCost,
        finalTotalCost,
      };
    });

    return {
      subtotalPesos,
      subtotalForeign,
      totalCosts: totalCostsInPesos,
      totalCostsForeign,
      totalCostsLocal,
      totalCostsForeignInPesos,
      costsForeign,
      costsLocal,
      total,
      itemsWithDistributedCosts,
    };
  };

  // Calculate distributed costs for imports - ya no necesitamos esta función, se incluye en calculateTotals
  // Mantenemos por compatibilidad pero no se usa
  const calculateDistributedCosts = () => {
    return calculateTotals().itemsWithDistributedCosts;
  };

  // Submit form - mejorado con la misma lógica de edición
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Debe agregar al menos un producto a la compra");
      return;
    }

    if (!supplierId) {
      setError("Debe seleccionar un proveedor");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalsData = calculateTotals();

      const purchaseData = {
        supplierId,
        type,
        currency: currency !== "ARS" ? currency : undefined,
        exchangeRate: currency !== "ARS" ? exchangeRate : undefined,
        exchangeType: currency !== "ARS" ? exchangeType : undefined,
        freightCost: importCosts.freightCost,
        customsCost: importCosts.customsCost,
        taxCost: importCosts.taxCost,
        insuranceCost: importCosts.insuranceCost,
        otherCosts: importCosts.otherCosts,
        orderDate,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        // Incluir los totales calculados
        subtotalPesos: totalsData.subtotalPesos,
        subtotalForeign: totalsData.subtotalForeign,
        totalCosts: totalsData.totalCosts,
        total: totalsData.total,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceForeign: item.unitPriceForeign,
          unitPricePesos: item.unitPricePesos,
          // Incluir los precios actualizados para actualizar el producto
          wholesalePrice: item.product.wholesalePrice,
          retailPrice: item.product.retailPrice,
        })),
      };

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        const purchase = await response.json();
        clearDraftFromStorage(); // Limpiar el borrador al completar exitosamente
        router.push(`/purchases/${purchase.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al crear la compra");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Detect new product from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newProductId = urlParams.get("newProduct");

    if (newProductId) {
      // Find the new product and add it to items
      const newProduct = products.find((p) => p.id === newProductId);
      if (
        newProduct &&
        !items.find((item) => item.productId === newProductId)
      ) {
        addProduct(newProduct);

        // Clean URL
        window.history.replaceState({}, "", "/purchases/new");
      }
    }
  }, [products, items]);

  const totals = calculateTotals();
  // const itemsWithCosts = calculateDistributedCosts(); // Ya no necesitamos esto

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/purchases"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Nueva Compra</h1>
              {localStorage.getItem(STORAGE_KEY) && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm">
                    <Info className="h-4 w-4" />
                    Borrador guardado
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "¿Estás seguro de que quieres limpiar el borrador guardado?"
                        )
                      ) {
                        clearDraftFromStorage();
                        window.location.reload();
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                    title="Limpiar borrador"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600">
              Complete la información de la compra y agregue los productos
              necesarios
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información sobre precios de venta */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Actualización de Precios de Venta
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Puedes editar los precios mayorista y minorista de cada
                      producto
                    </li>
                    <li>
                      Los botones{" "}
                      <span className="font-mono bg-blue-100 px-1 rounded">
                        +30%
                      </span>{" "}
                      y{" "}
                      <span className="font-mono bg-green-100 px-1 rounded">
                        +50%
                      </span>{" "}
                      sugieren precios automáticamente
                    </li>
                    <li>
                      Los márgenes se calculan sobre el costo final (incluyendo
                      costos distribuidos para importaciones)
                    </li>
                    <li>
                      Los precios se actualizarán en el producto cuando
                      confirmes la compra
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información General
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Compra *
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "LOCAL" | "IMPORT")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOCAL">Local/Mayorista</option>
                    <option value="IMPORT">Importación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Orden *
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Esperada
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre la compra..."
                />
              </div>
            </div>

            {/* Costos Adicionales - mejorado como en edición */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Costos Adicionales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Compra
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "LOCAL" | "IMPORT")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="LOCAL">Local/Mayorista</option>
                    <option value="IMPORT">Importación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                {currency !== "ARS" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Cambio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={exchangeRate}
                      onChange={(e) =>
                        setExchangeRate(parseFloat(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Flete{" "}
                    {currency !== "ARS" ? `(${currency})` : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importCosts.freightCost}
                    onChange={(e) =>
                      setImportCosts({
                        ...importCosts,
                        freightCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Aduana{" "}
                    {currency !== "ARS" ? `(${currency})` : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importCosts.customsCost}
                    onChange={(e) =>
                      setImportCosts({
                        ...importCosts,
                        customsCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impuestos (ARS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importCosts.taxCost}
                    onChange={(e) =>
                      setImportCosts({
                        ...importCosts,
                        taxCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Impuestos locales siempre en pesos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seguro {currency !== "ARS" ? `(${currency})` : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importCosts.insuranceCost}
                    onChange={(e) =>
                      setImportCosts({
                        ...importCosts,
                        insuranceCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Otros Costos{" "}
                    {currency !== "ARS" ? `(${currency})` : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importCosts.otherCosts}
                    onChange={(e) =>
                      setImportCosts({
                        ...importCosts,
                        otherCosts: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Productos ({items.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay productos agregados
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Agregue productos para continuar con la compra
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Primer Producto
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const itemWithCosts =
                      totals.itemsWithDistributedCosts.find(
                        (i: any) => i.productId === item.productId
                      ) || item;

                    return (
                      <div
                        key={item.productId}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              SKU: {item.product.sku || "N/A"} | Stock actual:{" "}
                              {item.product.stock} {item.product.unit}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          {type === "IMPORT" && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Precio Unit. ({currency}) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  item.unitPriceForeign !== undefined &&
                                  item.unitPriceForeign !== 0
                                    ? item.unitPriceForeign
                                    : ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (value === "") {
                                    // Si está vacío, setear a undefined para no mostrar 0
                                    updateItemFields(item.productId, {
                                      unitPriceForeign: undefined,
                                      unitPricePesos: 0,
                                    });
                                  } else {
                                    const parsed = parseFloat(value);
                                    if (!isNaN(parsed)) {
                                      updateItemFields(item.productId, {
                                        unitPriceForeign: parsed,
                                        unitPricePesos:
                                          Math.round(
                                            parsed * exchangeRate * 100
                                          ) / 100,
                                      });
                                    }
                                  }
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Precio Unit. (ARS) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPricePesos || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const pricePesos =
                                  value === ""
                                    ? 0
                                    : Math.round(parseFloat(value) * 100) / 100;
                                updateItem(
                                  item.productId,
                                  "unitPricePesos",
                                  pricePesos
                                );
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>

                          {type === "IMPORT" && totals.totalCosts > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Costos Dist.
                              </label>
                              <div className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700 font-medium">
                                $
                                {formatNumber(
                                  itemWithCosts.distributedCosts || 0
                                )}
                              </div>
                            </div>
                          )}

                          {type === "IMPORT" && totals.totalCosts > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Costo Final Unit.
                              </label>
                              <div className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-blue-50 text-blue-800 font-medium">
                                $
                                {formatNumber(
                                  itemWithCosts.finalUnitCost ||
                                    item.unitPricePesos
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Total
                            </label>
                            <div className="w-full px-2 py-1.5 text-sm border border-green-200 rounded-md bg-green-50 text-green-800 font-bold">
                              $
                              {(
                                itemWithCosts.totalCost ||
                                item.unitPricePesos * item.quantity
                              ).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Sección de precios de venta y márgenes */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-medium text-gray-700">
                              💰 Precios de Venta y Márgenes
                            </h5>
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              💡 Los precios se actualizarán al confirmar la
                              compra
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <div className="flex-shrink-0">
                              <label className="block text-xs font-medium text-blue-700 mb-1">
                                💼 Precio Mayorista *
                              </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.product.wholesalePrice || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const price =
                                      value === ""
                                        ? 0
                                        : Math.round(parseFloat(value) * 100) /
                                          100;
                                    updateItemProductPrice(
                                      item.productId,
                                      "wholesalePrice",
                                      price
                                    );
                                  }}
                                  style={{
                                    width: getInputWidth(
                                      item.product.wholesalePrice || ""
                                    ),
                                  }}
                                  className="px-2 py-1.5 text-sm border border-blue-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-blue-800 font-medium bg-white min-w-[80px]"
                                  placeholder="0.00"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const finalCost =
                                      itemWithCosts.finalUnitCost ||
                                      item.unitPricePesos;
                                    const suggestedPrice =
                                      Math.round(finalCost * 1.4 * 100) / 100; // 30% margen
                                    updateItemProductPrice(
                                      item.productId,
                                      "wholesalePrice",
                                      suggestedPrice
                                    );
                                  }}
                                  className="px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium border border-blue-200"
                                  title="Sugerir precio con 40% de margen"
                                >
                                  +40%
                                </button>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <label className="block text-xs font-medium text-green-700 mb-1">
                                🏪 Precio Minorista *
                              </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.product.retailPrice || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const price =
                                      value === ""
                                        ? 0
                                        : Math.round(parseFloat(value) * 100) /
                                          100;
                                    updateItemProductPrice(
                                      item.productId,
                                      "retailPrice",
                                      price
                                    );
                                  }}
                                  style={{
                                    width: getInputWidth(
                                      item.product.retailPrice || ""
                                    ),
                                  }}
                                  className="px-2 py-1.5 text-sm border border-green-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 text-green-800 font-medium bg-white min-w-[80px]"
                                  placeholder="0.00"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const finalCost =
                                      itemWithCosts.finalUnitCost ||
                                      item.unitPricePesos;
                                    const suggestedPrice =
                                      Math.round(finalCost * 2.1 * 100) / 100; // 110% margen
                                    updateItemProductPrice(
                                      item.productId,
                                      "retailPrice",
                                      suggestedPrice
                                    );
                                  }}
                                  className="px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium border border-green-200"
                                  title="Sugerir precio con 110% de margen"
                                >
                                  +110%
                                </button>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <label className="block text-xs font-medium text-blue-700 mb-1">
                                📊 Margen Mayorista
                              </label>
                              <div
                                className={`px-3 py-1.5 text-sm border rounded-md font-medium text-center min-w-[80px] ${(() => {
                                  const finalCost =
                                    itemWithCosts.finalUnitCost ||
                                    item.unitPricePesos;
                                  if (finalCost === 0)
                                    return "border-gray-300 bg-gray-50 text-gray-600";
                                  const margin =
                                    ((item.product.wholesalePrice - finalCost) /
                                      finalCost) *
                                    100;
                                  if (margin >= 30)
                                    return "border-green-300 bg-green-50 text-green-800";
                                  if (margin >= 15)
                                    return "border-yellow-300 bg-yellow-50 text-yellow-800";
                                  return "border-red-300 bg-red-50 text-red-800";
                                })()}`}
                              >
                                {(() => {
                                  const finalCost =
                                    itemWithCosts.finalUnitCost ||
                                    item.unitPricePesos;
                                  if (finalCost === 0) return "N/A";
                                  const margin =
                                    ((item.product.wholesalePrice - finalCost) /
                                      finalCost) *
                                    100;
                                  return `${margin.toFixed(1)}%`;
                                })()}
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <label className="block text-xs font-medium text-green-700 mb-1">
                                📈 Margen Minorista
                              </label>
                              <div
                                className={`px-3 py-1.5 text-sm border rounded-md font-medium text-center min-w-[80px] ${(() => {
                                  const finalCost =
                                    itemWithCosts.finalUnitCost ||
                                    item.unitPricePesos;
                                  if (finalCost === 0)
                                    return "border-gray-300 bg-gray-50 text-gray-600";
                                  const margin =
                                    ((item.product.retailPrice - finalCost) /
                                      finalCost) *
                                    100;
                                  if (margin >= 50)
                                    return "border-green-300 bg-green-50 text-green-800";
                                  if (margin >= 30)
                                    return "border-yellow-300 bg-yellow-50 text-yellow-800";
                                  return "border-red-300 bg-red-50 text-red-800";
                                })()}`}
                              >
                                {(() => {
                                  const finalCost =
                                    itemWithCosts.finalUnitCost ||
                                    item.unitPricePesos;
                                  if (finalCost === 0) return "N/A";
                                  const margin =
                                    ((item.product.retailPrice - finalCost) /
                                      finalCost) *
                                    100;
                                  return `${margin.toFixed(1)}%`;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen de la Compra
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Subtotal Productos:
                    </span>
                    <span className="text-sm font-medium">
                      ${formatNumber(totals.subtotalPesos)}
                    </span>
                  </div>

                  {totals.subtotalForeign && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Subtotal {currency}:
                      </span>
                      <span className="text-sm font-medium">
                        {currency} {formatNumber(totals.subtotalForeign)}
                      </span>
                    </div>
                  )}

                  {/* Desglose de costos adicionales */}
                  <div className="border-t pt-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Resumen de Costos:
                    </div>

                    {/* Costos en moneda extranjera */}
                    {currency !== "ARS" && totals.totalCostsForeign > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-xs font-medium text-blue-800 mb-1">
                          Costos en {currency}:
                        </div>
                        {totals.costsForeign.freight > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Flete:</span>
                            <span>
                              {currency}{" "}
                              {formatNumber(totals.costsForeign.freight)}
                            </span>
                          </div>
                        )}
                        {totals.costsForeign.customs > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Aduana:</span>
                            <span>
                              {currency}{" "}
                              {formatNumber(totals.costsForeign.customs)}
                            </span>
                          </div>
                        )}
                        {totals.costsForeign.insurance > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Seguro:</span>
                            <span>
                              {currency}{" "}
                              {formatNumber(totals.costsForeign.insurance)}
                            </span>
                          </div>
                        )}
                        {totals.costsForeign.other > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Otros:</span>
                            <span>
                              {currency}{" "}
                              {formatNumber(totals.costsForeign.other)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-medium text-blue-800 mt-1 pt-1 border-t border-blue-300">
                          <span>Subtotal {currency}:</span>
                          <span>
                            {currency} {formatNumber(totals.totalCostsForeign)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-700 mt-1">
                          <span>
                            Convertido a ARS (TC: {formatNumber(exchangeRate)}):
                          </span>
                          <span>
                            ARS $
                            {formatNumber(
                              totals.totalCostsForeign * exchangeRate
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Costos en pesos argentinos */}
                    {totals.totalCostsLocal > 0 && (
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="text-xs font-medium text-green-800 mb-1">
                          Costos en ARS:
                        </div>
                        {totals.costsLocal.tax > 0 && (
                          <div className="flex justify-between text-xs text-green-700">
                            <span>• Impuestos:</span>
                            <span>
                              ARS ${formatNumber(totals.costsLocal.tax)}
                            </span>
                          </div>
                        )}
                        {currency === "ARS" && (
                          <>
                            {(totals.costsLocal.freight || 0) > 0 && (
                              <div className="flex justify-between text-xs text-green-700">
                                <span>• Flete:</span>
                                <span>
                                  ARS $
                                  {formatNumber(totals.costsLocal.freight || 0)}
                                </span>
                              </div>
                            )}
                            {(totals.costsLocal.customs || 0) > 0 && (
                              <div className="flex justify-between text-xs text-green-700">
                                <span>• Aduana:</span>
                                <span>
                                  ARS $
                                  {formatNumber(totals.costsLocal.customs || 0)}
                                </span>
                              </div>
                            )}
                            {(totals.costsLocal.insurance || 0) > 0 && (
                              <div className="flex justify-between text-xs text-green-700">
                                <span>• Seguro:</span>
                                <span>
                                  ARS $
                                  {formatNumber(
                                    totals.costsLocal.insurance || 0
                                  )}
                                </span>
                              </div>
                            )}
                            {(totals.costsLocal.other || 0) > 0 && (
                              <div className="flex justify-between text-xs text-green-700">
                                <span>• Otros:</span>
                                <span>
                                  ARS $
                                  {formatNumber(totals.costsLocal.other || 0)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between text-xs font-medium text-green-800 mt-1 pt-1 border-t border-green-300">
                          <span>Subtotal ARS:</span>
                          <span>
                            ARS ${formatNumber(totals.totalCostsLocal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Total general de costos */}
                    <div className="flex justify-between text-sm font-medium text-gray-700 mt-2 pt-2 border-t">
                      <span>Total Costos (ARS):</span>
                      <span>ARS ${formatNumber(totals.totalCosts)}</span>
                    </div>

                    {currency !== "ARS" && totals.totalCostsForeign > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Incluye conversión de {currency}{" "}
                        {formatNumber(totals.totalCostsForeign)} a ARS
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">
                        Total Final:
                      </span>
                      <span className="text-base font-bold text-gray-900">
                        ${formatNumber(totals.total)}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de costos distribuidos */}
                  {totals.itemsWithDistributedCosts.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Costos Finales por Producto:
                      </div>
                      {totals.itemsWithDistributedCosts.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-xs text-gray-600 mb-1"
                        >
                          <span className="truncate mr-2">
                            {item.product.name}:
                          </span>
                          <span className="font-medium">
                            ${formatNumber(item.finalUnitCost)}/u
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6">
              <Link
                href="/purchases"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || !supplierId || items.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creando..." : "Crear Compra"}
              </button>
            </div>
          </form>

          {/* Product Selection Modal */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Seleccionar Producto
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/new-from-purchase?returnTo=${encodeURIComponent(
                          "/purchases/new"
                        )}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Nuevo Producto
                      </Link>
                      <button
                        onClick={() => setShowProductModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-96 p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => addProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              SKU: {product.sku || "N/A"} | Categoría:{" "}
                              {product.category.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Stock: {product.stock} {product.unit} | Costo: $
                              {product.cost.toLocaleString("es-AR")}
                            </p>
                          </div>
                          {items.find(
                            (item) => item.productId === product.id
                          ) && (
                            <div className="text-sm text-green-600 font-medium">
                              ✓ Agregado (
                              {
                                items.find(
                                  (item) => item.productId === product.id
                                )?.quantity
                              }
                              )
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No se encontraron productos
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-600">
                      Productos disponibles: {filteredProducts.length}
                    </div>
                    <button
                      onClick={() => setShowProductModal(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NewPurchasePage;
