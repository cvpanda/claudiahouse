"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Tag, Package } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  products?: { id: string; name: string }[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { hasPermission } = useAuth();

  // Verificar permisos
  const canView = hasPermission("categories", "view");
  const canCreate = hasPermission("categories", "create");
  const canUpdate = hasPermission("categories", "update");
  const canDelete = hasPermission("categories", "delete");

  if (!canView) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para ver las categorías.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(
          editingCategory
            ? "Categoría actualizada correctamente"
            : "Categoría creada correctamente"
        );
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: "", code: "", description: "" });
        fetchCategories();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Error al procesar la categoría"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la categoría");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Categoría eliminada correctamente");
        fetchCategories();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Error al eliminar la categoría"}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error al eliminar la categoría");
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", code: "", description: "" });
    setShowModal(true);
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && categories.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona las categorías de productos
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
            Nueva Categoría
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar categorías..."
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
              <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Categorías
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Productos Categorizados
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {categories.reduce(
                    (sum, cat) => sum + (cat.products?.length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden space-y-3">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-sm border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate flex-1">
                      {category.name}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded flex-shrink-0">
                      {category.code}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  {canUpdate && (
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <Package className="w-4 h-4 mr-1" />
                  <span>{category.products?.length || 0} productos</span>
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">Categoría</span>
                </div>
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
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
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
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {category.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {category.description || (
                          <span className="text-gray-400 italic">
                            Sin descripción
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Package className="w-4 h-4 mr-1" />
                        <span>{category.products?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(category.id)}
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
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Tag className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay categorías
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No se encontraron categorías con ese criterio."
                : "Comienza creando una nueva categoría."}
            </p>
            {!searchTerm && canCreate && (
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Categoría
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
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
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
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código (3 letras) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="LAP"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se usará para generar el SKU de los productos
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                    placeholder="Descripción de la categoría"
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
                      : editingCategory
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
