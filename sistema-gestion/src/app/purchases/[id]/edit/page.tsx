"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  Package,
  X,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  cost: number;
  category: {
    name: string;
  };
}

interface PurchaseItem {
  id: string;
  product: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  };
  quantity: number;
  unitPriceForeign?: number | null;
  unitPricePesos: number;
  subtotalForeign?: number | null;
  subtotalPesos: number;
  distributedCostForeign?: number | null;
  distributedCostPesos?: number | null;
  finalCostForeign?: number | null;
  finalCostPesos?: number | null;
}

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: {
    id: string;
    name: string;
    country: string;
  };
  type: string;
  currency?: string;
  exchangeRate?: number | null;
  exchangeType?: string;
  freightCost: number;
  customsCost: number;
  taxCost: number;
  insuranceCost: number;
  otherCosts: number;
  subtotalForeign?: number | null;
  subtotalPesos: number;
  totalCosts: number;
  total: number;
  status: string;
  items: PurchaseItem[];
}

interface EditItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceForeign?: number;
  unitPricePesos: number;
  isNew?: boolean;
}

export default function EditPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Estados del formulario
  const [editData, setEditData] = useState({
    freightCost: 0,
    customsCost: 0,
    taxCost: 0,
    insuranceCost: 0,
    otherCosts: 0,
    exchangeRate: 1,
    currency: "ARS",
  });

  const [editItems, setEditItems] = useState<EditItem[]>([]);

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
    index: number,
    field: keyof EditItem,
    value: any
  ) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calcular precio ARS cuando cambia precio USD
    if (field === "unitPriceForeign" && editData.currency !== "ARS") {
      const foreignPrice = parseFloat(value) || 0;
      const arsPrice = foreignPrice * editData.exchangeRate;
      newItems[index].unitPricePesos = Math.round(arsPrice * 100) / 100;
    }

    setEditItems(newItems);
  };

  // Efecto para recalcular precios ARS cuando cambia el tipo de cambio
  useEffect(() => {
    if (editData.currency !== "ARS" && editData.exchangeRate > 0) {
      const updatedItems = editItems.map((item) => {
        if (item.unitPriceForeign && item.unitPriceForeign > 0) {
          return {
            ...item,
            unitPricePesos:
              Math.round(item.unitPriceForeign * editData.exchangeRate * 100) /
              100,
          };
        }
        return item;
      });
      setEditItems(updatedItems);
    }
  }, [editData.exchangeRate, editData.currency]);

  useEffect(() => {
    if (params.id) {
      fetchPurchase();
      fetchProducts();
    }
  }, [params.id]);

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchases/${params.id}`);
      if (!response.ok) {
        throw new Error("Error al cargar la compra");
      }
      const data = await response.json();
      setPurchase(data);

      // Inicializar datos de edición
      setEditData({
        freightCost: data.freightCost,
        customsCost: data.customsCost,
        taxCost: data.taxCost,
        insuranceCost: data.insuranceCost,
        otherCosts: data.otherCosts,
        exchangeRate: data.exchangeRate || 1,
        currency: data.currency || "ARS",
      });

      // Inicializar items de edición
      setEditItems(
        data.items.map((item: PurchaseItem) => ({
          id: item.id,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPriceForeign: item.unitPriceForeign || undefined,
          unitPricePesos: item.unitPricePesos,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !editItems.some((item) => item.productId === product.id)
  );

  const addProduct = (product: Product) => {
    const newItem: EditItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPricePesos: product.cost,
      isNew: true,
    };
    setEditItems([...editItems, newItem]);
    setSearchTerm("");
    setShowProductSearch(false);
  };

  const removeItem = (index: number) => {
    const newItems = editItems.filter((_, i) => i !== index);
    setEditItems(newItems);
  };

  const updateItem = (index: number, field: keyof EditItem, value: any) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditItems(newItems);
  };

  const calculateTotals = () => {
    const subtotalPesos = editItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPricePesos;
    }, 0);

    const subtotalForeign =
      editData.currency !== "ARS"
        ? editItems.reduce((sum, item) => {
            const foreignPrice = item.unitPriceForeign || 0;
            return sum + item.quantity * foreignPrice;
          }, 0)
        : null;

    // Separar costos por moneda de forma más clara
    const costsForeign =
      editData.currency !== "ARS"
        ? {
            freight: editData.freightCost,
            customs: editData.customsCost,
            insurance: editData.insuranceCost,
            other: editData.otherCosts,
          }
        : {
            freight: 0,
            customs: 0,
            insurance: 0,
            other: 0,
          };

    const costsLocal = {
      // Impuestos SIEMPRE en pesos (IIBB, IVA, etc. son locales)
      tax: editData.taxCost,
      // Si es compra local (ARS), todos los costos van en pesos
      ...(editData.currency === "ARS"
        ? {
            freight: editData.freightCost,
            customs: editData.customsCost,
            insurance: editData.insuranceCost,
            other: editData.otherCosts,
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
    const totalCostsForeignInPesos = totalCostsForeign * editData.exchangeRate;
    const totalCostsInPesos = totalCostsForeignInPesos + totalCostsLocal;

    const total = subtotalPesos + totalCostsInPesos;

    // Calcular costos distribuidos por item
    const itemsWithDistributedCosts = editItems.map((item) => {
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

  const handleSave = async () => {
    if (editItems.length === 0) {
      setError("Debe agregar al menos un producto a la compra");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const totals = calculateTotals();

      const updateData = {
        ...editData,
        ...totals,
        items: editItems,
      };

      const response = await fetch(`/api/purchases/${params.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la compra");
      }

      router.push(`/purchases/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error && !purchase) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!purchase) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p>Compra no encontrada</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/purchases/${purchase.id}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a Detalle
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar Compra #{purchase.purchaseNumber}
              </h1>
              <p className="text-sm text-gray-600">
                Proveedor: {purchase.supplier.name}
              </p>
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Productos</h2>
                <button
                  onClick={() => setShowProductSearch(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </button>
              </div>

              {editItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">
                    Haz clic en "Agregar Producto" para comenzar
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        {editData.currency !== "ARS" && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Precio {editData.currency}
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Precio ARS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Subtotal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Costo Distribuido
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Costo Final Unit.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {totals.itemsWithDistributedCosts.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemWithAutoCalculation(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          {editData.currency !== "ARS" && (
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPriceForeign || 0}
                                onChange={(e) =>
                                  updateItemWithAutoCalculation(
                                    index,
                                    "unitPriceForeign",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="0,00"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                ARS: $
                                {formatNumber(
                                  editData.exchangeRate *
                                    (item.unitPriceForeign || 0)
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPricePesos}
                              onChange={(e) =>
                                updateItemWithAutoCalculation(
                                  index,
                                  "unitPricePesos",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0,00"
                            />
                            {editData.currency !== "ARS" && (
                              <div className="text-xs text-gray-500 mt-1">
                                {editData.currency}:{" "}
                                {(
                                  (item.unitPricePesos || 0) /
                                  editData.exchangeRate
                                ).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${formatNumber(item.quantity * item.unitPricePesos)}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600">
                            ${formatNumber(item.distributedCosts)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            ${formatNumber(item.finalUnitCost)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Costos Adicionales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Costos Adicionales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    value={editData.currency}
                    onChange={(e) =>
                      setEditData({ ...editData, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                {editData.currency !== "ARS" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Cambio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData.exchangeRate}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          exchangeRate: parseFloat(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Flete{" "}
                    {editData.currency !== "ARS"
                      ? `(${editData.currency})`
                      : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.freightCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        freightCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Aduana{" "}
                    {editData.currency !== "ARS"
                      ? `(${editData.currency})`
                      : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.customsCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
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
                    value={editData.taxCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
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
                    Seguro{" "}
                    {editData.currency !== "ARS"
                      ? `(${editData.currency})`
                      : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.insuranceCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        insuranceCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Otros Costos{" "}
                    {editData.currency !== "ARS"
                      ? `(${editData.currency})`
                      : "(ARS)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.otherCosts}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        otherCosts: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Resumen */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resumen
              </h3>

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
                      Subtotal {editData.currency}:
                    </span>
                    <span className="text-sm font-medium">
                      {editData.currency} {formatNumber(totals.subtotalForeign)}
                    </span>
                  </div>
                )}

                {/* Desglose de costos adicionales */}
                <div className="border-t pt-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Resumen de Costos:
                  </div>

                  {/* Costos en moneda extranjera */}
                  {editData.currency !== "ARS" &&
                    totals.totalCostsForeign > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-xs font-medium text-blue-800 mb-1">
                          Costos en {editData.currency}:
                        </div>
                        {totals.costsForeign.freight > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Flete:</span>
                            <span>
                              {editData.currency}{" "}
                              {formatNumber(totals.costsForeign.freight)}
                            </span>
                          </div>
                        )}
                        {totals.costsForeign.customs > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Aduana:</span>
                            <span>
                              {editData.currency}{" "}
                              {formatNumber(totals.costsForeign.customs)}
                            </span>
                          </div>
                        )}
                        {totals.costsForeign.insurance > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Seguro:</span>
                            <span>
                              {editData.currency}{" "}
                              {formatNumber(totals.costsForeign.insurance)}
                            </span>
                          </div>
                        )}
                        {totals.costsForeign.other > 0 && (
                          <div className="flex justify-between text-xs text-blue-700">
                            <span>• Otros:</span>
                            <span>
                              {editData.currency}{" "}
                              {formatNumber(totals.costsForeign.other)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-medium text-blue-800 mt-1 pt-1 border-t border-blue-300">
                          <span>Subtotal {editData.currency}:</span>
                          <span>
                            {editData.currency}{" "}
                            {formatNumber(totals.totalCostsForeign)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-700 mt-1">
                          <span>
                            Convertido a ARS (TC:{" "}
                            {formatNumber(editData.exchangeRate)}):
                          </span>
                          <span>
                            ARS $
                            {formatNumber(
                              totals.totalCostsForeign * editData.exchangeRate
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
                      {editData.currency === "ARS" && (
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
                                {formatNumber(totals.costsLocal.insurance || 0)}
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
                        <span>ARS ${formatNumber(totals.totalCostsLocal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Total general de costos */}
                  <div className="flex justify-between text-sm font-medium text-gray-700 mt-2 pt-2 border-t">
                    <span>Total Costos (ARS):</span>
                    <span>ARS ${formatNumber(totals.totalCosts)}</span>
                  </div>

                  {editData.currency !== "ARS" &&
                    totals.totalCostsForeign > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Incluye conversión de {editData.currency}{" "}
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
                          {item.productName}:
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

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saving || editItems.length === 0}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>

              <Link
                href={`/purchases/${purchase.id}`}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>

        {/* Modal de búsqueda de productos */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Agregar Producto</h3>
                  <button
                    onClick={() => setShowProductSearch(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-4">
                {filteredProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {searchTerm
                      ? "No se encontraron productos"
                      : "Ingresa un término de búsqueda"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.category.name} - Costo: ${product.cost}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
