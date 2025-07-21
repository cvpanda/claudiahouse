"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  province?: string;
  city?: string;
  country: string;
  cuit?: string;
  customerType: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const { hasPermission } = useAuth();

  // Verificar permisos
  const canView = hasPermission("customers", "view");
  const canCreate = hasPermission("customers", "create");
  const canUpdate = hasPermission("customers", "update");
  const canDelete = hasPermission("customers", "delete");

  if (!canView) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para ver los clientes.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== id));
        alert("Cliente eliminado correctamente");
      } else {
        alert("Error al eliminar el cliente");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error al eliminar el cliente");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cuit?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filterType || customer.customerType === filterType;

    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: string) => {
    return type === "retail" ? "Minorista" : "Mayorista";
  };

  const getTypeBadgeColor = (type: string) => {
    return type === "retail"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona tu base de clientes
            </p>
          </div>
          <Link
            href="/customers/new"
            className={`mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              canCreate
                ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={(e) => !canCreate && e.preventDefault()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="retail">Minorista</option>
              <option value="wholesale">Mayorista</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Clientes
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {customers.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Mayoristas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {
                    customers.filter((c) => c.customerType === "wholesale")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Minoristas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {customers.filter((c) => c.customerType === "retail").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay clientes
              </h3>
              <p className="mt-1 text-sm text-gray-500 px-4">
                {searchTerm || filterType
                  ? "No se encontraron clientes que coincidan con los filtros."
                  : "Comienza creando tu primer cliente."}
              </p>
              <div className="mt-6 px-4">
                <Link
                  href="/customers/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </h3>
                      {customer.cuit && (
                        <p className="text-xs text-gray-500 mt-1">
                          CUIT: {customer.cuit}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                          customer.customerType
                        )}`}
                      >
                        {getTypeLabel(customer.customerType)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          customer.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {(customer.address ||
                      customer.city ||
                      customer.province) && (
                      <div className="flex items-start text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          {customer.address && (
                            <span className="text-sm">{customer.address}</span>
                          )}
                          {(customer.city || customer.province) && (
                            <span className="text-xs text-gray-500">
                              {[
                                customer.city,
                                customer.province,
                                customer.postalCode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end space-x-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md ${
                        canUpdate
                          ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                          : "text-gray-400 bg-gray-50 cursor-not-allowed"
                      }`}
                      onClick={(e) => !canUpdate && e.preventDefault()}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Link>
                    {canDelete && (
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        {customer.cuit && (
                          <div className="text-sm text-gray-500">
                            CUIT: {customer.cuit}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {customer.phone}
                          </div>
                        )}
                        {(customer.address ||
                          customer.city ||
                          customer.province) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <div className="flex flex-col">
                              {customer.address && (
                                <span>{customer.address}</span>
                              )}
                              {(customer.city || customer.province) && (
                                <span className="text-xs text-gray-500">
                                  {[
                                    customer.city,
                                    customer.province,
                                    customer.postalCode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(
                          customer.customerType
                        )}`}
                      >
                        {getTypeLabel(customer.customerType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/customers/${customer.id}`}
                          className={`${
                            canUpdate
                              ? "text-blue-600 hover:text-blue-900"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={(e) => !canUpdate && e.preventDefault()}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {canDelete && (
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
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

          {/* Desktop empty state */}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay clientes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType
                  ? "No se encontraron clientes que coincidan con los filtros."
                  : "Comienza creando tu primer cliente."}
              </p>
              <div className="mt-6">
                <Link
                  href="/customers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
