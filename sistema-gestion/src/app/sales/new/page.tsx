"use client";

import { useState, useEffect } from "react";
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
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import ComboCreator from "@/components/ComboCreator";
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

interface ComboComponent {
  productId: string;
  product: Product;
  quantity: number;
}

interface SaleItem {
  // Para productos simples
  productId?: string;
  product?: Product;

  // Campos comunes
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  // Para combos y agrupaciones
  itemType?: "simple" | "combo" | "grouped";
  displayName?: string;
  components?: ComboComponent[];
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
  const [formData, setFormData] = useState({
    paymentMethod: "efectivo",
    discount: 0,
    tax: 21,
    shippingCost: 0,
    shippingType: "",
    notes: "",
  });

  // Estados para combos y agrupaciones
  const [itemType, setItemType] = useState<"simple" | "combo" | "grouped">(
    "simple"
  );
  const [showComboCreator, setShowComboCreator] = useState(false);
  const [comboName, setComboName] = useState("");
  const [comboPrice, setComboPrice] = useState(0);
  const [comboComponents, setComboComponents] = useState<ComboComponent[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  // Función helper para filtrar productos de forma segura
  const filterProducts = (searchTerm: string, productList: Product[]) => {
    if (!searchTerm.trim()) return [];

    const search = searchTerm.toLowerCase().trim();

    return productList.filter((product) => {
      // Buscar en el nombre (siempre existe)
      const nameMatch = product.name.toLowerCase().includes(search);

      // Buscar en SKU (puede ser null/undefined)
      const skuMatch = product.sku?.toLowerCase().includes(search) || false;

      // Buscar en código de barras (puede ser null/undefined)
      const barcodeMatch =
        product.barcode?.toLowerCase().includes(search) || false;

      return nameMatch || skuMatch || barcodeMatch;
    });
  };

  useEffect(() => {
    setFilteredProducts(filterProducts(productSearch, products));
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
    // Si estamos creando un combo, agregar al combo en lugar de la venta
    if (showComboCreator) {
      addProductToCombo(product);
      return;
    }

    const existingItemIndex = saleItems.findIndex(
      (item) =>
        item.productId === product.id &&
        item.itemType !== "combo" &&
        item.itemType !== "grouped"
    );

    if (existingItemIndex >= 0) {
      // Si el producto ya existe, incrementar cantidad
      const updatedItems = [...saleItems];
      const existingItem = updatedItems[existingItemIndex];
      if (
        existingItem.product &&
        existingItem.quantity < existingItem.product.stock
      ) {
        existingItem.quantity += 1;
        existingItem.totalPrice =
          existingItem.quantity * existingItem.unitPrice;
        setSaleItems(updatedItems);
      } else {
        alert("No hay suficiente stock disponible");
      }
    } else {
      // Agregar nuevo producto
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
        itemType: "simple",
      };
      setSaleItems([...saleItems, newItem]);
    }

    setProductSearch("");
    setShowProductSearch(false);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...saleItems];
    const item = updatedItems[index];

    // Solo verificar stock para productos simples
    if (
      item.itemType === "simple" &&
      item.product &&
      newQuantity > item.product.stock
    ) {
      alert("No hay suficiente stock disponible");
      return;
    }

    item.quantity = newQuantity;
    item.totalPrice = item.quantity * item.unitPrice;
    setSaleItems(updatedItems);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    const updatedItems = [...saleItems];
    const item = updatedItems[index];
    item.unitPrice = newPrice;
    item.totalPrice = item.quantity * item.unitPrice;
    setSaleItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(updatedItems);
  };

  // Funciones para manejar combos y agrupaciones
  const addProductToCombo = (product: Product) => {
    const existingIndex = comboComponents.findIndex(
      (comp) => comp.productId === product.id
    );

    if (existingIndex >= 0) {
      const updated = [...comboComponents];
      updated[existingIndex].quantity += 1;
      setComboComponents(updated);
    } else {
      setComboComponents([
        ...comboComponents,
        {
          productId: product.id,
          product: product,
          quantity: 1,
        },
      ]);
    }
    setProductSearch("");
    setShowProductSearch(false);
  };

  const updateComboComponentQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeComboComponent(index);
      return;
    }

    const updated = [...comboComponents];
    updated[index].quantity = newQuantity;
    setComboComponents(updated);
  };

  const removeComboComponent = (index: number) => {
    const updated = comboComponents.filter((_, i) => i !== index);
    setComboComponents(updated);
  };

  const addComboToSale = () => {
    if (!comboName.trim() || comboComponents.length === 0) {
      alert("Complete el nombre y agregue productos al combo");
      return;
    }

    if (itemType === "combo" && comboPrice <= 0) {
      alert("Ingrese un precio válido para el combo");
      return;
    }

    if (itemType === "grouped") {
      // Para agrupaciones: verificar que todos los productos tengan el mismo precio
      const basePrice =
        selectedCustomer?.customerType === "wholesale"
          ? comboComponents[0].product.wholesalePrice
          : comboComponents[0].product.retailPrice;

      const allSamePrice = comboComponents.every((comp) => {
        const price =
          selectedCustomer?.customerType === "wholesale"
            ? comp.product.wholesalePrice
            : comp.product.retailPrice;
        return price === basePrice;
      });

      if (!allSamePrice) {
        alert(
          "Todos los productos en una agrupación deben tener el mismo precio"
        );
        return;
      }

      // Para agrupaciones: la cantidad es la suma de todas las cantidades
      const totalQuantity = comboComponents.reduce(
        (sum, comp) => sum + comp.quantity,
        0
      );

      const newGroupedItem: SaleItem = {
        itemType: "grouped",
        displayName: comboName,
        quantity: totalQuantity,
        unitPrice: basePrice,
        totalPrice: totalQuantity * basePrice,
        components: comboComponents,
      };

      setSaleItems([...saleItems, newGroupedItem]);
    } else {
      // Para combos: lógica existente
      const totalPrice = comboPrice;

      const newComboItem: SaleItem = {
        itemType: "combo",
        displayName: comboName,
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        components: comboComponents,
      };

      setSaleItems([...saleItems, newComboItem]);
    }

    // Limpiar el formulario
    setComboName("");
    setComboPrice(0);
    setComboComponents([]);
    setShowComboCreator(false);
    setItemType("simple");
  };

  const cancelComboCreator = () => {
    setComboName("");
    setComboPrice(0);
    setComboComponents([]);
    setShowComboCreator(false);
    setItemType("simple");
  };

  const toggleItemExpansion = (index: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(index)) {
      newExpandedItems.delete(index);
    } else {
      newExpandedItems.add(index);
    }
    setExpandedItems(newExpandedItems);
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
          productId: item.productId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          itemType: item.itemType || "simple",
          displayName: item.displayName || null,
          components: item.components || null,
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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/sales"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-7 w-7 mr-2 text-blue-600" />
              Nueva Venta
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel izquierdo - Selección de productos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Buscar Productos
                </h3>

                {/* Botones para crear combos y agrupaciones */}
                {!showComboCreator && (
                  <div className="flex space-x-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setItemType("combo");
                        setShowComboCreator(true);
                      }}
                      className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      Crear Combo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemType("grouped");
                        setShowComboCreator(true);
                      }}
                      className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Crear Agrupación
                    </button>
                  </div>
                )}

                {/* Mostrar el creador de combos si está activo */}
                {showComboCreator && (
                  <div className="mb-4">
                    <ComboCreator
                      itemType={itemType === "combo" ? "combo" : "grouped"}
                      selectedCustomer={selectedCustomer}
                      components={comboComponents}
                      onUpdateComponentQuantity={updateComboComponentQuantity}
                      onRemoveComponent={removeComboComponent}
                      onAddToSale={addComboToSale}
                      onCancel={cancelComboCreator}
                      comboName={comboName}
                      setComboName={setComboName}
                      comboPrice={comboPrice}
                      setComboPrice={setComboPrice}
                    />
                  </div>
                )}

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductSearch(e.target.value.length > 0);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => addProductToSale(product)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                SKU: {product.sku || "N/A"} | Stock:{" "}
                                {product.stock} {product.unit}
                              </p>
                              {product.category && (
                                <p className="text-xs text-gray-400">
                                  {product.category.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {selectedCustomer?.customerType ===
                              "wholesale" ? (
                                <>
                                  <p className="font-medium text-green-600">
                                    ${product.wholesalePrice.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Mayorista
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-blue-600">
                                    ${product.retailPrice.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Minorista
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de items en la venta */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Items de la Venta ({saleItems.length})
                  </h4>

                  {saleItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No hay productos agregados</p>
                      <p className="text-sm">
                        Busque y seleccione productos para agregar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {saleItems.map((item, index) => (
                        <div key={`${item.productId || "combo"}-${index}`}>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 flex items-center">
                              {/* Botón de expandir para combos y agrupaciones */}
                              {(item.itemType === "combo" ||
                                item.itemType === "grouped") && (
                                <button
                                  type="button"
                                  onClick={() => toggleItemExpansion(index)}
                                  className="p-1 text-gray-500 hover:text-gray-700 mr-2"
                                >
                                  {expandedItems.has(index) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              )}

                              <div className="flex-1">
                                {/* Renderizado para productos simples */}
                                {item.itemType === "simple" && item.product && (
                                  <>
                                    <p className="font-medium">
                                      {item.product.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      SKU: {item.product.sku || "N/A"} | Stock:{" "}
                                      {item.product.stock} {item.product.unit}
                                    </p>
                                  </>
                                )}

                                {/* Renderizado para combos */}
                                {item.itemType === "combo" && (
                                  <>
                                    <p className="font-medium flex items-center">
                                      <Layers className="h-4 w-4 mr-1 text-green-600" />
                                      {item.displayName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Combo con {item.components?.length || 0}{" "}
                                      productos
                                    </p>
                                  </>
                                )}

                                {/* Renderizado para agrupaciones */}
                                {item.itemType === "grouped" && (
                                  <>
                                    <p className="font-medium flex items-center">
                                      <Package className="h-4 w-4 mr-1 text-purple-600" />
                                      {item.displayName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Pack con {item.components?.length || 0}{" "}
                                      productos
                                    </p>
                                  </>
                                )}
                              </div>
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
                                max={
                                  item.itemType === "simple" && item.product
                                    ? item.product.stock
                                    : undefined
                                }
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
                                className="p-1 text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Detalles expandidos para combos y agrupaciones */}
                          {expandedItems.has(index) && item.components && (
                            <div className="ml-6 mt-2 bg-white rounded-lg border border-gray-200 p-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Contiene:
                              </p>
                              <div className="space-y-1">
                                {item.components.map((comp, compIndex) => (
                                  <div
                                    key={compIndex}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-600">
                                      {comp.product.name} x {comp.quantity}
                                    </span>
                                    <span className="text-gray-500">
                                      $
                                      {selectedCustomer?.customerType ===
                                      "wholesale"
                                        ? comp.product.wholesalePrice
                                        : comp.product.retailPrice}{" "}
                                      c/u
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel derecho - Detalles de la venta */}
            <div className="space-y-6">
              {/* Cliente */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </h3>

                <select
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const customer = customers.find(
                      (c) => c.id === e.target.value
                    );
                    setSelectedCustomer(customer || null);
                    // Actualizar precios cuando cambia el tipo de cliente - solo para productos simples
                    if (customer && saleItems.length > 0) {
                      const updatedItems = saleItems.map((item) => {
                        // Solo actualizar precios para productos simples
                        if (item.itemType === "simple" && item.product) {
                          return {
                            ...item,
                            unitPrice:
                              customer.customerType === "wholesale"
                                ? item.product.wholesalePrice
                                : item.product.retailPrice,
                            totalPrice:
                              item.quantity *
                              (customer.customerType === "wholesale"
                                ? item.product.wholesalePrice
                                : item.product.retailPrice),
                          };
                        }
                        // Para combos y agrupaciones, mantener el precio actual
                        return item;
                      });
                      setSaleItems(updatedItems);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Cliente sin registrar</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} (
                      {customer.customerType === "wholesale"
                        ? "Mayorista"
                        : "Minorista"}
                      )
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <p>
                      <strong>Tipo:</strong>{" "}
                      {selectedCustomer.customerType === "wholesale"
                        ? "Mayorista"
                        : "Minorista"}
                    </p>
                    {selectedCustomer.email && (
                      <p>
                        <strong>Email:</strong> {selectedCustomer.email}
                      </p>
                    )}
                    {selectedCustomer.phone && (
                      <p>
                        <strong>Teléfono:</strong> {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Detalles de pago */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Detalles de Pago</h3>

                <div className="space-y-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="cuenta_corriente">Cuenta Corriente</option>
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
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tax: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Envío
                    </label>
                    <select
                      value={formData.shippingType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sin envío</option>
                      <option value="retiro_tienda">Retiro en tienda</option>
                      <option value="envio_domicilio">Envío a domicilio</option>
                      <option value="correo_argentino">Correo Argentino</option>
                      <option value="oca">OCA</option>
                      <option value="andreani">Andreani</option>
                      <option value="mercado_envios">Mercado Envíos</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo de Envío ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shippingCost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Resumen</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {formData.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento (-{formData.discount}%):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {formData.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>IVA ({formData.tax}%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {formData.shippingCost > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>
                        Envío ({formData.shippingType || "Sin especificar"}):
                      </span>
                      <span>${shippingCost.toFixed(2)}</span>
                    </div>
                  )}

                  <hr className="my-2" />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || saleItems.length === 0}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    "Procesando..."
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Registrar Venta
                    </>
                  )}
                </button>

                <Link
                  href="/sales"
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
