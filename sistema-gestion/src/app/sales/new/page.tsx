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
  unitPrice?: number; // Precio unitario específico para este componente en el combo/agrupación
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
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [formData, setFormData] = useState({
    paymentMethod: "efectivo",
    discount: 0,
    tax: 0,
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
    setSelectedProductIndex(-1); // Reset selection when search changes
  }, [productSearch, products]);

  // Función para verificar si un producto ya está agregado al combo/agrupación
  const isProductInCombo = (productId: string) => {
    return comboComponents.some((comp) => comp.productId === productId);
  };

  // Función para manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showProductSearch || filteredProducts.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedProductIndex((prev) => {
          const newIndex = prev < filteredProducts.length - 1 ? prev + 1 : 0;
          // Scroll automático
          setTimeout(() => {
            const dropdown = document.querySelector(".dropdown-container");
            const selectedElement = dropdown?.querySelector(
              `[data-index="${newIndex}"]`
            );
            if (selectedElement && dropdown) {
              selectedElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedProductIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : filteredProducts.length - 1;
          // Scroll automático
          setTimeout(() => {
            const dropdown = document.querySelector(".dropdown-container");
            const selectedElement = dropdown?.querySelector(
              `[data-index="${newIndex}"]`
            );
            if (selectedElement && dropdown) {
              selectedElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (
          selectedProductIndex >= 0 &&
          selectedProductIndex < filteredProducts.length
        ) {
          addProductToSale(filteredProducts[selectedProductIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowProductSearch(false);
        setSelectedProductIndex(-1);
        break;
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
      // Limpiar búsqueda después de agregar al combo
      setProductSearch("");
      setShowProductSearch(false);
      setSelectedProductIndex(-1);
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

    // Limpiar búsqueda después de agregar
    setProductSearch("");
    setShowProductSearch(false);
    setSelectedProductIndex(-1);
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

    if (item.itemType === "grouped" && item.components) {
      // Para agrupaciones: el precio total se distribuye proporcionalmente entre componentes
      const totalUnits = item.components.reduce(
        (sum, comp) => sum + comp.quantity,
        0
      );
      const pricePerUnit = newPrice / totalUnits;

      // Actualizar precio unitario de cada componente
      item.components = item.components.map((comp) => ({
        ...comp,
        unitPrice: pricePerUnit,
      }));
    }

    item.unitPrice = newPrice;
    item.totalPrice = item.quantity * item.unitPrice;
    setSaleItems(updatedItems);
  };

  // Nueva función para actualizar precio de componentes individuales en agrupaciones
  const updateComponentPrice = (
    itemIndex: number,
    componentIndex: number,
    newPrice: number
  ) => {
    const updatedItems = [...saleItems];
    const item = updatedItems[itemIndex];

    if (item.itemType === "grouped" && item.components) {
      // Actualizar precio del componente específico
      item.components[componentIndex].unitPrice = newPrice;

      // Recalcular precio total de la agrupación basado en los nuevos precios de componentes
      const newTotalPrice = item.components.reduce(
        (sum, comp) => sum + comp.quantity * (comp.unitPrice || 0),
        0
      );

      item.unitPrice = newTotalPrice;
      item.totalPrice = item.quantity * item.unitPrice;
      setSaleItems(updatedItems);
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(updatedItems);
  };

  // Función helper para calcular el total de unidades en una agrupación
  const getTotalUnitsInGroup = (item: SaleItem): number => {
    if (item.itemType === "grouped" && item.components) {
      return item.components.reduce((sum, comp) => sum + comp.quantity, 0);
    }
    return item.quantity || 1;
  };

  // Función helper para obtener el precio unitario por unidad individual en agrupaciones
  const getUnitPricePerIndividualUnit = (item: SaleItem): number => {
    if (item.itemType === "grouped" && item.components) {
      const totalUnits = getTotalUnitsInGroup(item);
      return totalUnits > 0 ? item.unitPrice / totalUnits : 0;
    }
    return item.unitPrice;
  };

  // Función para actualizar el precio unitario por unidad individual en agrupaciones
  const updateGroupedItemUnitPrice = (index: number, pricePerUnit: number) => {
    const updatedItems = [...saleItems];
    const item = updatedItems[index];

    if (item.itemType === "grouped" && item.components) {
      const totalUnits = getTotalUnitsInGroup(item);
      const newTotalPrice = pricePerUnit * totalUnits;

      // Actualizar precio de agrupación
      item.unitPrice = newTotalPrice;
      item.totalPrice = item.quantity * item.unitPrice;

      // Actualizar precio de cada componente proporcionalmente
      item.components = item.components.map((comp) => ({
        ...comp,
        unitPrice: pricePerUnit,
      }));

      setSaleItems(updatedItems);
    }
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
      // Mostrar mensaje informativo
      // console.log(
      //   `${product.name} ya está en el ${
      //     itemType === "combo" ? "combo" : "pack"
      //   }. Cantidad aumentada a ${updated[existingIndex].quantity}.`
      // );
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

      // Para agrupaciones: la cantidad inicial es 1 agrupación
      // El precio es el precio base de los productos individuales
      const totalUnitsInGroup = comboComponents.reduce(
        (sum, comp) => sum + comp.quantity,
        0
      );

      const newGroupedItem: SaleItem = {
        itemType: "grouped",
        displayName: comboName,
        quantity: 1, // Empezamos vendiendo 1 agrupación
        unitPrice: basePrice * totalUnitsInGroup, // Precio por agrupación completa
        totalPrice: basePrice * totalUnitsInGroup, // Total para 1 agrupación
        components: comboComponents.map((comp) => ({
          ...comp,
          unitPrice: basePrice, // Asignar precio unitario a cada componente
        })),
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

                {/* Ayuda de navegación */}
                {!showComboCreator && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <div className="ml-2">
                        <h4 className="text-sm font-medium text-blue-800">
                          💡 Navegación rápida
                        </h4>
                        <div className="mt-1 text-sm text-blue-700">
                          <p>• Escriba para buscar productos</p>
                          <p>• Use ↑↓ para navegar, Enter para seleccionar</p>
                          <p>• Esc para cerrar la búsqueda</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showComboCreator && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <div className="ml-2">
                        <h4 className="text-sm font-medium text-green-800">
                          🎯 Creando{" "}
                          {itemType === "combo" ? "Combo" : "Agrupación"}
                        </h4>
                        <div className="mt-1 text-sm text-green-700">
                          <p>
                            • Los productos ya agregados aparecen marcados con ✓
                          </p>
                          <p>• Use ↑↓ Enter para agregar rápidamente</p>
                          <p>
                            • Agregue hasta 100+ productos sin usar el mouse
                          </p>
                        </div>
                      </div>
                    </div>
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
                    placeholder={
                      showComboCreator
                        ? `Buscar productos para el ${
                            itemType === "combo" ? "combo" : "pack"
                          }...`
                        : "Buscar por nombre, SKU o código de barras..."
                    }
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductSearch(e.target.value.length > 0);
                      setSelectedProductIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off"
                  />

                  {/* Instrucciones de navegación */}
                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-none">
                      ↑↓ Enter
                    </div>
                  )}

                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto dropdown-container">
                      {filteredProducts.map((product, index) => {
                        const isSelected = index === selectedProductIndex;
                        const isInCombo =
                          showComboCreator && isProductInCombo(product.id);

                        return (
                          <div
                            key={product.id}
                            data-index={index}
                            className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                              isSelected
                                ? "bg-blue-50 border-blue-200"
                                : "hover:bg-gray-50"
                            } ${isInCombo ? "bg-green-50" : ""}`}
                            onClick={() => addProductToSale(product)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{product.name}</p>
                                  {isInCombo && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓ En{" "}
                                      {itemType === "combo" ? "combo" : "pack"}
                                    </span>
                                  )}
                                </div>
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
                        );
                      })}
                    </div>
                  )}

                  {/* Mensaje cuando no hay resultados */}
                  {showProductSearch &&
                    productSearch.length > 0 &&
                    filteredProducts.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                        <p>No se encontraron productos</p>
                        <p className="text-sm">
                          Intente con otro término de búsqueda
                        </p>
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
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                      <Package className="h-4 w-4 mr-2 text-purple-600" />
                                      <span className="font-medium">
                                        {item.displayName}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                      <span className="font-medium text-purple-600">
                                        {getTotalUnitsInGroup(item)} unidades
                                      </span>
                                      <span className="text-gray-500">×</span>
                                      <div className="flex items-center">
                                        <span className="text-gray-500">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={getUnitPricePerIndividualUnit(
                                            item
                                          )}
                                          onChange={(e) =>
                                            updateGroupedItemUnitPrice(
                                              index,
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-20 px-1 py-0.5 text-center border border-gray-300 rounded text-sm ml-1"
                                        />
                                        <span className="text-gray-500 ml-1">
                                          c/u
                                        </span>
                                      </div>
                                      <span className="text-gray-500">=</span>
                                      <span className="font-medium text-gray-900">
                                        $
                                        {(
                                          getTotalUnitsInGroup(item) *
                                          getUnitPricePerIndividualUnit(item)
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Para productos simples y combos: controles completos */}
                              {item.itemType !== "grouped" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItemQuantity(
                                        index,
                                        item.quantity - 1
                                      )
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
                                      updateItemQuantity(
                                        index,
                                        item.quantity + 1
                                      )
                                    }
                                    className="p-1 text-gray-500 hover:text-green-600"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>

                                  <span className="text-sm text-gray-500">
                                    x
                                  </span>

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
                                </>
                              )}

                              {/* Para agrupaciones: solo controles de cantidad de packs */}
                              {item.itemType === "grouped" && (
                                <>
                                  <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateItemQuantity(
                                          index,
                                          item.quantity - 1
                                        )
                                      }
                                      className="p-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>

                                    <span className="text-sm font-medium text-purple-700">
                                      {item.quantity} pack
                                      {item.quantity !== 1 ? "s" : ""}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateItemQuantity(
                                          index,
                                          item.quantity + 1
                                        )
                                      }
                                      className="p-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <span className="w-24 text-right font-medium text-lg">
                                    ${item.totalPrice.toLocaleString()}
                                  </span>
                                </>
                              )}

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
                              <p className="text-xs text-gray-500 mb-3">
                                💡 Puedes ajustar el precio individual de cada
                                componente. El precio total se recalculará
                                automáticamente.
                              </p>
                              <div className="space-y-2">
                                {item.components.map((comp, compIndex) => (
                                  <div
                                    key={compIndex}
                                    className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                                  >
                                    <span className="text-gray-600">
                                      {comp.product.name} x {comp.quantity}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-400">
                                        $
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={
                                          comp.unitPrice ||
                                          (selectedCustomer?.customerType ===
                                          "wholesale"
                                            ? comp.product.wholesalePrice
                                            : comp.product.retailPrice)
                                        }
                                        onChange={(e) =>
                                          updateComponentPrice(
                                            index,
                                            compIndex,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-20 px-2 py-1 text-right border border-gray-300 rounded text-sm"
                                      />
                                      <span className="text-xs text-gray-500">
                                        c/u
                                      </span>
                                    </div>
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
