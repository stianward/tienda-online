"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDatabase, saveDatabase, canCreateRole } from "@/lib/data-store";
import { User, Role } from "@/types";
import { Users, Plus, Shield, Trash2, Key, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UsersAdminPage() {
  const { currentRole, isSystemAdmin, isAdmin, isAgent } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setUsers(db.users);
    setRoles(db.roles);
    if (db.roles.length > 0 && !roleId) {
      setRoleId(db.roles[0].id);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !email.trim()) {
      setErrorMsg("El nombre y el correo electrónico son obligatorios.");
      return;
    }

    if (!password) {
      setErrorMsg("Debes ingresar una contraseña.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor confirma correctamente.");
      return;
    }

    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) {
      setErrorMsg("Por favor selecciona un rol válido.");
      return;
    }

    // APLICACIÓN ESTRICTA DE LA REGLA DE SEGURIDAD RBAC
    const currentRoleType = currentRole?.type || "client";
    const authCheck = canCreateRole(currentRoleType, targetRole.type);
    if (!authCheck.allowed) {
      setErrorMsg(authCheck.reason || "No tienes permisos para asignar este rol.");
      return;
    }

    const db = getDatabase();

    // Validar si el email ya existe
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setErrorMsg("Ya existe un usuario con este correo electrónico.");
      return;
    }

    // ID único generado automáticamente
    const newId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: newId,
      name: name.trim(),
      email: email.trim(),
      roleId: targetRole.id,
      createdAt: new Date().toISOString(),
    };

    saveDatabase({
      ...db,
      users: [...db.users, newUser],
    });

    setSuccessMsg(`Usuario "${newUser.name}" creado con éxito (ID: ${newUser.id}).`);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowModal(false);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const targetRole = roles.find((r) => r.id === targetUser.roleId);

    // Seguridad: agente no puede borrar admin ni system_admin
    if (isAgent && (targetRole?.type === "admin" || targetRole?.type === "system_admin")) {
      alert("Acceso denegado: Un Agente no puede modificar o eliminar Administradores.");
      return;
    }

    // Admin no puede borrar system_admin
    if (isAdmin && targetRole?.type === "system_admin") {
      alert("Acceso denegado: Un Administrador no puede eliminar a un System Administrator.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el usuario "${targetUser.name}"?`)) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        users: db.users.filter((u) => u.id !== userId),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Módulo de Usuarios
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administración de cuentas con control de jerarquía de roles (System Administrator, Administrador, Agente).
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
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Reglas de Seguridad Visibles */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Reglas de Seguridad Activas:</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            <li>Solo <strong>System Administrator</strong> puede crear usuarios con rol System Administrator.</li>
            <li>Un usuario <strong>Administrador</strong> no puede crear usuarios System Administrator.</li>
            <li>Un usuario <strong>Agente</strong> no puede crear Administradores ni System Administrators.</li>
          </ul>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID Único</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const roleObj = roles.find((r) => r.id === user.roleId);
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {user.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          roleObj?.type === "system_admin"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : roleObj?.type === "admin"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {roleObj?.name || "Sin Rol"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Nuevo Usuario
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

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía Martínez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="sofia@grabamil.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rol del Usuario
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  {roles.map((r) => {
                    // Validar si el rol es permitible según la jerarquía
                    const currentType = currentRole?.type || "client";
                    const isAllowed = canCreateRole(currentType, r.type).allowed;
                    return (
                      <option key={r.id} value={r.id} disabled={!isAllowed}>
                        {r.name} {!isAllowed ? " (Bloqueado por jerarquía)" : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Tu rol actual ({currentRole?.name}) determina qué roles puedes asignar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirma Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
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
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

