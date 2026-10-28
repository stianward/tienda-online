"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { Profile, SYSTEM_MODULES, ModuleKey } from "@/types";
import { Lock, Plus, Check, X, Trash2, Edit2, CheckCircle2 } from "lucide-react";

export default function ProfilesAdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [modulesState, setModulesState] = useState<Record<ModuleKey, boolean>>({} as any);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setProfiles(db.profiles);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const openCreateModal = () => {
    setEditingProfileId(null);
    setProfileName("");
    const initialMods: Record<ModuleKey, boolean> = {} as any;
    SYSTEM_MODULES.forEach((m) => {
      initialMods[m.id] = false;
    });
    setModulesState(initialMods);
    setShowModal(true);
  };

  const openEditModal = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setProfileName(profile.name);
    setModulesState({ ...profile.modules });
    setShowModal(true);
  };

  const handleToggleModuleInModal = (modKey: ModuleKey) => {
    setModulesState((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  const handleToggleModuleDirect = (profileId: string, modKey: ModuleKey) => {
    const db = getDatabase();
    const updated = db.profiles.map((p) => {
      if (p.id === profileId) {
        return {
          ...p,
          modules: {
            ...p.modules,
            [modKey]: !p.modules[modKey],
          },
        };
      }
      return p;
    });

    saveDatabase({ ...db, profiles: updated });
    setSuccessMsg(`Permiso del módulo "${modKey}" actualizado en el perfil.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const db = getDatabase();

    if (editingProfileId) {
      // Editar
      const updated = db.profiles.map((p) =>
        p.id === editingProfileId
          ? { ...p, name: profileName.trim(), modules: modulesState }
          : p
      );
      saveDatabase({ ...db, profiles: updated });
      setSuccessMsg(`Perfil "${profileName}" actualizado correctamente.`);
    } else {
      // Crear
      const newId = `prof-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newProfile: Profile = {
        id: newId,
        name: profileName.trim(),
        modules: modulesState,
        createdAt: new Date().toISOString(),
      };
      saveDatabase({ ...db, profiles: [...db.profiles, newProfile] });
      setSuccessMsg(`Perfil "${newProfile.name}" creado con éxito (ID: ${newProfile.id}).`);
    }

    setShowModal(false);
  };

  const handleDeleteProfile = (id: string) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    if (confirm(`¿Eliminar el perfil "${target.name}"?`)) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        profiles: db.profiles.filter((p) => p.id !== id),
        rolesProfiles: db.rolesProfiles.filter((rp) => rp.profileId !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-indigo-600" />
            Módulo de Perfiles y Permisos de UI
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Activa o desactiva módulos por perfil. Si un módulo se apaga, los usuarios asociados no lo verán en su interfaz.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Perfil</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Matriz interactiva de Perfiles y Módulos */}
      <div className="space-y-6">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  {profile.id}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {profile.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(profile)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>
                <button
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabla con los módulos disponibles y toggles de activar/desactivar */}
            <div className="p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Matriz de Módulos (Haz clic para alternar visibilidad):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {SYSTEM_MODULES.map((mod) => {
                  const isActive = !!profile.modules[mod.id];
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModuleDirect(profile.id, mod.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50/70 text-emerald-950"
                          : "border-slate-200 bg-slate-50/80 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold truncate">{mod.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{mod.description}</p>
                      </div>

                      {/* Toggle visual */}
                      <div
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                          isActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                            isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar Perfil */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                {editingProfileId ? "Editar Perfil" : "Nuevo Perfil"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Administrador de Ventas y Pedidos"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Módulos Visibles en la UI
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = !!modulesState[mod.id];
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-normal"
                        }`}
                      >
                        <span>{mod.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModuleInModal(mod.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </label>
                    );
                  })}
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
                  {editingProfileId ? "Actualizar Perfil" : "Crear Perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

