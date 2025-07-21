"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Calculator,
  User,
  Trash2,
  Package,
} from "lucide-react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  wholesalePrice: number;
  retailPrice: number;
  unit: string;
  category?: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  customerType: string;
  email?: string;
  phone?: string;
}

interface SaleItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: "cash",
    discount: 0,
    tax: 21,
    shippingCost: 0,
    shippingType: "",
    notes: "",
  });

  // Cálculos de totales
  const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotal * formData.discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * formData.tax) / 100;
  const shippingCost = formData.shippingCost || 0;
  const total = taxableAmount + taxAmount + shippingCost;

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const filterProducts = (searchTerm: string, productList: Product[]) => {
    if (!searchTerm.trim()) return [];

    const search = searchTerm.toLowerCase().trim();

    return productList.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(search);
      const skuMatch = product.sku?.toLowerCase().includes(search) || false;
      const barcodeMatch =
        product.barcode?.toLowerCase().includes(search) || false;

      return nameMatch || skuMatch || barcodeMatch;
    });
  };

  useEffect(() => {
    const filtered = filterProducts(productSearch, products);
    setFilteredProducts(filtered);
  }, [productSearch, products]);

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

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const addProductToSale = (product: Product) => {
    const existingIndex = saleItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      updateItemQuantity(existingIndex, saleItems[existingIndex].quantity + 1);
    } else {
      const unitPrice =
        selectedCustomer?.customerType === "wholesale"
          ? product.wholesalePrice
          : product.retailPrice;

      const newItem: SaleItem = {
        productId: product.id,
        product: product,
        quantity: 1,
        unitPrice: unitPrice,
        totalPrice: unitPrice,
      };

      setSaleItems([...saleItems, newItem]);
    }

    setProductSearch("");
    setShowProductSearch(false);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(index);
      return;
    }

    const updatedItems = [...saleItems];
    const item = updatedItems[index];

    if (newQuantity > item.product.stock) {
      alert(`Solo hay ${item.product.stock} unidades disponibles`);
      return;
    }

    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      totalPrice: item.unitPrice * newQuantity,
    };

    setSaleItems(updatedItems);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;

    const updatedItems = [...saleItems];
    const item = updatedItems[index];

    updatedItems[index] = {
      ...item,
      unitPrice: newPrice,
      totalPrice: newPrice * item.quantity,
    };

    setSaleItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleItems.length === 0) {
      alert("Debe agregar al menos un producto a la venta");
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        paymentMethod: formData.paymentMethod,
        discount: formData.discount,
        tax: formData.tax,
        shippingCost: formData.shippingCost,
        shippingType: formData.shippingType,
        notes: formData.notes,
        subtotal: subtotal,
        total: total,
        items: saleItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        alert("Venta registrada correctamente");
        router.push("/sales");
      } else {
        const error = await response.json();
        alert(error.error || "Error al registrar la venta");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Error al registrar la venta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/sales"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 mr-2 text-blue-600" />
              Nueva Venta
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Customer Selection - Mobile First */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Cliente
            </h3>
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const customer = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(customer || null);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            >
              <option value="">Sin cliente registrado</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (
                  {customer.customerType === "retail"
                    ? "Minorista"
                    : "Mayorista"}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* Product Search - Mobile Optimized */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Buscar Productos
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o código..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductSearch(e.target.value.length > 0);
                }}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
              />

              {/* Product Search Results */}
              {showProductSearch && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => addProductToSale(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            SKU: {product.sku || "N/A"} | Stock: {product.stock}{" "}
                            {product.unit}
                          </p>
                          {product.category && (
                            <p className="text-xs text-gray-400">
                              {product.category.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          {selectedCustomer?.customerType === "wholesale" ? (
                            <>
                              <p className="font-medium text-green-600 text-sm">
                                ${product.wholesalePrice.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Mayorista</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-blue-600 text-sm">
                                ${product.retailPrice.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Minorista</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sale Items - Mobile Optimized */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Items de la Venta ({saleItems.length})
            </h3>

            {saleItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay productos agregados</p>
                <p className="text-xs">
                  Busque y seleccione productos para agregar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {saleItems.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.product.sku || "N/A"} | Stock:{" "}
                            {item.product.stock} {item.product.unit}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <label className="text-xs text-gray-500">
                            Cantidad
                          </label>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity - 1)
                              }
                              className="p-1 text-gray-500 hover:text-red-600"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-12 px-1 py-1 text-center text-sm border border-gray-300 rounded"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity + 1)
                              }
                              className="p-1 text-gray-500 hover:text-green-600"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">
                            Precio
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItemPrice(
                                index,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>

                        <div className="text-right">
                          <label className="text-xs text-gray-500">Total</label>
                          <p className="font-medium text-sm">
                            ${item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          SKU: {item.product.sku || "N/A"} | Stock:{" "}
                          {item.product.stock} {item.product.unit}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateItemQuantity(index, item.quantity - 1)
                          }
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              index,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            updateItemQuantity(index, item.quantity + 1)
                          }
                          className="p-1 text-gray-500 hover:text-green-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <span className="text-sm text-gray-500">x</span>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItemPrice(
                              index,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                        />

                        <span className="w-20 text-right font-medium">
                          ${item.totalPrice.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment and Totals */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold">
                Pago y Totales
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                className="text-sm text-blue-600 hover:text-blue-800 sm:hidden"
              >
                {showPaymentOptions ? "Ocultar" : "Opciones"}
              </button>
            </div>

            {/* Always show on desktop, toggleable on mobile */}
            <div
              className={`space-y-3 ${
                showPaymentOptions ? "block" : "hidden sm:block"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                  placeholder="Notas adicionales sobre la venta..."
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descuento ({formData.discount}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>IVA ({formData.tax}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Link
              href="/sales"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || saleItems.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Registrar Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
