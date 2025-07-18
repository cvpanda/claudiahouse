"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Edit } from "lucide-react";
import Layout from "@/components/Layout";
import ShippingBranchesManager from "@/components/ShippingBranchesManager";
import Link from "next/link";
import { Customer, ShippingBranch } from "@/types";

interface CustomerWithBranches extends Customer {
  shippingBranches?: ShippingBranch[];
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<CustomerWithBranches | null>(null);
  const [shippingBranches, setShippingBranches] = useState<ShippingBranch[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    province: "",
    city: "",
    country: "Argentina",
    cuit: "",
    customerType: "retail",
    isActive: true,
  });

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
      fetchShippingBranches();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
        setFormData({
          name: customerData.name,
          email: customerData.email || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
          postalCode: customerData.postalCode || "",
          province: customerData.province || "",
          city: customerData.city || "",
          country: customerData.country || "Argentina",
          cuit: customerData.cuit || "",
          customerType: customerData.customerType,
          isActive: customerData.isActive,
        });
      } else {
        console.error("Error fetching customer");
        router.push("/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingBranches = async () => {
    try {
      const response = await fetch(
        `/api/customers/${params.id}/shipping-branches`
      );
      if (response.ok) {
        const branches = await response.json();
        setShippingBranches(branches);
      } else {
        console.error("Error fetching shipping branches");
      }
    } catch (error) {
      console.error("Error fetching shipping branches:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomer(updatedCustomer);
        setEditing(false);
        // Recargar datos
        fetchCustomer();
      } else {
        const error = await response.json();
        alert(error.error || "Error al actualizar el cliente");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Error al actualizar el cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleShippingBranchesChange = (branches: ShippingBranch[]) => {
    setShippingBranches(branches);
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

  if (!customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Cliente no encontrado
          </h3>
          <div className="mt-6">
            <Link
              href="/customers"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver a Clientes
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
              href="/customers"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {customer.name}
              </h1>
              <p className="text-sm text-gray-600">
                Cliente{" "}
                {customer.customerType === "retail" ? "Minorista" : "Mayorista"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            {editing ? "Cancelar" : "Editar"}
          </button>
        </div>

        {/* Customer Information */}
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Información del Cliente
            </h3>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cliente *
                  </label>
                  <select
                    name="customerType"
                    required
                    value={formData.customerType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="retail">Minorista</option>
                    <option value="wholesale">Mayorista</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CUIT/CUIL
                  </label>
                  <input
                    type="text"
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Información de ubicación */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Información de Ubicación
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localidad
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Cliente activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.cuit && (
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{customer.cuit}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {(customer.address || customer.city || customer.province) && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        {customer.address && <div>{customer.address}</div>}
                        <div className="text-sm text-gray-600">
                          {[
                            customer.city,
                            customer.province,
                            customer.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                        {customer.country !== "Argentina" && (
                          <div className="text-sm text-gray-600">
                            {customer.country}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Branches */}
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="p-6">
            <ShippingBranchesManager
              customerId={customer.id}
              branches={shippingBranches}
              onBranchesChange={handleShippingBranchesChange}
              readOnly={false}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
