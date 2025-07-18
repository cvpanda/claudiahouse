"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Search, AlertCircle } from "lucide-react";

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

interface EditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase;
  onSave: (updatedPurchase: Purchase) => void;
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

export default function EditPurchaseModal({
  isOpen,
  onClose,
  purchase,
  onSave,
}: EditPurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Estados del formulario
  const [editData, setEditData] = useState({
    freightCost: purchase.freightCost,
    customsCost: purchase.customsCost,
    taxCost: purchase.taxCost,
    insuranceCost: purchase.insuranceCost,
    otherCosts: purchase.otherCosts,
    exchangeRate: purchase.exchangeRate || 1,
    currency: purchase.currency || "ARS",
  });

  const [editItems, setEditItems] = useState<EditItem[]>(
    purchase.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPriceForeign: item.unitPriceForeign || undefined,
      unitPricePesos: item.unitPricePesos,
    }))
  );

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

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

  const calculateSubtotal = () => {
    return editItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPricePesos) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const calculateTotalCosts = () => {
    return (
      Number(editData.freightCost) +
      Number(editData.customsCost) +
      Number(editData.taxCost) +
      Number(editData.insuranceCost) +
      Number(editData.otherCosts)
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalCosts();
  };

  const calculateItemsWithDistributedCosts = () => {
    const subtotal = calculateSubtotal();
    const totalCosts = calculateTotalCosts();

    return editItems.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPricePesos) || 0;
      const itemSubtotal = quantity * unitPrice;

      const distributedCosts =
        subtotal > 0 ? (itemSubtotal / subtotal) * totalCosts : 0;
      const finalUnitCost = unitPrice + distributedCosts / quantity;

      return {
        ...item,
        distributedCosts,
        finalUnitCost,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editItems.length === 0) {
      setError("Debe agregar al menos un producto a la compra");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = {
        ...editData,
        items: editItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPriceForeign: item.unitPriceForeign
            ? Number(item.unitPriceForeign)
            : null,
          unitPricePesos: Number(item.unitPricePesos),
        })),
      };

      const response = await fetch(`/api/purchases/${purchase.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la compra");
      }

      const updatedPurchase = await response.json();
      onSave(updatedPurchase);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Compra #{purchase.purchaseNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Productos</h3>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Producto
                </button>
              </div>

              {editItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay productos en esta compra. Agregue al menos uno.
                </div>
              )}

              {editItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Producto
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {item.productName}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Precio Unitario
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPricePesos}
                        onChange={(e) =>
                          updateItem(index, "unitPricePesos", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-600">
                      Subtotal:{" "}
                      {formatCurrency(
                        Number(item.quantity) * Number(item.unitPricePesos)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Costos adicionales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Costos Adicionales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Costo de Flete
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.freightCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        freightCost: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Costo de Aduana
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.customsCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customsCost: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Impuestos
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.taxCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        taxCost: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seguro
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.insuranceCost}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        insuranceCost: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Otros Costos
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.otherCosts}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        otherCosts: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Resumen
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal productos:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total costos adicionales:</span>
                  <span>{formatCurrency(calculateTotalCosts())}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Costos finales por producto */}
              {editItems.length > 0 && calculateTotalCosts() > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Costos Finales (con distribución):
                  </h4>
                  <div className="space-y-1">
                    {calculateItemsWithDistributedCosts().map((item, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600 truncate mr-2">
                          {item.productName}:
                        </span>
                        <div className="text-right">
                          <div className="text-green-600 font-medium">
                            ${item.finalUnitCost.toFixed(2)}/u
                          </div>
                          <div className="text-gray-500">
                            (dist: +$
                            {(
                              item.distributedCosts / Number(item.quantity)
                            ).toFixed(2)}
                            )
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || editItems.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* Modal de búsqueda de productos */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium">Buscar Producto</h3>
                <button
                  onClick={() => setShowProductSearch(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre del producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {searchTerm
                        ? "No se encontraron productos"
                        : "Escriba para buscar productos"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="w-full text-left p-3 rounded-md hover:bg-gray-50 border border-gray-200"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.category.name} - Costo:{" "}
                            {formatCurrency(product.cost)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
