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

  // Add product to purchase
  const addProduct = (product: Product) => {
    const existingItem = items.find((item) => item.productId === product.id);

    if (existingItem) {
      setItems(
        items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPriceForeign: type === "IMPORT" ? undefined : undefined,
        unitPricePesos: product.cost,
      };
      setItems([...items, newItem]);
    }
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

  // Remove item
  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotalForeign =
      type === "IMPORT"
        ? items.reduce(
            (sum, item) => sum + (item.unitPriceForeign || 0) * item.quantity,
            0
          )
        : 0;

    const subtotalPesos = items.reduce(
      (sum, item) => sum + item.unitPricePesos * item.quantity,
      0
    );

    const totalCosts =
      importCosts.freightCost +
      importCosts.customsCost +
      importCosts.taxCost +
      importCosts.insuranceCost +
      importCosts.otherCosts;

    const total = subtotalPesos + totalCosts;

    return { subtotalForeign, subtotalPesos, totalCosts, total };
  };

  // Calculate distributed costs for imports
  const calculateDistributedCosts = () => {
    const { subtotalPesos, totalCosts } = calculateTotals();

    if (type !== "IMPORT" || totalCosts === 0 || subtotalPesos === 0) {
      return items.map((item) => ({
        ...item,
        distributedCosts: 0,
        finalUnitCost: item.unitPricePesos,
        totalCost: item.unitPricePesos * item.quantity,
      }));
    }

    return items.map((item) => {
      const itemTotal = item.unitPricePesos * item.quantity;
      const proportion = itemTotal / subtotalPesos;
      const distributedCosts = totalCosts * proportion;
      const finalUnitCost =
        item.unitPricePesos + distributedCosts / item.quantity;

      return {
        ...item,
        distributedCosts,
        finalUnitCost,
        totalCost: finalUnitCost * item.quantity,
      };
    });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || items.length === 0) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    setLoading(true);

    try {
      const purchaseData = {
        supplierId,
        type,
        currency: type === "IMPORT" ? currency : undefined,
        exchangeRate: type === "IMPORT" ? exchangeRate : undefined,
        exchangeType: type === "IMPORT" ? exchangeType : undefined,
        freightCost: type === "IMPORT" ? importCosts.freightCost : undefined,
        customsCost: type === "IMPORT" ? importCosts.customsCost : undefined,
        taxCost: type === "IMPORT" ? importCosts.taxCost : undefined,
        insuranceCost:
          type === "IMPORT" ? importCosts.insuranceCost : undefined,
        otherCosts: type === "IMPORT" ? importCosts.otherCosts : undefined,
        orderDate,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceForeign: item.unitPriceForeign,
          unitPricePesos: item.unitPricePesos,
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
        const error = await response.json();
        alert(error.error || "Error al crear la compra");
      }
    } catch (error) {
      console.error("Error al crear compra:", error);
      alert("Error al crear la compra");
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

  const { subtotalForeign, subtotalPesos, totalCosts, total } =
    calculateTotals();
  const itemsWithCosts = calculateDistributedCosts();

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

            {/* Import Configuration */}
            {type === "IMPORT" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración de Importación
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda *
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Cambio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) =>
                        setExchangeRate(parseFloat(e.target.value) || 0)
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Cambio
                    </label>
                    <select
                      value={exchangeType}
                      onChange={(e) => setExchangeType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Oficial">Oficial</option>
                      <option value="Blue">Blue</option>
                      <option value="MEP">MEP</option>
                      <option value="CCL">CCL</option>
                      <option value="Turista">Turista</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    Costos de Importación (en pesos)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Flete
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={importCosts.freightCost}
                        onChange={(e) =>
                          setImportCosts((prev) => ({
                            ...prev,
                            freightCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gastos Aduaneros
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={importCosts.customsCost}
                        onChange={(e) =>
                          setImportCosts((prev) => ({
                            ...prev,
                            customsCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Impuestos (DJAI, etc.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={importCosts.taxCost}
                        onChange={(e) =>
                          setImportCosts((prev) => ({
                            ...prev,
                            taxCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seguro
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={importCosts.insuranceCost}
                        onChange={(e) =>
                          setImportCosts((prev) => ({
                            ...prev,
                            insuranceCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Otros Gastos
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={importCosts.otherCosts}
                        onChange={(e) =>
                          setImportCosts((prev) => ({
                            ...prev,
                            otherCosts: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">
                          Total Costos
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          $
                          {totalCosts.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {totalCosts > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        Los costos de importación se distribuirán
                        proporcionalmente entre todos los productos de la
                        compra.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                      itemsWithCosts.find(
                        (i) => i.productId === item.productId
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

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          {type === "IMPORT" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        unitPricePesos: parsed * exchangeRate,
                                      });
                                    }
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Precio Unit. (ARS) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPricePesos || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const pricePesos =
                                  value === "" ? 0 : parseFloat(value);
                                updateItem(
                                  item.productId,
                                  "unitPricePesos",
                                  pricePesos
                                );
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>

                          {type === "IMPORT" && totalCosts > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Costos Dist.
                              </label>
                              <input
                                type="text"
                                value={`$${(
                                  itemWithCosts.distributedCosts || 0
                                ).toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                })}`}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                              />
                            </div>
                          )}

                          {type === "IMPORT" && totalCosts > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Costo Final Unit.
                              </label>
                              <input
                                type="text"
                                value={`$${(
                                  itemWithCosts.finalUnitCost ||
                                  item.unitPricePesos
                                ).toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                })}`}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <input
                              type="text"
                              value={`$${(
                                itemWithCosts.totalCost ||
                                item.unitPricePesos * item.quantity
                              ).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                              })}`}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
                            />
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
                  {type === "IMPORT" && subtotalForeign > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Subtotal ({currency}):
                      </span>
                      <span className="font-medium">
                        {currencies.find((c) => c.code === currency)?.symbol}
                        {subtotalForeign.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal (ARS):</span>
                    <span className="font-medium">
                      $
                      {subtotalPesos.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {type === "IMPORT" && totalCosts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Costos de Importación:
                      </span>
                      <span className="font-medium">
                        $
                        {totalCosts.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">
                        $
                        {total.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
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
