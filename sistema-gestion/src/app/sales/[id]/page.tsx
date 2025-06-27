"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  User,
  Calendar,
  CreditCard,
  Package,
  Receipt,
  AlertTriangle,
  Check,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  customerType: string;
  phone?: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  stock: number;
  retailPrice: number;
  wholesalePrice: number;
}

interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
}

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  saleItems: SaleItem[];
}

export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [productToRemove, setProductToRemove] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    paymentMethod: "",
    discount: 0,
    tax: 0,
    notes: "",
    status: "",
  });

  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
  });

  useEffect(() => {
    if (params.id) {
      fetchSale();
      fetchProducts();
    }
  }, [params.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not editing inputs
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).tagName === "SELECT"
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "e":
            e.preventDefault();
            if (sale && sale.status !== "cancelled" && !editing) {
              handleEdit();
            }
            break;
          case "s":
            e.preventDefault();
            if (editing) {
              handleSave();
            }
            break;
          case "Escape":
            e.preventDefault();
            if (editing) {
              handleCancelEdit();
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [sale, editing]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSale = async () => {
    try {
      const response = await fetch(`/api/sales/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSale(data.data);
        setEditedItems(data.data.saleItems || []);
        setEditForm({
          paymentMethod: normalizePaymentMethod(data.data.paymentMethod || ""),
          discount: data.data.discount || 0,
          tax: data.data.tax || 0,
          notes: data.data.notes || "",
          status: data.data.status || "",
        });
      } else {
        console.error("Error fetching sale");
        router.push("/sales");
      }
    } catch (error) {
      console.error("Error fetching sale:", error);
      router.push("/sales");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (sale) {
      setEditForm({
        paymentMethod: normalizePaymentMethod(sale.paymentMethod || ""),
        discount: sale.discount || 0,
        tax: sale.tax || 0,
        notes: sale.notes || "",
        status: sale.status || "",
      });
      setEditedItems(sale.saleItems || []);
    }
    setEditing(false);
    setEditingProduct(null);
  };

  const calculateTotals = () => {
    const subtotal = editedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = subtotal * (editForm.discount / 100);
    const taxAmount = (subtotal - discountAmount) * (editForm.tax / 100);
    const total = subtotal - discountAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleProductQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setEditedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const handleProductPriceChange = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;

    setEditedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              unitPrice: newPrice,
              totalPrice: item.quantity * newPrice,
            }
          : item
      )
    );
  };

  const handleRemoveProduct = (itemId: string) => {
    setProductToRemove(itemId);
  };

  const confirmRemoveProduct = () => {
    if (productToRemove) {
      setEditedItems((prev) =>
        prev.filter((item) => item.id !== productToRemove)
      );
      setProductToRemove(null);
      setSuccessMessage("Producto eliminado de la venta");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.productId || newProduct.quantity < 1) return;

    const product = availableProducts.find(
      (p) => p.id === newProduct.productId
    );
    if (!product) return;

    // Check if product already exists in the sale
    const existingItem = editedItems.find(
      (item) => item.productId === newProduct.productId
    );
    if (existingItem) {
      setError(
        "Este producto ya está en la venta. Puede editar la cantidad desde la tabla."
      );
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Check stock availability
    if (newProduct.quantity > product.stock) {
      setError(
        `Stock insuficiente. Disponible: ${product.stock} ${product.unit}`
      );
      setTimeout(() => setError(null), 5000);
      return;
    }

    const newItem: SaleItem = {
      id: `temp-${Date.now()}`,
      productId: newProduct.productId,
      quantity: newProduct.quantity,
      unitPrice: newProduct.unitPrice || product.retailPrice,
      totalPrice:
        newProduct.quantity * (newProduct.unitPrice || product.retailPrice),
      product: product,
    };

    setEditedItems((prev) => [...prev, newItem]);
    setNewProduct({ productId: "", quantity: 1, unitPrice: 0 });
    setShowAddProductDialog(false);
    setSuccessMessage("Producto agregado exitosamente");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSave = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setShowConfirmDialog(false);
    setError(null);
    setSuccessMessage(null);

    try {
      const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

      const updateData = {
        ...editForm,
        paymentMethod: editForm.paymentMethod, // Ensure it's already normalized
        items: editedItems.map((item) => ({
          id: item.id.startsWith("temp-") ? undefined : item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      // Debug: Log the data being sent
      console.log("Sending update data:", updateData);

      const response = await fetch(`/api/sales/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setSale(data.data);
        setEditedItems(data.data.saleItems || []);
        setEditing(false);
        setEditingProduct(null);
        setSuccessMessage("Venta actualizada exitosamente");
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        setError(`Error: ${errorData.error || "Error al actualizar la venta"}`);
        if (errorData.details) {
          console.error("Validation details:", errorData.details);
        }
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      setError("Error al actualizar la venta. Por favor, intente nuevamente.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSale = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSale = async () => {
    setSaving(true);
    setShowCancelDialog(false);
    setError(null);

    try {
      const response = await fetch(`/api/sales/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Venta cancelada exitosamente");
        setTimeout(() => {
          router.push("/sales");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(`Error: ${errorData.error || "Error al cancelar la venta"}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error cancelling sale:", error);
      setError("Error al cancelar la venta. Por favor, intente nuevamente.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "efectivo":
        return "Efectivo";
      case "tarjeta":
      case "card": // Handle legacy English values
        return "Tarjeta";
      case "transferencia":
      case "transfer": // Handle legacy English values
        return "Transferencia";
      case "cheque":
      case "check": // Handle legacy English values
        return "Cheque";
      case "cuenta_corriente":
      case "current_account": // Handle legacy English values
        return "Cuenta Corriente";
      default:
        return method;
    }
  };

  // Helper function to convert English payment methods to Spanish
  const normalizePaymentMethod = (method: string) => {
    switch (method) {
      case "card":
        return "tarjeta";
      case "transfer":
        return "transferencia";
      case "check":
        return "cheque";
      case "current_account":
        return "cuenta_corriente";
      case "cash":
        return "efectivo";
      default:
        return method; // Already in Spanish or unknown value
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!sale) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Venta no encontrada
          </h3>
          <div className="mt-6">
            <Link
              href="/sales"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver a Ventas
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/sales"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a Ventas
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {sale.status !== "cancelled" && !editing && (
              <>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={handleCancelSale}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Venta
                </button>
              </>
            )}

            {editing && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={() =>
                    console.log("Check browser console for more details")
                  }
                  className="text-xs text-red-600 underline mt-1"
                >
                  Ver detalles en consola
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        {!editing && sale && sale.status !== "cancelled" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-600">
              💡 Atajos de teclado:{" "}
              <kbd className="bg-blue-100 px-1 rounded">Ctrl+E</kbd> para editar
            </p>
          </div>
        )}

        {editing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-600">
              💡 Atajos de teclado:{" "}
              <kbd className="bg-yellow-100 px-1 rounded">Ctrl+S</kbd> para
              guardar • <kbd className="bg-yellow-100 px-1 rounded">Esc</kbd>{" "}
              para cancelar
            </p>
          </div>
        )}

        {/* Sale Info */}
        <div className="bg-white shadow-sm rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Venta #{sale.saleNumber}
              </h1>
              <p className="text-sm text-gray-600">
                Creada el {formatDate(sale.createdAt)}
              </p>
              {sale.updatedAt !== sale.createdAt && (
                <p className="text-xs text-gray-500">
                  Última actualización: {formatDate(sale.updatedAt)}
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                sale.status
              )}`}
            >
              {getStatusLabel(sale.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Cliente
              </h3>
              {sale.customer ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium text-gray-900">
                    {sale.customer.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {sale.customer.customerType === "retail"
                      ? "Minorista"
                      : "Mayorista"}
                  </p>
                  {sale.customer.phone && (
                    <p className="text-sm text-gray-600">
                      {sale.customer.phone}
                    </p>
                  )}
                  {sale.customer.email && (
                    <p className="text-sm text-gray-600">
                      {sale.customer.email}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-600">Cliente sin registrar</p>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Información de Pago
              </h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                {editing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="cuenta_corriente">Cuenta Corriente</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-gray-900">
                    <span className="font-medium">Método:</span>{" "}
                    {getPaymentMethodLabel(sale.paymentMethod)}
                  </p>
                )}

                <p className="text-gray-900">
                  <span className="font-medium">Total:</span>{" "}
                  {formatPrice(sale.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Update */}
          {editing && sale.status !== "cancelled" && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estado de la Venta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editForm.discount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setEditForm({
                        ...editForm,
                        discount: Math.min(100, Math.max(0, value)),
                      });
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impuestos (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editForm.tax}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setEditForm({
                        ...editForm,
                        tax: Math.min(100, Math.max(0, value)),
                      });
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notas</h3>
            {editing ? (
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                placeholder="Agregar notas sobre la venta..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-900">{sale.notes || "Sin notas"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="bg-white shadow-sm rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Productos ({editing ? editedItems.length : sale.saleItems.length})
            </h3>
            {editing && (
              <button
                onClick={() => setShowAddProductDialog(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Producto
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  {editing && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(editing ? editedItems : sale.saleItems).map((item) => (
                  <tr key={item.id} className={editing ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.product.sku || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleProductQuantityChange(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="p-1 text-gray-400 hover:text-gray-600"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleProductQuantityChange(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 text-center rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            onClick={() =>
                              handleProductQuantityChange(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-500">
                            {item.product.unit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">
                          {item.quantity} {item.product.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleProductPriceChange(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {formatPrice(item.unitPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </td>
                    {editing && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveProduct(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                {editing ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatPrice(calculateTotals().subtotal)}
                      </span>
                    </div>
                    {editForm.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Descuento ({editForm.discount}%):
                        </span>
                        <span className="font-medium text-red-600">
                          -{formatPrice(calculateTotals().discountAmount)}
                        </span>
                      </div>
                    )}
                    {editForm.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Impuestos ({editForm.tax}%):
                        </span>
                        <span className="font-medium">
                          {formatPrice(calculateTotals().taxAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatPrice(calculateTotals().total)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatPrice(sale.subtotal)}
                      </span>
                    </div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento:</span>
                        <span className="font-medium text-red-600">
                          -{formatPrice(sale.discount)}
                        </span>
                      </div>
                    )}
                    {sale.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Impuestos:</span>
                        <span className="font-medium">
                          {formatPrice(sale.tax)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatPrice(sale.total)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Product Dialog */}
        {showAddProductDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Agregar Producto
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Producto
                    </label>
                    <select
                      value={newProduct.productId}
                      onChange={(e) => {
                        const selectedProduct = availableProducts.find(
                          (p) => p.id === e.target.value
                        );
                        setNewProduct({
                          ...newProduct,
                          productId: e.target.value,
                          unitPrice: selectedProduct?.retailPrice || 0,
                        });
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar producto...</option>
                      {availableProducts
                        .filter(
                          (product) =>
                            !editedItems.some(
                              (item) => item.productId === product.id
                            )
                        )
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatPrice(product.retailPrice)}{" "}
                            (Stock: {product.stock})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={
                        newProduct.productId
                          ? availableProducts.find(
                              (p) => p.id === newProduct.productId
                            )?.stock || 999
                          : 999
                      }
                      value={newProduct.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const selectedProduct = availableProducts.find(
                          (p) => p.id === newProduct.productId
                        );
                        const maxStock = selectedProduct?.stock || 999;
                        setNewProduct({
                          ...newProduct,
                          quantity: Math.min(maxStock, Math.max(1, value)),
                        });
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {newProduct.productId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Stock disponible:{" "}
                        {availableProducts.find(
                          (p) => p.id === newProduct.productId
                        )?.stock || 0}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Unitario
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProduct.unitPrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {newProduct.productId && newProduct.quantity > 0 && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        Total:{" "}
                        {formatPrice(
                          newProduct.quantity * newProduct.unitPrice
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddProductDialog(false);
                      setNewProduct({
                        productId: "",
                        quantity: 1,
                        unitPrice: 0,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddProduct}
                    disabled={!newProduct.productId || newProduct.quantity < 1}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialogs */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Confirmar Cambios
                </h3>
                <div className="text-left mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">
                    Resumen de cambios:
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>• Productos: {editedItems.length} items</p>
                    <p>
                      • Método de pago:{" "}
                      {getPaymentMethodLabel(editForm.paymentMethod)}
                    </p>
                    <p>• Estado: {getStatusLabel(editForm.status)}</p>
                    <p>• Total: {formatPrice(calculateTotals().total)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  ¿Está seguro que desea guardar los cambios realizados en esta
                  venta? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Sí, Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Product Confirmation */}
        {productToRemove && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <Trash2 className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Eliminar Producto
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  ¿Está seguro que desea eliminar este producto de la venta?
                </p>
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    onClick={() => setProductToRemove(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmRemoveProduct}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCancelDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Cancelar Venta
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  ¿Está seguro que desea cancelar esta venta? Esta acción no se
                  puede deshacer y marcará la venta como cancelada.
                </p>
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    No, Mantener
                  </button>
                  <button
                    onClick={confirmCancelSale}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Sí, Cancelar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
