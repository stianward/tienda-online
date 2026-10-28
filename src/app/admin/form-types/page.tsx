"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { FormTypeItem } from "@/types";
import { Layers, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function FormTypesAdminPage() {
  const [types, setTypes] = useState<FormTypeItem[]>([]);
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setTypes(db.formTypes);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const db = getDatabase();
    const newId = `ft-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newType: FormTypeItem = {
      id: newId,
      name: name.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    saveDatabase({ ...db, formTypes: [...db.formTypes, newType] });
    setSuccessMsg(`Tipo de formulario "${newType.name}" creado con éxito.`);
    setName("");
  };

  const handleDelete = (id: string) => {
    const target = types.find((t) => t.id === id);
    if (target?.name === "CLIENTE" || target?.name === "PRODUCTO") {
      alert("No se pueden eliminar los tipos base 'CLIENTE' o 'PRODUCTO' exigidos por el sistema.");
      return;
    }

    if (confirm("¿Deseas eliminar este tipo de formulario?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        formTypes: db.formTypes.filter((t) => t.id !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          Módulo Tipos de Formularios
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Define las categorías de formularios disponibles para parametrizar las reglas de elementos HTML y tablas 3D.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-lg">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Nuevo Tipo de Formulario</h3>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Ej. SERVICIO TÉCNICO"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium uppercase"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Tipo</span>
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID Único</th>
                <th className="py-3 px-4">Nombre Tipo Formulario</th>
                <th className="py-3 px-4">Reglas de Componentes Habilitadas</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map((type) => (
                <tr key={type.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {type.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                      {type.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {type.name === "CLIENTE" && (
                      <span className="text-sky-700 font-medium">
                        Elementos básicos HTML (inputs text, number, address, email, labels, botones)
                      </span>
                    )}
                    {type.name === "PRODUCTO" && (
                      <span className="text-indigo-700 font-medium">
                        Elementos básicos HTML + Tablas personalizadas interactivas + Visor 3D en tiempo real
                      </span>
                    )}
                    {type.name !== "CLIENTE" && type.name !== "PRODUCTO" && (
                      <span className="text-slate-500">Elementos básicos generales</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(type.id)}
                      disabled={type.name === "CLIENTE" || type.name === "PRODUCTO"}
                      className={`p-1.5 rounded-lg transition ${
                        type.name === "CLIENTE" || type.name === "PRODUCTO"
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                      title={type.name === "CLIENTE" || type.name === "PRODUCTO" ? "Tipo de sistema protegido" : "Eliminar"}
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
    </div>
  );
}

