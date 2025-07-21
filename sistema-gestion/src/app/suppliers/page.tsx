"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Package,
  Phone,
  Mail,
  MapPin,
  Globe,
  Flag,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  cuit?: string;
  country?: string;
  website?: string;
  createdAt: string;
  products?: { id: string; name: string }[];
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { hasPermission } = useAuth();

  // Verificar permisos
  const canView = hasPermission("suppliers", "view");
  const canCreate = hasPermission("suppliers", "create");
  const canUpdate = hasPermission("suppliers", "update");
  const canDelete = hasPermission("suppliers", "delete");

  if (!canView) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para ver los proveedores.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    cuit: "",
    country: "Argentina",
    website: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.id}`
        : "/api/suppliers";

      const method = editingSupplier ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(
          editingSupplier
            ? "Proveedor actualizado correctamente"
            : "Proveedor creado correctamente"
        );
        setShowModal(false);
        setEditingSupplier(null);
        setFormData({
          name: "",
          contact: "",
          phone: "",
          email: "",
          address: "",
          cuit: "",
          country: "Argentina",
          website: "",
        });
        fetchSuppliers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Error al procesar el proveedor"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar el proveedor");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      cuit: supplier.cuit || "",
      country: supplier.country || "Argentina",
      website: supplier.website || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este proveedor?")) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Proveedor eliminado correctamente");
        fetchSuppliers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Error al eliminar el proveedor"}`);
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Error al eliminar el proveedor");
    }
  };
  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      cuit: "",
      country: "Argentina",
      website: "",
    });
    setShowModal(true);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && suppliers.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona los proveedores de productos
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className={`mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              canCreate
                ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!canCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Proveedores
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {suppliers.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Productos Suministrados
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {suppliers.reduce(
                    (sum, sup) => sum + (sup.products?.length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden space-y-3">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-lg shadow-sm border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {supplier.name}
                  </h3>
                  {supplier.contact && (
                    <p className="text-sm text-gray-600 mt-1">
                      {supplier.contact}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  {canUpdate && (
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-2">{supplier.address}</span>
                  </div>
                )}
                {supplier.country && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Flag className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.country}</span>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <Package className="w-4 h-4 mr-1" />
                  <span>{supplier.products?.length || 0} productos</span>
                </div>
                {supplier.cuit && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    CUIT: {supplier.cuit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Información
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          {supplier.country && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Flag className="w-3 h-3 mr-1" />
                              {supplier.country}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contact || "-"}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 space-y-1">
                        {supplier.address && (
                          <div className="flex items-start">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2 max-w-xs">
                              {supplier.address}
                            </span>
                          </div>
                        )}
                        {supplier.website && (
                          <div className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                            >
                              {supplier.website}
                            </a>
                          </div>
                        )}
                        {supplier.cuit && (
                          <div className="text-xs text-gray-400">
                            CUIT: {supplier.cuit}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Package className="w-4 h-4 mr-1" />
                        <span>{supplier.products?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Building2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay proveedores
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No se encontraron proveedores con ese criterio."
                : "Comienza creando un nuevo proveedor."}
            </p>
            {!searchTerm && canCreate && (
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Proveedor
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-lg sm:w-96 shadow-lg rounded-md bg-white max-h-[95vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="mt-2 sm:mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Teléfono de contacto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="email@proveedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CUIT
                  </label>
                  <input
                    type="text"
                    value={formData.cuit}
                    onChange={(e) =>
                      setFormData({ ...formData, cuit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                    placeholder="Dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="País del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="https://www.proveedor.com"
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium text-base"
                  >
                    {loading
                      ? "Procesando..."
                      : editingSupplier
                      ? "Actualizar"
                      : "Crear"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 font-medium text-base"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
