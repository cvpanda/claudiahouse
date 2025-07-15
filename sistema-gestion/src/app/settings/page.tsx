"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Shield,
  Key,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: {
    module: string;
    action: string;
    granted: boolean;
  }[];
}

interface Permission {
  module: string;
  actions: string[];
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { hasPermission } = useAuth();

  // Verificar permisos de administrador
  const canManageUsers = hasPermission("users", "view");
  const canManageRoles = hasPermission("roles", "view");

  if (!canManageUsers && !canManageRoles) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para acceder a la configuración.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const [userFormData, setUserFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    roleId: "",
  });

  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, Record<string, boolean>>,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (canManageUsers) fetchUsers();
    if (canManageRoles) fetchRoles();
    fetchPermissions();
  }, [canManageUsers, canManageRoles]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions");
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowUserModal(false);
        setEditingUser(null);
        setUserFormData({
          email: "",
          firstName: "",
          lastName: "",
          password: "",
          roleId: "",
        });
      } else {
        const error = await response.json();
        alert(error.message || "Error al guardar usuario");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error al guardar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleFormData),
      });

      if (response.ok) {
        await fetchRoles();
        setShowRoleModal(false);
        setEditingRole(null);
        setRoleFormData({
          name: "",
          description: "",
          permissions: {},
        });
      } else {
        const error = await response.json();
        alert(error.message || "Error al guardar rol");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Error al guardar rol");
    } finally {
      setLoading(false);
    }
  };

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      roleId: "",
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "",
      roleId: user.role.id,
    });
    setShowUserModal(true);
  };

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleFormData({
      name: "",
      description: "",
      permissions: {},
    });
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role: Role) => {
    setEditingRole(role);
    const permissionsMap: Record<string, Record<string, boolean>> = {};

    permissions.forEach((perm) => {
      permissionsMap[perm.module] = {};
      perm.actions.forEach((action) => {
        const hasPermission = role.permissions.some(
          (rp) =>
            rp.module === perm.module && rp.action === action && rp.granted
        );
        permissionsMap[perm.module][action] = hasPermission;
      });
    });

    setRoleFormData({
      name: role.name,
      description: role.description || "",
      permissions: permissionsMap,
    });
    setShowRoleModal(true);
  };

  const updatePermission = (
    module: string,
    action: string,
    granted: boolean
  ) => {
    setRoleFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: granted,
        },
      },
    }));
  };

  const deleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchUsers();
      } else {
        alert("Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar usuario");
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este rol?")) return;

    try {
      const response = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchRoles();
      } else {
        alert("Error al eliminar rol");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Error al eliminar rol");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona usuarios, roles y permisos del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {canManageUsers && (
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Usuarios
              </button>
            )}
            {canManageRoles && (
              <button
                onClick={() => setActiveTab("roles")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "roles"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Roles
              </button>
            )}
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Permisos
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && canManageUsers && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Usuarios</h2>
              <button
                onClick={openCreateUserModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {user.role.name.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                        <button
                          onClick={() => openEditUserModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && canManageRoles && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Roles</h2>
              <button
                onClick={openCreateRoleModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Rol
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <li key={role.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {role.name.replace("_", " ")}
                          </div>
                          {role.description && (
                            <div className="text-sm text-gray-500">
                              {role.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {role.permissions.filter((p) => p.granted).length}{" "}
                            permisos
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditRoleModal(role)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRole(role.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === "permissions" && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">
              Permisos del Sistema
            </h2>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  {permissions.map((perm) => (
                    <div
                      key={perm.module}
                      className="border-b border-gray-200 pb-4"
                    >
                      <h3 className="text-lg font-medium text-gray-900 capitalize mb-3">
                        {perm.module}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {perm.actions.map((action) => (
                          <div
                            key={action}
                            className="flex items-center p-2 bg-gray-50 rounded"
                          >
                            <Key className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700 capitalize">
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handleUserSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={userFormData.email}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={userFormData.firstName}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={userFormData.lastName}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editingUser}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                      value={userFormData.password}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          password: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={userFormData.roleId}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        roleId: e.target.value,
                      })
                    }
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingUser ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleRoleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingRole ? "Editar Rol" : "Nuevo Rol"}
                </h3>
              </div>
              <div className="px-6 py-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre del Rol
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={roleFormData.name}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={roleFormData.description}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Permisos
                  </h4>
                  <div className="space-y-4">
                    {permissions.map((perm) => (
                      <div
                        key={perm.module}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h5 className="text-sm font-medium text-gray-900 capitalize mb-3">
                          {perm.module}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {perm.actions.map((action) => (
                            <div key={action} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`${perm.module}-${action}`}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={
                                  roleFormData.permissions[perm.module]?.[
                                    action
                                  ] || false
                                }
                                onChange={(e) =>
                                  updatePermission(
                                    perm.module,
                                    action,
                                    e.target.checked
                                  )
                                }
                              />
                              <label
                                htmlFor={`${perm.module}-${action}`}
                                className="ml-2 text-sm text-gray-700 capitalize"
                              >
                                {action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingRole ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
