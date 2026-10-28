"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { Role, Profile, RoleProfileAssociation } from "@/types";
import { Link as LinkIcon, Plus, Trash2, CheckCircle2, Shield, Lock } from "lucide-react";

export default function RolesProfilesAdminPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [associations, setAssociations] = useState<RoleProfileAssociation[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setRoles(db.roles);
    setProfiles(db.profiles);
    setAssociations(db.rolesProfiles);

    if (db.roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(db.roles[0].id);
    }
    if (db.profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(db.profiles[0].id);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const handleAssociate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId || !selectedProfileId) return;

    const db = getDatabase();
    const existingIndex = db.rolesProfiles.findIndex((rp) => rp.roleId === selectedRoleId);

    let updatedAssociations = [...db.rolesProfiles];
    if (existingIndex >= 0) {
      // Actualizar la asociación existente
      updatedAssociations[existingIndex] = {
        ...updatedAssociations[existingIndex],
        profileId: selectedProfileId,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Crear nueva asociación con ID único automático
      const newId = `rp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      updatedAssociations.push({
        id: newId,
        roleId: selectedRoleId,
        profileId: selectedProfileId,
        updatedAt: new Date().toISOString(),
      });
    }

    saveDatabase({ ...db, rolesProfiles: updatedAssociations });
    const rName = roles.find((r) => r.id === selectedRoleId)?.name;
    const pName = profiles.find((p) => p.id === selectedProfileId)?.name;
    setSuccessMsg(`Asociación exitosa: Rol "${rName}" vinculado con Perfil "${pName}".`);
  };

  const handleRemove = (id: string) => {
    if (confirm("¿Deseas desvincular esta asociación de rol y perfil?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        rolesProfiles: db.rolesProfiles.filter((rp) => rp.id !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <LinkIcon className="w-6 h-6 text-indigo-600" />
          Módulo de Roles y Perfiles
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Asocia cada rol creado con un perfil de permisos para gobernar qué módulos verá cada usuario en la interfaz.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulario de Asociación */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Vincular Rol a un Perfil
        </h3>
        <form onSubmit={handleAssociate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccionar Rol
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccionar Perfil de Permisos
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Guardar Asociación</span>
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Asociaciones Existentes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Asociaciones Vigentes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID Único</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Perfil Asociado</th>
                <th className="py-3 px-4">Módulos Activos</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {associations.map((assoc) => {
                const roleObj = roles.find((r) => r.id === assoc.roleId);
                const profileObj = profiles.find((p) => p.id === assoc.profileId);
                const activeModsCount = profileObj
                  ? Object.values(profileObj.modules).filter(Boolean).length
                  : 0;

                return (
                  <tr key={assoc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {assoc.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{roleObj?.name || "Rol Eliminado"}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1.5 text-slate-800">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        {profileObj?.name || "Perfil Eliminado"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-200">
                        {activeModsCount} módulos visibles
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemove(assoc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Desvincular"
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
    </div>
  );
}

