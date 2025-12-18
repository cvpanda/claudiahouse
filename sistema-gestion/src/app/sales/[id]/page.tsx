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
  Printer,
  Eye,
  Download,
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
  productId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
  itemType?: string;
  displayName?: string;
  components?: Array<{
    id: string;
    productId: string;
    quantity: number;
    product?: Product;
  }>;
}

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  shippingType?: string;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  const [editForm, setEditForm] = useState({
    paymentMethod: "",
    discount: 0,
    discountType: "percentage" as "percentage" | "fixed",
    tax: 0,
    shippingCost: 0,
    shippingType: "",
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
      fetchCustomers();
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
          discountType: data.data.discountType || "percentage",
          tax: data.data.tax || 0,
          shippingCost: data.data.shippingCost || 0,
          shippingType: data.data.shippingType || "",
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
        discountType: (sale as any).discountType || "percentage",
        tax: sale.tax || 0,
        shippingCost: sale.shippingCost || 0,
        shippingType: sale.shippingType || "",
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
    const discountAmount =
      editForm.discountType === "percentage"
        ? subtotal * (editForm.discount / 100)
        : editForm.discount;
    const taxAmount = (subtotal - discountAmount) * (editForm.tax / 100);
    const shippingCost = editForm.shippingCost || 0;
    const total = subtotal - discountAmount + taxAmount + shippingCost;

    return { subtotal, discountAmount, taxAmount, shippingCost, total };
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
      (item) =>
        item.productId === newProduct.productId && item.itemType === "simple"
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
      itemType: "simple",
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
          itemType: item.itemType,
          displayName: item.displayName,
          components: item.components,
        })),
      };

      // Debug: Log the data being sent
      // console.log("Sending update data:", updateData);

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

  const handlePrintRemito = () => {
    if (!sale) return;

    // Create a new window for printing with better dimensions
    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900,scrollbars=yes"
    );
    if (!printWindow) {
      alert(
        "No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador."
      );
      return;
    }

    // Generate the remito HTML
    const remitoHTML = generateRemitoHTML(sale);

    printWindow.document.write(remitoHTML);
    printWindow.document.close();

    // Wait for content to load, then print automatically
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after print dialog
        setTimeout(() => {
          printWindow.close();
        }, 100);
      }, 500);
    };

    printWindow.focus();
  };

  const handlePreviewRemito = () => {
    if (!sale) return;

    // Create a new window for preview with better dimensions
    const previewWindow = window.open(
      "",
      "_blank",
      "width=900,height=1200,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"
    );
    if (!previewWindow) {
      alert(
        "No se pudo abrir la ventana de vista previa. Verifique que no esté bloqueada por el navegador."
      );
      return;
    }

    // Generate the remito HTML
    const remitoHTML = generateRemitoHTML(sale);

    // Add preview-specific styles and controls
    const previewHTML = remitoHTML
      .replace(
        "</head>",
        `
      <style>
        .preview-controls {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
        }
        .preview-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 8px;
          font-size: 14px;
        }
        .preview-btn:hover {
          background: #2563eb;
        }
        .preview-btn.secondary {
          background: #6b7280;
        }
        .preview-btn.secondary:hover {
          background: #4b5563;
        }
        @media print {
          .preview-controls { display: none !important; }
        }
        /* Asegurar que el contenido no se corte en vista previa */
        body {
          min-height: 100vh;
          overflow-y: auto;
        }
        .page-container {
          min-height: auto;
          padding-bottom: 50px;
        }
      </style>
      </head>`
      )
      .replace(
        "<body>",
        `<body>
      <div class="preview-controls">
        <button class="preview-btn" onclick="window.print()">🖨️ Imprimir</button>
        <button class="preview-btn secondary" onclick="window.close()">✕ Cerrar</button>
      </div>`
      );

    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
    previewWindow.focus();
  };

  const generateRemitoHTML = (sale: Sale): string => {
    const currentDate = new Date().toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const currentTime = new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const productRows = sale.saleItems
      .map((item) => {
        const itemData = item as any;
        const isSimple = itemData.itemType === "simple";
        const isCustom = itemData.itemType === "custom";
        const displayName = isSimple
          ? item.product?.name
          : isCustom
          ? itemData.displayName
          : itemData.displayName ||
            `${
              itemData.itemType === "combo" ? "Combo" : "Agrupación"
            } sin nombre`;

        const unit = isSimple
          ? item.product?.unit || "unidad"
          : isCustom
          ? "unidad"
          : itemData.itemType === "combo"
          ? "combo"
          : itemData.components
          ? `${itemData.components.reduce(
              (total: number, comp: any) => total + comp.quantity,
              0
            )} unidades`
          : "unidades";

        // Generar componentes solo para combos
        const componentsHTML =
          itemData.itemType === "combo" && itemData.components
            ? `<div style="font-size: 11px; color: #666; margin-top: 4px; padding-left: 10px;">
                 <strong>Componentes:</strong><br>
                 ${itemData.components
                   .map(
                     (comp: any) => `• ${comp.product.name} x${comp.quantity}`
                   )
                   .join("<br>")}
               </div>`
            : "";

        // Calcular precio unitario por unidad individual para agrupaciones
        const unitPriceToShow =
          itemData.itemType === "grouped" && itemData.components
            ? item.unitPrice /
              itemData.components.reduce(
                (total: number, comp: any) => total + comp.quantity,
                0
              )
            : item.unitPrice;

        return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          <div style="font-weight: 500;">${displayName}</div>
          ${
            isSimple && item.product?.sku
              ? `<div style="font-size: 12px; color: #666;">SKU: ${item.product.sku}</div>`
              : !isSimple && !isCustom
              ? `<div style="font-size: 12px; color: #666;">Tipo: ${
                  itemData.itemType === "combo" ? "Combo" : "Agrupación"
                }</div>`
              : ""
          }
          ${componentsHTML}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${
          isSimple ||
          itemData.itemType === "combo" ||
          itemData.itemType === "custom"
            ? `${item.quantity} ${unit}`
            : unit // Para agrupaciones, solo mostrar las unidades totales
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPrice(
          unitPriceToShow
        )}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: 500;">${formatPrice(
          item.totalPrice
        )}</td>
      </tr>
    `;
      })
      .join("");

    const subtotalProducts = sale.saleItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Calcular totales paso a paso para mostrar claramente
    const discountAmount = sale.discount || 0;
    const taxAmount = sale.tax || 0;
    const shippingAmount = sale.shippingCost || 0;

    // Determinar el método de pago
    const getPaymentMethodDisplay = (method: string) => {
      const methods: { [key: string]: string } = {
        efectivo: "Efectivo",
        tarjeta: "Tarjeta",
        transferencia: "Transferencia",
        cheque: "Cheque",
        cuenta_corriente: "Cuenta Corriente",
      };
      return methods[method] || method;
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Remito - Venta ${sale.saleNumber}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
            color: #333;
        }
        .page-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 25px;
        }
        .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #1e40af;
            letter-spacing: 2px;
        }
        .document-title {
            font-size: 24px;
            margin-bottom: 15px;
            color: #374151;
            font-weight: 600;
        }
        .sale-info {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #6b7280;
        }
        .info-section {
            margin-bottom: 35px;
            background: #f8fafc;
            padding: 20px;
            border-left: 4px solid #3b82f6;
        }
        .section-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 12px;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: 600;
            color: #374151;
        }
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
            border: 1px solid #e5e7eb;
        }
        .products-table th {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
        }
        .products-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .products-table tbody tr:hover {
            background-color: #f9fafb;
        }
        .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }
        .totals {
            width: 350px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        .totals-header {
            background: #f3f4f6;
            padding: 12px 20px;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 0.5px;
        }
        .totals-body {
            padding: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .total-row.subtotal {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .total-row.final {
            border-top: 2px solid #2563eb;
            padding-top: 15px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 18px;
            color: #1e40af;
        }
        .payment-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 30px;
        }
        .payment-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            text-align: center;
            border-top: 1px solid #9ca3af;
            padding-top: 10px;
            font-size: 12px;
            color: #6b7280;
        }
        @media print {
            body { 
                margin: 0; 
                padding: 15px; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .page-container { 
                max-width: none; 
                height: auto;
                min-height: auto;
            }
            .products-table tbody tr:hover { 
                background-color: transparent !important; 
            }
            .signature-section { 
                page-break-inside: avoid; 
                margin-top: 30px;
                margin-bottom: 30px;
            }
            .totals-container { 
                page-break-inside: avoid; 
                margin-bottom: 30px;
            }
            .info-section { 
                page-break-inside: avoid; 
            }
            .total-row.final {
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            .footer {
                page-break-inside: avoid;
                margin-top: 30px;
            }
            .products-table {
                page-break-inside: auto;
            }
            .products-table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            /* Evitar que el contenido se corte */
            * {
                box-sizing: border-box;
            }
            html, body {
                height: auto !important;
                overflow: visible !important;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="header">
            <div class="company-name">CLAUDIA HOUSE</div>
            <div class="document-title">REMITO DE VENTA</div>
            <div class="sale-info">
                <span><strong>Nº:</strong> ${sale.saleNumber}</span>
                <span><strong>Fecha:</strong> ${currentDate}</span>
                <span><strong>Hora:</strong> ${currentTime}</span>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Información del Cliente</div>
            ${
              sale.customer
                ? `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Nombre:</span> ${
                          sale.customer.name
                        }
                    </div>
                    ${
                      sale.customer.phone
                        ? `<div class="info-item"><span class="info-label">Teléfono:</span> ${sale.customer.phone}</div>`
                        : ""
                    }
                    ${
                      sale.customer.email
                        ? `<div class="info-item"><span class="info-label">Email:</span> ${sale.customer.email}</div>`
                        : ""
                    }
                </div>
                `
                : `
                <div class="info-item">Cliente sin registrar</div>
                `
            }
        </div>

        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Producto</th>
                    <th style="text-align: center; width: 15%;">Cantidad</th>
                    <th style="text-align: right; width: 17.5%;">Precio Unit.</th>
                    <th style="text-align: right; width: 17.5%;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${productRows}
            </tbody>
        </table>

        ${
          sale.paymentMethod
            ? `
        <div class="payment-info">
            <div class="payment-title">Método de Pago</div>
            <div>${getPaymentMethodDisplay(sale.paymentMethod)}</div>
        </div>
        `
            : ""
        }

        <div class="totals-container">
            <div class="totals">
                <div class="totals-header">Resumen de Totales</div>
                <div class="totals-body">
                    <div class="total-row subtotal">
                        <span>Subtotal productos:</span>
                        <span>${formatPrice(subtotalProducts)}</span>
                    </div>
                    ${
                      discountAmount > 0
                        ? `
                    <div class="total-row">
                        <span>Descuento:</span>
                        <span style="color: #dc2626;">-${formatPrice(
                          discountAmount
                        )}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      taxAmount > 0
                        ? `
                    <div class="total-row">
                        <span>Impuestos:</span>
                        <span>${formatPrice(taxAmount)}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      shippingAmount > 0
                        ? `
                    <div class="total-row">
                        <span>Envío (${
                          sale.shippingType || "Sin especificar"
                        }):</span>
                        <span style="color: #2563eb;">${formatPrice(
                          shippingAmount
                        )}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="total-row final">
                        <span>TOTAL A PAGAR:</span>
                        <span>${formatPrice(sale.total)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div>Firma del Cliente</div>
            </div>
            <div class="signature-box">
                <div>Firma del Vendedor</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>¡Gracias por su compra!</strong></p>
            <p>Remito generado el ${new Date().toLocaleDateString(
              "es-AR"
            )} a las ${new Date().toLocaleTimeString("es-AR")}</p>
            <p style="margin-top: 10px; font-size: 10px;">
                Este documento no tiene valor fiscal • Conserve este remito como comprobante de entrega
            </p>
        </div>
    </div>
</body>
</html>
    `;
  };

  const handleExportPDF = async () => {
    if (!sale) return;

    try {
      // Importar jsPDF dinámicamente
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Crear un elemento temporal con el HTML del remito
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateRemitoHTML(sale);
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "800px";
      tempDiv.style.background = "white";
      document.body.appendChild(tempDiv);

      // Esperar un momento para que se renderice
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Obtener el contenido del remito (sin los controles de preview)
      const remitoContent = tempDiv.querySelector(".page-container");
      if (!remitoContent) {
        throw new Error("No se pudo encontrar el contenido del remito");
      }

      // Convertir a canvas
      const canvas = await html2canvas(remitoContent as HTMLElement, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 800,
        height: remitoContent.scrollHeight,
      });

      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);

      // Crear el PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calcular dimensiones para ajustar al A4
      const imgWidth = 190; // Ancho en mm (A4 tiene 210mm, dejamos 10mm de margen a cada lado)
      const pageHeight = 297; // Alto de página A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Margen superior

      // Agregar la imagen al PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20; // Restar margen superior e inferior

      // Si el contenido es más alto que una página, agregar páginas adicionales
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10; // Nuevo position para la siguiente página
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Descargar el PDF con nombre que incluye el cliente
      const customerName = sale.customer?.name
        ? sale.customer.name.replace(/[^a-zA-Z0-9]/g, "_")
        : "SinCliente";
      pdf.save(`remito-${sale.saleNumber}-${customerName}.pdf`);

      alert("Remito exportado exitosamente como PDF.");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert(
        "Error al exportar el remito como PDF. Intente con el botón de Vista Previa e imprima desde allí usando Ctrl+P."
      );
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
                  onClick={handlePreviewRemito}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </button>
                <button
                  onClick={handlePrintRemito}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Remito
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </button>
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

        {/* Remito Options Info */}
        {sale.status !== "cancelled" && !editing && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Receipt className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Opciones de Remito
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Vista Previa:</strong> Ver el remito antes de
                      imprimir
                    </li>
                    <li>
                      <strong>Imprimir Remito:</strong> Imprimir directamente
                      desde el navegador
                    </li>
                    <li>
                      <strong>Exportar PDF:</strong> Descargar el remito como
                      archivo PDF
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-600">
                    💡 El remito incluye solo nombre, teléfono y email del
                    cliente (si están disponibles)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        {!editing && sale && sale.status !== "cancelled" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-600 mb-1">
              📄 <strong>Opciones de Remito:</strong>
              <kbd className="bg-blue-100 px-1 rounded mx-1">
                Vista Previa
              </kbd>{" "}
              para revisar •
              <kbd className="bg-blue-100 px-1 rounded mx-1">Imprimir</kbd> para
              imprimir directo •
              <kbd className="bg-blue-100 px-1 rounded mx-1">Exportar</kbd> para
              descargar HTML
            </p>
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
              {editing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Cliente (opcional)
                  </label>
                  <select
                    value={selectedCustomerId || ""}
                    onChange={(e) =>
                      setSelectedCustomerId(e.target.value || null)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Sin cliente</option>
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
                  {selectedCustomerId &&
                    (() => {
                      const selectedCustomer = customers.find(
                        (c) => c.id === selectedCustomerId
                      );
                      return (
                        selectedCustomer && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <p>
                              <strong>Tipo:</strong>{" "}
                              {selectedCustomer.customerType === "retail"
                                ? "Minorista"
                                : "Mayorista"}
                            </p>
                            {selectedCustomer.phone && (
                              <p>
                                <strong>Teléfono:</strong>{" "}
                                {selectedCustomer.phone}
                              </p>
                            )}
                            {selectedCustomer.email && (
                              <p>
                                <strong>Email:</strong> {selectedCustomer.email}
                              </p>
                            )}
                          </div>
                        )
                      );
                    })()}
                </div>
              ) : sale.customer ? (
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
                    Descuento
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={editForm.discountType}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
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
                      step="0.1"
                      min="0"
                      max={
                        editForm.discountType === "percentage"
                          ? "100"
                          : calculateTotals().subtotal.toString()
                      }
                      value={editForm.discount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const maxValue =
                          editForm.discountType === "percentage"
                            ? 100
                            : calculateTotals().subtotal;
                        setEditForm({
                          ...editForm,
                          discount: Math.min(maxValue, Math.max(0, value)),
                        });
                      }}
                      placeholder={
                        editForm.discountType === "percentage"
                          ? "0-100"
                          : "Monto"
                      }
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
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

              {/* Shipping Information */}
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Información de Envío
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Envío
                    </label>
                    <select
                      value={editForm.shippingType}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          shippingType: e.target.value,
                        })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Sin envío</option>
                      <option value="retiro_local">Retiro en local</option>
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
                      value={editForm.shippingCost}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          shippingCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
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
                          {(item as any).itemType === "simple"
                            ? item.product?.name
                            : (item as any).itemType === "custom"
                            ? (item as any).displayName
                            : (item as any).displayName ||
                              `${
                                (item as any).itemType === "combo"
                                  ? "Combo"
                                  : "Agrupación"
                              } sin nombre`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(item as any).itemType === "simple"
                            ? `SKU: ${item.product?.sku || "N/A"}`
                            : (item as any).itemType === "custom"
                            ? "Tipo: Producto Personalizado"
                            : `Tipo: ${
                                (item as any).itemType === "combo"
                                  ? "Combo"
                                  : "Agrupación"
                              }`}
                        </div>
                        {/* Mostrar componentes solo para combos */}
                        {(item as any).itemType === "combo" &&
                          (item as any).components && (
                            <div className="mt-3 text-sm text-gray-600">
                              <div className="bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                                <div className="font-medium text-gray-700 mb-1">
                                  Componentes:
                                </div>
                                <div className="space-y-1">
                                  {(item as any).components.map(
                                    (comp: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center text-sm"
                                      >
                                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                        <span className="font-medium">
                                          {comp.product.name}
                                        </span>
                                        <span className="ml-2 text-gray-500">
                                          x{comp.quantity}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
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
                            {(item as any).itemType === "simple"
                              ? item.product?.unit || "unidad"
                              : (item as any).itemType === "custom"
                              ? "unidad"
                              : (item as any).itemType === "combo"
                              ? "combo"
                              : (item as any).components
                              ? `unidades (${(item as any).components.reduce(
                                  (total: number, comp: any) =>
                                    total + comp.quantity,
                                  0
                                )} por pack)`
                              : "unidades"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">
                          {(item as any).itemType === "simple" ||
                          (item as any).itemType === "combo" ||
                          (item as any).itemType === "custom" ? (
                            <>
                              {item.quantity}{" "}
                              {(item as any).itemType === "simple"
                                ? item.product?.unit || "unidad"
                                : (item as any).itemType === "custom"
                                ? "unidad"
                                : "combo"}
                            </>
                          ) : // Para agrupaciones, mostrar solo las unidades totales
                          (item as any).components ? (
                            `${(item as any).components.reduce(
                              (total: number, comp: any) =>
                                total + comp.quantity,
                              0
                            )} unidades`
                          ) : (
                            "unidades"
                          )}
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
                          {formatPrice(
                            (item as any).itemType === "grouped" &&
                              (item as any).components
                              ? item.unitPrice /
                                  (item as any).components.reduce(
                                    (total: number, comp: any) =>
                                      total + comp.quantity,
                                    0
                                  )
                              : item.unitPrice
                          )}
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
                    {editForm.shippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Envío ({editForm.shippingType || "Sin especificar"}):
                        </span>
                        <span className="font-medium text-blue-600">
                          {formatPrice(calculateTotals().shippingCost)}
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
                    {sale.shippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Envío ({sale.shippingType || "Sin especificar"}):
                        </span>
                        <span className="font-medium text-blue-600">
                          {formatPrice(sale.shippingCost)}
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
