"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";

interface DeletePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  onDelete: () => void;
}

export default function DeletePurchaseModal({
  isOpen,
  onClose,
  purchase,
  onDelete,
}: DeletePurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/purchases/${purchase.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la compra");
      }

      const result = await response.json();

      // Mostrar información sobre la reversión de stock si ocurrió
      if (result.revertedStock) {
        alert(
          "Compra eliminada exitosamente. Se ha revertido el impacto en stock de los productos."
        );
      }

      onDelete();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !purchase) return null;

  const isCompletedPurchase = purchase.status === "COMPLETED";
  const canDelete = !["RECEIVED", "IN_TRANSIT"].includes(purchase.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-red-600">
            Eliminar Compra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Estás seguro que deseas eliminar esta compra?
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Número:</strong> {purchase.purchaseNumber}
                </p>
                <p>
                  <strong>Proveedor:</strong> {purchase.supplier?.name}
                </p>
                <p>
                  <strong>Estado:</strong> {purchase.status}
                </p>
                <p>
                  <strong>Total:</strong> $
                  {purchase.total?.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {!canDelete && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800 text-sm">
                <strong>No se puede eliminar:</strong> Las compras recibidas o
                en tránsito no pueden ser eliminadas.
              </div>
            </div>
          )}

          {canDelete && isCompletedPurchase && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="text-yellow-800 text-sm">
                <strong>Atención:</strong> Esta compra está completada. Al
                eliminarla se revertirá el stock de todos los productos
                incluidos y se recalcularán los costos promedio.
              </div>
            </div>
          )}

          {canDelete && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Esta acción:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Eliminará permanentemente la compra</li>
                <li>• Eliminará todos los productos asociados a esta compra</li>
                {isCompletedPurchase && (
                  <>
                    <li>• Revertirá el stock de los productos</li>
                    <li>• Recalculará los costos promedio de los productos</li>
                    <li>• Creará movimientos de stock de reversión</li>
                  </>
                )}
                <li>
                  • <strong>No se puede deshacer</strong>
                </li>
              </ul>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? "Eliminando..." : "Eliminar compra"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
