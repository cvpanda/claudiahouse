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
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import ImagePreview from "@/components/ImagePreview";
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
  imageUrl?: string | null;
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
  id?: string;
  saleItemId?: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice?: number; // Precio unitario específico para este componente en el combo/agrupación
}

interface SaleItem {
  id?: string;
  saleId?: string;

  // Para productos simples
  productId?: string;
  product?: Product;

  // Campos comunes
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  // Para combos, agrupaciones y productos personalizados
  itemType?: "simple" | "combo" | "grouped" | "custom";
  displayName?: string;
  components?: ComboComponent[];

  // Para productos personalizados
  customDescription?: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Estados para la búsqueda mejorada
  const [productSearchDebounced, setProductSearchDebounced] = useState("");
  const [productPagination, setProductPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    pages: 0,
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );

  // Estados específicos para combos
  const [comboProducts, setComboProducts] = useState<Product[]>([]);
  const [comboProductSearch, setComboProductSearch] = useState("");
  const [comboProductSearchDebounced, setComboProductSearchDebounced] =
    useState("");
  const [comboPagination, setComboPagination] = useState({
    page: 1,
    limit: 200, // Aumentamos el límite para mejor rendimiento
    total: 0,
    pages: 0,
  });
  const [isLoadingComboProducts, setIsLoadingComboProducts] = useState(false);
  const [hasMoreComboProducts, setHasMoreComboProducts] = useState(false);
  const [showComboModal, setShowComboModal] = useState(false);
  const [isScrollLoading, setIsScrollLoading] = useState(false);

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
    discountType: "percentage" as "percentage" | "fixed",
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

  // Estados para productos personalizados
  const [showCustomProductModal, setShowCustomProductModal] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductPrice, setCustomProductPrice] = useState(0);
  const [customProductDescription, setCustomProductDescription] = useState("");

  // Estado para confirmación de venta sin cliente
  const [showNoCustomerConfirm, setShowNoCustomerConfirm] = useState(false);

  // Cálculos de totales
  const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount =
    formData.discountType === "percentage"
      ? (subtotal * formData.discount) / 100
      : formData.discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * formData.tax) / 100;
  const shippingCost = formData.shippingCost || 0;
  const total = taxableAmount + taxAmount + shippingCost;

  useEffect(() => {
    fetchCustomers();
    // Cargar productos locales para combos si es necesario
    if (showComboCreator) {
      fetchProductsForCombo();
    }
  }, [showComboCreator]);

  // Función para cargar productos para combos (filtrado local)
  const fetchProductsForCombo = async () => {
    try {
      const response = await fetch("/api/products?limit=1000");
      if (response.ok) {
        const data = await response.json();
        const allProducts = data.data || [];
        setFilteredProducts(allProducts);
      }
    } catch (error) {
      console.error("Error fetching products for combo:", error);
    }
  };

  // Función helper para filtrar productos localmente (para combos)
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

  // Efecto para filtrar productos localmente solo para combos
  useEffect(() => {
    if (showComboCreator) {
      setFilteredProducts(filterProducts(productSearch, filteredProducts));
      setSelectedProductIndex(-1);
    }
  }, [productSearch, showComboCreator]);

  // Función para verificar si un producto ya está agregado al combo/agrupación
  const isProductInCombo = (productId: string) => {
    return comboComponents.some((comp) => comp.productId === productId);
  };

  // Función para manejar navegación con teclado en búsqueda rápida
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

  // Debounce para búsqueda de productos principales
  useEffect(() => {
    const timer = setTimeout(() => {
      setProductSearchDebounced(productSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // Debounce para búsqueda de productos de combos
  useEffect(() => {
    const timer = setTimeout(() => {
      setComboProductSearchDebounced(comboProductSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [comboProductSearch]);

  // Fetch products con búsqueda y paginación
  const fetchProducts = async (search = "", page = 1, append = false) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productPagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newProducts = data.data || [];

        if (append) {
          setProducts((prev) => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }

        setProductPagination({
          page: data.page || 1,
          limit: data.limit || 100,
          total: data.total || 0,
          pages: data.pages || 1,
        });

        setHasMoreProducts((data.page || 1) < (data.pages || 1));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setIsLoadingProducts(false);
  };

  // Efecto para búsqueda con debounce (modal principal)
  useEffect(() => {
    if (showProductModal) {
      fetchProducts(productSearchDebounced, 1, false);
    }
  }, [productSearchDebounced, showProductModal]);

  // Fetch products específico para combos
  const fetchComboProducts = async (search = "", page = 1, append = false) => {
    if (append) {
      setIsScrollLoading(true);
    } else {
      setIsLoadingComboProducts(true);
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: comboPagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newProducts = data.data || [];

        if (append) {
          setComboProducts((prev) => [...prev, ...newProducts]);
        } else {
          setComboProducts(newProducts);
        }

        setComboPagination({
          page: data.page || 1,
          limit: data.limit || 200,
          total: data.total || 0,
          pages: data.pages || 1,
        });

        setHasMoreComboProducts((data.page || 1) < (data.pages || 1));
      }
    } catch (error) {
      console.error("Error fetching combo products:", error);
    }

    if (append) {
      setIsScrollLoading(false);
    } else {
      setIsLoadingComboProducts(false);
    }
  };

  // Efecto para búsqueda de combos con debounce
  useEffect(() => {
    if (showComboModal) {
      fetchComboProducts(comboProductSearchDebounced, 1, false);
    }
  }, [comboProductSearchDebounced, showComboModal]);

  // Función para manejar scroll infinito en el modal de combos
  const handleComboScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollThreshold = 200; // Cargar cuando esté a 200px del final

    if (
      scrollHeight - scrollTop <= clientHeight + scrollThreshold &&
      hasMoreComboProducts &&
      !isLoadingComboProducts &&
      !isScrollLoading
    ) {
      fetchComboProducts(
        comboProductSearchDebounced,
        comboPagination.page + 1,
        true
      );
    }
  };

  // Agregar múltiples productos seleccionados
  const addSelectedProducts = () => {
    const selectedProductList = products.filter((product) =>
      selectedProducts.has(product.id)
    );
    selectedProductList.forEach((product) => {
      addProductToSale(product);
    });
    closeProductModal();
  };

  // Estados para productos seleccionados en combos
  const [selectedComboProducts, setSelectedComboProducts] = useState<
    Set<string>
  >(new Set());

  // Toggle selección de producto en combo
  const toggleComboProductSelection = (productId: string) => {
    const newSelected = new Set(selectedComboProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedComboProducts(newSelected);
  };

  // Función para agregar producto al combo (alias de addProductToCombo)
  const addComboProduct = (product: Product) => {
    addProductToCombo(product);
  };

  // Agregar productos seleccionados de combos
  const addSelectedComboProducts = () => {
    const productsToAdd = comboProducts.filter((product) =>
      selectedComboProducts.has(product.id.toString())
    );

    productsToAdd.forEach((product) => {
      addComboProduct(product);
    });

    closeComboModal();
  };

  // Alternar selección de producto
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Cerrar modal de productos principales
  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProducts(new Set());
    setProductSearch("");
    setProductSearchDebounced("");
    setProducts([]);
    setProductPagination({
      page: 1,
      limit: 100,
      total: 0,
      pages: 0,
    });
    setHasMoreProducts(false);
  };

  // Cerrar modal de productos de combos
  const closeComboModal = () => {
    setShowComboModal(false);
    setSelectedComboProducts(new Set());
    setComboProductSearch("");
    setComboProductSearchDebounced("");
    setComboProducts([]);
    setComboPagination({
      page: 1,
      limit: 200,
      total: 0,
      pages: 0,
    });
    setHasMoreComboProducts(false);
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
        (product.stock === 0 ||
          existingItem.quantity < existingItem.product.stock)
      ) {
        existingItem.quantity += 1;
        existingItem.totalPrice =
          existingItem.quantity * existingItem.unitPrice;
        setSaleItems(updatedItems);
      } else {
        alert("No hay suficiente stock disponible");
      }
    } else {
      // Agregar nuevo producto (permitir incluso si stock es 0)
      const unitPrice =
        selectedCustomer?.customerType === "wholesale"
          ? product.wholesalePrice
          : product.retailPrice;

      const newItem: SaleItem = {
        id: `temp-${product.id}-${Date.now()}`,
        saleId: "",
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

  // Funciones para productos personalizados
  const openCustomProductModal = () => {
    setShowCustomProductModal(true);
  };

  const closeCustomProductModal = () => {
    setShowCustomProductModal(false);
    setCustomProductName("");
    setCustomProductPrice(0);
    setCustomProductDescription("");
  };

  const addCustomProduct = () => {
    if (!customProductName.trim()) {
      alert("Debe ingresar un nombre para el producto");
      return;
    }

    if (customProductPrice <= 0) {
      alert("Debe ingresar un precio válido para el producto");
      return;
    }

    const customItem: SaleItem = {
      id: `temp-custom-${Date.now()}`, // ID temporal para el frontend
      saleId: "", // Se asignará cuando se guarde la venta
      productId: undefined,
      product: undefined,
      quantity: 1,
      unitPrice: customProductPrice,
      totalPrice: customProductPrice,
      itemType: "custom",
      displayName: customProductName,
      customDescription: customProductDescription.trim() || undefined,
    };

    setSaleItems([...saleItems, customItem]);
    closeCustomProductModal();
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
        id: `temp-grouped-${Date.now()}`,
        saleId: "",
        itemType: "grouped",
        displayName: comboName,
        quantity: 1, // Empezamos vendiendo 1 agrupación
        unitPrice: basePrice * totalUnitsInGroup, // Precio por agrupación completa
        totalPrice: basePrice * totalUnitsInGroup, // Total para 1 agrupación
        components: comboComponents.map((comp) => ({
          ...comp,
          id: `temp-comp-${comp.productId}-${Date.now()}`,
          saleItemId: "",
          unitPrice: basePrice, // Asignar precio unitario a cada componente
        })),
      };

      setSaleItems([...saleItems, newGroupedItem]);
    } else {
      // Para combos: lógica existente
      const totalPrice = comboPrice;

      const newComboItem: SaleItem = {
        id: `temp-combo-${Date.now()}`,
        saleId: "",
        itemType: "combo",
        displayName: comboName,
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        components: comboComponents.map((comp) => ({
          ...comp,
          id: `temp-comp-${comp.productId}-${Date.now()}`,
          saleItemId: "",
        })),
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

    // Si no hay cliente seleccionado, mostrar confirmación
    if (!selectedCustomer) {
      setShowNoCustomerConfirm(true);
      return;
    }

    // Si hay cliente o ya se confirmó, proceder con la venta
    await submitSale();
  };

  const submitSale = async () => {
    setLoading(true);

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        paymentMethod: formData.paymentMethod,
        discount: formData.discount,
        discountType: formData.discountType,
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
          customDescription: item.customDescription || null,
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
      setShowNoCustomerConfirm(false);
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Productos
                    </button>
                    <button
                      type="button"
                      onClick={openCustomProductModal}
                      className="flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        />
                      </svg>
                      Producto Personalizado
                    </button>
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

                {/* Botón para agregar productos al combo/agrupación */}
                {showComboCreator && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setShowComboModal(true);
                        fetchComboProducts("", 1, false); // Cargar productos iniciales sin filtro
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Agregar Productos al{" "}
                      {itemType === "combo" ? "Combo" : "Pack"}
                    </button>
                  </div>
                )}

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

                                {/* Renderizado para productos personalizados */}
                                {item.itemType === "custom" && (
                                  <>
                                    <p className="font-medium flex items-center">
                                      <svg
                                        className="h-4 w-4 mr-1 text-orange-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                                        />
                                      </svg>
                                      {item.displayName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Producto personalizado
                                      {item.customDescription && (
                                        <span className="text-gray-400">
                                          {" "}
                                          • {item.customDescription}
                                        </span>
                                      )}
                                    </p>
                                  </>
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
                      Descuento
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value as
                              | "percentage"
                              | "fixed",
                            discount: 0, // Resetear descuento al cambiar tipo
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        max={
                          formData.discountType === "percentage"
                            ? "100"
                            : subtotal.toString()
                        }
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder={
                          formData.discountType === "percentage"
                            ? "0-100"
                            : "Monto"
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
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
                      <span>
                        Descuento{" "}
                        {formData.discountType === "percentage"
                          ? `(-${formData.discount}%)`
                          : "(monto fijo)"}
                        :
                      </span>
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

        {/* Product Selection Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Seleccionar Productos
                    </h3>
                    {selectedProducts.size > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        {selectedProducts.size} producto
                        {selectedProducts.size !== 1 ? "s" : ""} seleccionado
                        {selectedProducts.size !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProducts.size > 0 && (
                      <>
                        <button
                          onClick={addSelectedProducts}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar {selectedProducts.size} producto
                          {selectedProducts.size !== 1 ? "s" : ""}
                        </button>
                        <button
                          onClick={() => setSelectedProducts(new Set())}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Limpiar selección
                        </button>
                      </>
                    )}
                    <button
                      onClick={closeProductModal}
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
                      placeholder="Buscar productos por nombre, SKU o código de barras..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {isLoadingProducts && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      Buscando productos...
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto max-h-96 p-6">
                <div className="grid grid-cols-1 gap-4">
                  {products.map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    const isAlreadyAdded = saleItems.some(
                      (item) => item.productId === product.id
                    );
                    const addedItem = saleItems.find(
                      (item) => item.productId === product.id
                    );

                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : isAlreadyAdded
                            ? "border-gray-300 bg-gray-50"
                            : "border-gray-200 hover:bg-gray-50"
                        } ${isAlreadyAdded ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Checkbox */}
                          <div className="flex items-center pt-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleProductSelection(product.id)
                              }
                              disabled={isAlreadyAdded}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          {/* Image - Más grande */}
                          <div className="flex-shrink-0">
                            {product.imageUrl ? (
                              <ImagePreview
                                url={product.imageUrl}
                                alt={product.name}
                                className="w-20 h-20 rounded-md object-cover border"
                                showInstructions={false}
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-base">
                                  {product.name}
                                </h4>
                                <div className="mt-1 space-y-1">
                                  <p className="text-sm text-gray-500">
                                    SKU: {product.sku || "N/A"} | Categoría:{" "}
                                    {product.category?.name || "Sin categoría"}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span
                                      className={
                                        product.stock === 0
                                          ? "text-red-600 font-medium"
                                          : ""
                                      }
                                    >
                                      Stock: {product.stock} {product.unit}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      Mayorista: $
                                      {product.wholesalePrice.toLocaleString(
                                        "es-AR"
                                      )}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      Minorista: $
                                      {product.retailPrice.toLocaleString(
                                        "es-AR"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {product.imageUrl && (
                                      <span className="inline-block text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        Con imagen
                                      </span>
                                    )}
                                    {product.stock === 0 && (
                                      <span className="inline-block text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                        Sin stock
                                      </span>
                                    )}
                                    {isAlreadyAdded && (
                                      <span className="inline-block text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        ✓ Agregado (Cant: {addedItem?.quantity})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quick add button */}
                              {!isAlreadyAdded && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addProductToSale(product);
                                  }}
                                  className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                >
                                  Agregar individual
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {products.length === 0 && !isLoadingProducts && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {productSearchDebounced
                        ? "No se encontraron productos con esa búsqueda"
                        : "Escribe para buscar productos"}
                    </p>
                  </div>
                )}

                {/* Load More Button */}
                {hasMoreProducts && !isLoadingProducts && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() =>
                        fetchProducts(
                          productSearchDebounced,
                          productPagination.page + 1,
                          true
                        )
                      }
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Cargar más productos
                    </button>
                  </div>
                )}

                {/* Loading more indicator */}
                {isLoadingProducts && productPagination.page > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      Cargando más productos...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Combo Product Selection Modal */}
        {showComboModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Seleccionar Productos para{" "}
                      {itemType === "combo" ? "Combo" : "Pack"}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      {selectedComboProducts.size > 0 && (
                        <p className="text-sm text-blue-600">
                          {selectedComboProducts.size} producto
                          {selectedComboProducts.size !== 1 ? "s" : ""}{" "}
                          seleccionado
                          {selectedComboProducts.size !== 1 ? "s" : ""}
                        </p>
                      )}
                      {comboPagination.total > 0 && (
                        <p className="text-sm text-gray-500">
                          {comboProducts.length} de {comboPagination.total}{" "}
                          productos mostrados
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedComboProducts.size > 0 && (
                      <>
                        <button
                          onClick={addSelectedComboProducts}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Agregar {selectedComboProducts.size} producto
                          {selectedComboProducts.size !== 1 ? "s" : ""}
                        </button>
                        <button
                          onClick={() => setSelectedComboProducts(new Set())}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Limpiar selección
                        </button>
                      </>
                    )}
                    <button
                      onClick={closeComboModal}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                {/* Search input */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar productos por nombre, SKU o código de barras..."
                      value={comboProductSearch}
                      onChange={(e) => setComboProductSearch(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                      autoFocus
                    />
                    {comboProductSearch && (
                      <button
                        onClick={() => setComboProductSearch("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  {hasMoreComboProducts && (
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      Scroll ↓ para más
                    </div>
                  )}
                </div>
              </div>

              {/* Products grid - Scrollable container */}
              <div
                className="flex-1 overflow-y-auto"
                onScroll={handleComboScroll}
                style={{ minHeight: "400px", maxHeight: "calc(90vh - 200px)" }}
              >
                <div className="p-6">
                  {isLoadingComboProducts && comboPagination.page === 1 ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin h-8 w-8 border-2 border-gray-400 border-t-blue-600 rounded-full"></div>
                        <p className="text-sm text-gray-500">
                          Cargando productos...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {comboProducts.map((product) => {
                          const isSelected = selectedComboProducts.has(
                            product.id.toString()
                          );
                          const isInCombo = comboComponents.some(
                            (comp) => comp.productId === product.id
                          );

                          return (
                            <div
                              key={product.id}
                              className={`relative border rounded-lg p-4 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : isInCombo
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                toggleComboProductSelection(
                                  product.id.toString()
                                )
                              }
                            >
                              {/* Checkbox */}
                              <div className="absolute top-2 left-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleComboProductSelection(
                                      product.id.toString()
                                    )
                                  }
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>

                              {/* Product image */}
                              <div className="flex justify-center mb-3 mt-4">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      target.nextElementSibling?.classList.remove(
                                        "hidden"
                                      );
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-20 h-20 bg-gray-200 rounded flex items-center justify-center ${
                                    product.imageUrl ? "hidden" : ""
                                  }`}
                                >
                                  <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              </div>

                              <div className="text-center">
                                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2">
                                  SKU: {product.sku || "N/A"}
                                </p>

                                {/* Stock info */}
                                <div className="mb-2">
                                  {product.stock === 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Sin stock
                                    </span>
                                  ) : product.stock <= 5 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Poco stock: {product.stock}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-600">
                                      Stock: {product.stock} {product.unit}
                                    </span>
                                  )}
                                </div>

                                {/* Price */}
                                <div className="text-center">
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

                                {/* Already in combo indicator */}
                                {isInCombo && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓ En{" "}
                                      {itemType === "combo" ? "combo" : "pack"}
                                    </span>
                                  </div>
                                )}

                                {/* Category */}
                                {product.category && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {product.category.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Empty state */}
                      {comboProducts.length === 0 &&
                        !isLoadingComboProducts && (
                          <div className="text-center py-12">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m14 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m14 0H6m0 0l.01.01M6 20l.01.01"
                              />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No se encontraron productos
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Intente con otro término de búsqueda.
                            </p>
                          </div>
                        )}

                      {/* Scroll Loading Indicator - Solo se muestra cuando hay scroll infinito */}
                      {isScrollLoading && (
                        <div className="flex justify-center py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-blue-600 rounded-full"></div>
                            Cargando más productos...
                          </div>
                        </div>
                      )}

                      {/* End of results indicator */}
                      {!hasMoreComboProducts &&
                        comboProducts.length > 0 &&
                        !isLoadingComboProducts && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                              {comboPagination.total > comboProducts.length
                                ? `Mostrando ${comboProducts.length} de ${comboPagination.total} productos`
                                : `Todos los productos mostrados (${comboProducts.length})`}
                            </p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Product Modal */}
        {showCustomProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg
                      className="h-6 w-6 mr-2 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                    Producto Personalizado
                  </h2>
                  <button
                    onClick={closeCustomProductModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Agrega un producto único que no está en tu inventario
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="ej: Mochila única, Producto especial..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customProductPrice}
                      onChange={(e) =>
                        setCustomProductPrice(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={customProductDescription}
                    onChange={(e) =>
                      setCustomProductDescription(e.target.value)
                    }
                    placeholder="Detalles adicionales sobre el producto..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-orange-400 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="ml-2">
                      <h4 className="text-sm font-medium text-orange-800">
                        ℹ️ Información
                      </h4>
                      <p className="mt-1 text-sm text-orange-700">
                        Este producto no se guardará en tu inventario. Es ideal
                        para artículos únicos o circunstanciales.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={closeCustomProductModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCustomProduct}
                  disabled={
                    !customProductName.trim() || customProductPrice <= 0
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Agregar Producto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación sin Cliente */}
        {showNoCustomerConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-12 w-12 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ¿Crear venta sin cliente?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    No has seleccionado un cliente para esta venta. ¿Estás
                    seguro que deseas continuar sin asignar un cliente?
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <svg
                        className="h-5 w-5 text-blue-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-blue-700">
                          <strong>Tip:</strong> Asignar un cliente te permite
                          hacer seguimiento de ventas, enviar el remito por
                          email y gestionar mejor tus clientes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowNoCustomerConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Volver y Asignar Cliente
                </button>
                <button
                  onClick={submitSale}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sí, Continuar sin Cliente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
