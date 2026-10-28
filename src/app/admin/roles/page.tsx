"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDatabase, saveDatabase, canCreateRole } from "@/lib/data-store";
import { Role, RoleType } from "@/types";
import { Shield, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RolesAdminPage() {
  const { currentRole, isSystemAdmin } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleType, setRoleType] = useState<RoleType>("admin");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setRoles(db.roles);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!roleName.trim()) {
      setErrorMsg("El nombre del rol es obligatorio.");
      return;
    }

    // Validación de seguridad estricta:
    // El único que podrá crear roles System administrador será un usuario con ese mismo rol
    const currentType = currentRole?.type || "client";
    const check = canCreateRole(currentType, roleType);
    if (!check.allowed) {
      setErrorMsg(check.reason || "Operación no autorizada.");
      return;
    }

    const db = getDatabase();
    const newId = `role-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newRole: Role = {
      id: newId,
      name: roleName.trim(),
      type: roleType,
      createdAt: new Date().toISOString(),
    };

    saveDatabase({
      ...db,
      roles: [...db.roles, newRole],
    });

    setSuccessMsg(`Rol "${newRole.name}" creado con éxito (ID: ${newRole.id}).`);
    setRoleName("");
    setRoleType("admin");
    setShowModal(false);
  };

  const handleDeleteRole = (id: string) => {
    const target = roles.find((r) => r.id === id);
    if (!target) return;

    if (target.type === "system_admin" && !isSystemAdmin) {
      alert("Solo un System Administrator puede eliminar este rol.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el rol "${target.name}"?`)) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        roles: db.roles.filter((r) => r.id !== id),
        rolesProfiles: db.rolesProfiles.filter((rp) => rp.roleId !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Módulo de Roles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Definición de roles en el sistema con identificador único generado automáticamente.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Rol</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID Único</th>
                <th className="py-3 px-4">Nombre del Rol</th>
                <th className="py-3 px-4">Tipo Base</th>
                <th className="py-3 px-4">Fecha de Creación</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {role.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {role.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        role.type === "system_admin"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : role.type === "admin"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {role.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(role.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar rol"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Rol */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Nuevo Rol
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRole} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Rol
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Supervisor de Planta"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Rol (Privilegios base)
                </label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value as RoleType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="admin">Administrador</option>
                  <option value="agent">Agente Comercial</option>
                  <option value="system_admin" disabled={!isSystemAdmin}>
                    System Administrator {!isSystemAdmin ? "(Solo para Super Admin)" : ""}
                  </option>
                </select>
                {!isSystemAdmin && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Nota de seguridad: Solo un System Administrator puede crear roles de tipo System Administrator.
                  </p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-md shadow-indigo-600/20"
                >
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

