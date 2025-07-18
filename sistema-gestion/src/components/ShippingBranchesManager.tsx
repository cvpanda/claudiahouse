"use client";

import { useState } from "react";
import { Plus, X, MapPin, Edit, Trash2 } from "lucide-react";
import { ShippingBranch } from "@/types";

interface ShippingBranchForm {
  id?: string;
  name: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  branchCode?: string;
}

interface ShippingBranchesManagerProps {
  customerId?: string;
  branches: ShippingBranch[];
  onBranchesChange: (branches: ShippingBranch[]) => void;
  readOnly?: boolean;
}

export default function ShippingBranchesManager({
  customerId,
  branches,
  onBranchesChange,
  readOnly = false,
}: ShippingBranchesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ShippingBranch | null>(
    null
  );
  const [formData, setFormData] = useState<ShippingBranchForm>({
    name: "",
    address: "",
    province: "",
    city: "",
    postalCode: "",
    branchCode: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      province: "",
      city: "",
      postalCode: "",
      branchCode: "",
    });
    setEditingBranch(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (customerId && editingBranch?.id) {
      // Update existing branch via API
      try {
        const response = await fetch(
          `/api/customers/${customerId}/shipping-branches/${editingBranch.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (response.ok) {
          const updatedBranch = await response.json();
          const updatedBranches = branches.map((b) =>
            b.id === editingBranch.id ? updatedBranch : b
          );
          onBranchesChange(updatedBranches);
          resetForm();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error("Error updating branch:", error);
        alert("Error al actualizar la sucursal");
      }
    } else if (customerId) {
      // Create new branch via API
      try {
        const response = await fetch(
          `/api/customers/${customerId}/shipping-branches`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (response.ok) {
          const newBranch = await response.json();
          onBranchesChange([...branches, newBranch]);
          resetForm();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error("Error creating branch:", error);
        alert("Error al crear la sucursal");
      }
    } else {
      // Local mode (for new customers)
      const newBranch: ShippingBranch = {
        ...formData,
        id: Date.now().toString(), // Temporary ID
        customerId: customerId || "temp",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onBranchesChange([...branches, newBranch]);
      resetForm();
    }
  };

  const handleEdit = (branch: ShippingBranch) => {
    setFormData({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      province: branch.province,
      city: branch.city,
      postalCode: branch.postalCode,
      branchCode: branch.branchCode,
    });
    setEditingBranch(branch);
    setShowForm(true);
  };

  const handleDelete = async (branch: ShippingBranch) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta sucursal?")) {
      return;
    }

    if (customerId && branch.id) {
      // Delete via API
      try {
        const response = await fetch(
          `/api/customers/${customerId}/shipping-branches/${branch.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          const updatedBranches = branches.filter((b) => b.id !== branch.id);
          onBranchesChange(updatedBranches);
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error("Error deleting branch:", error);
        alert("Error al eliminar la sucursal");
      }
    } else {
      // Local mode
      const updatedBranches = branches.filter((b) => b.id !== branch.id);
      onBranchesChange(updatedBranches);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            Sucursales de Envío
          </h3>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar Sucursal
          </button>
        )}
      </div>

      {/* Lista de sucursales */}
      {branches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{branch.name}</h4>
                {!readOnly && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(branch)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(branch)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{branch.address}</p>
              <p className="text-sm text-gray-600">
                {branch.city}, {branch.province} - CP: {branch.postalCode}
              </p>
              {branch.branchCode && (
                <p className="text-sm text-blue-600 mt-1">
                  Código: {branch.branchCode}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay sucursales de envío configuradas</p>
        </div>
      )}

      {/* Formulario de sucursal */}
      {showForm && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {editingBranch ? "Editar Sucursal" : "Nueva Sucursal"}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Sucursal *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Correo Argentino Centro"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección de la sucursal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ciudad o localidad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia *
                </label>
                <input
                  type="text"
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provincia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Código postal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Sucursal
                </label>
                <input
                  type="text"
                  name="branchCode"
                  value={formData.branchCode || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Código interno de la sucursal"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                {editingBranch ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
