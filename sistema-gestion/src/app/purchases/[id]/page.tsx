"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  X,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Truck,
  Calculator,
  FileText,
  AlertCircle,
} from "lucide-react";

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
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
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
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_TRANSIT: "En tránsito",
  RECEIVED: "Recibido",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  RECEIVED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const currencies = [
  { code: "USD", name: "Dólar estadounidense" },
  { code: "EUR", name: "Euro" },
  { code: "ARS", name: "Peso argentino" },
];

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPurchase();
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
      console.log("Purchase data:", data);
      console.log(
        "First item distributedCostPesos:",
        data.items?.[0]?.distributedCostPesos
      );
      setPurchase(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!purchase || !newStatus) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/purchases/${purchase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      const updatedPurchase = await response.json();
      setPurchase(updatedPurchase);
      setShowStatusModal(false);
      setNewStatus("");
    } catch (err) {
      alert(
        "Error al actualizar el estado: " +
          (err instanceof Error ? err.message : "Error desconocido")
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompletePurchase = async () => {
    if (!purchase) return;

    if (
      confirm(
        "¿Está seguro de que desea completar esta compra? Esto actualizará el stock y costos de los productos."
      )
    ) {
      try {
        const response = await fetch(`/api/purchases/${purchase.id}/complete`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Error al completar la compra");
        }

        const updatedPurchase = await response.json();
        setPurchase(updatedPurchase);
        alert("Compra completada exitosamente. Stock y costos actualizados.");
      } catch (err) {
        alert(
          "Error al completar la compra: " +
            (err instanceof Error ? err.message : "Error desconocido")
        );
      }
    }
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "$0,00";
    }
    return amount.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });
  };

  const formatForeignCurrency = (
    amount: number | undefined | null,
    decimals: number = 2
  ) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "N/A";
    }
    return amount.toLocaleString("es-AR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando compra...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !purchase) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error || "Compra no encontrada"}</p>
            <Link
              href="/purchases"
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a compras
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/purchases"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Compra #{purchase.purchaseNumber}
              </h1>
              <p className="text-gray-600">
                Compra creada el {formatDate(purchase.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[purchase.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[purchase.status] || purchase.status}
            </span>
            {purchase.status !== "COMPLETED" &&
              purchase.status !== "CANCELLED" && (
                <button
                  onClick={() => {
                    setNewStatus(purchase.status);
                    setShowStatusModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Cambiar Estado
                </button>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Información del Proveedor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <p className="mt-1 text-gray-900">
                    {purchase.supplier?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    País
                  </label>
                  <p className="mt-1 text-gray-900">
                    {purchase.supplier?.country || "N/A"}
                  </p>
                </div>
                {purchase.supplier?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <a
                      href={`mailto:${purchase.supplier.email}`}
                      className="mt-1 text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {purchase.supplier.email}
                    </a>
                  </div>
                )}
                {purchase.supplier?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {purchase.supplier.phone}
                    </p>
                  </div>
                )}
                {purchase.supplier?.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sitio web
                    </label>
                    <a
                      href={purchase.supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {purchase.supplier.website}
                    </a>
                  </div>
                )}
                {purchase.supplier?.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {purchase.supplier.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Import Details */}
            {purchase.type === "IMPORT" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Detalles de Importación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Moneda
                    </label>
                    <p className="mt-1 text-gray-900">
                      {purchase.currency || "N/A"} -{" "}
                      {currencies.find((c) => c.code === purchase.currency)
                        ?.name || "Desconocida"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Cambio
                    </label>
                    <p className="mt-1 text-gray-900">
                      {formatForeignCurrency(purchase.exchangeRate || 0, 4)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <p className="mt-1 text-gray-900">
                      {purchase.exchangeType || "N/A"}
                    </p>
                  </div>
                </div>
                {purchase.totalCosts > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Costos de Importación
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {purchase.freightCost > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Flete
                          </label>
                          <p className="mt-1 font-medium">
                            {formatCurrency(purchase.freightCost)}
                          </p>
                        </div>
                      )}
                      {purchase.customsCost > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Aduanas
                          </label>
                          <p className="mt-1 font-medium">
                            {formatCurrency(purchase.customsCost)}
                          </p>
                        </div>
                      )}
                      {purchase.taxCost > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Impuestos
                          </label>
                          <p className="mt-1 font-medium">
                            {formatCurrency(purchase.taxCost)}
                          </p>
                        </div>
                      )}
                      {purchase.insuranceCost > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Seguro
                          </label>
                          <p className="mt-1 font-medium">
                            {formatCurrency(purchase.insuranceCost)}
                          </p>
                        </div>
                      )}
                      {purchase.otherCosts > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Otros
                          </label>
                          <p className="mt-1 font-medium">
                            {formatCurrency(purchase.otherCosts)}
                          </p>
                        </div>
                      )}
                      <div className="md:col-span-3 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-900">
                            Total Costos:
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(purchase.totalCosts)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Productos ({purchase.items.length})
                </h2>
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
                      {purchase.type === "IMPORT" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio ({purchase.currency || "USD"})
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio (ARS)
                      </th>
                      {purchase.type === "IMPORT" &&
                        purchase.totalCosts > 0 && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo Distribuido
                          </th>
                        )}
                      {purchase.type === "IMPORT" &&
                        purchase.totalCosts > 0 && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo Final
                          </th>
                        )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchase.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name || "Producto sin nombre"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product?.category?.name || "Sin categoría"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        {purchase.type === "IMPORT" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatForeignCurrency(item.unitPriceForeign)}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.unitPricePesos)}
                        </td>
                        {purchase.type === "IMPORT" &&
                          purchase.totalCosts > 0 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.distributedCostPesos || 0} -{" "}
                              {typeof item.distributedCostPesos}
                            </td>
                          )}
                        {purchase.type === "IMPORT" &&
                          purchase.totalCosts > 0 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.finalCostPesos || item.unitPricePesos} -{" "}
                              {typeof item.finalCostPesos}
                            </td>
                          )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.subtotalPesos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Resumen
              </h3>
              <div className="space-y-3">
                {purchase.type === "IMPORT" && purchase.subtotalForeign && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal ({purchase.currency || "USD"}):
                    </span>
                    <span className="font-medium">
                      {formatForeignCurrency(purchase.subtotalForeign)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal (ARS):</span>
                  <span className="font-medium">
                    {formatCurrency(purchase.subtotalPesos)}
                  </span>
                </div>
                {purchase.totalCosts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costos adicionales:</span>
                    <span className="font-medium">
                      {formatCurrency(purchase.totalCosts)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(purchase.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/purchases/${purchase.id}/edit`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar compra
                </Link>
                {purchase.status !== "COMPLETED" && (
                  <button
                    onClick={handleCompletePurchase}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar compra
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
              </div>
            </div>

            {/* Purchase Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Información
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {purchase.type === "LOCAL" ? "Local" : "Importación"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Creado:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(purchase.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Actualizado:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(purchase.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cambiar Estado
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="IN_TRANSIT">En tránsito</option>
                  <option value="RECEIVED">Recibido</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || !newStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingStatus ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
