"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { ProductCategory } from "@/types";
import { Tags, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setCategories(db.categories);
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
    const newId = `cat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newCat: ProductCategory = {
      id: newId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    saveDatabase({ ...db, categories: [...db.categories, newCat] });
    setSuccessMsg(`Categoría "${newCat.name}" creada con éxito (ID: ${newCat.id}).`);
    setName("");
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Deseas eliminar esta categoría?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        categories: db.categories.filter((c) => c.id !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Tags className="w-6 h-6 text-indigo-600" />
          Módulo de Categorías
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Administración de categorías utilizadas en el módulo de productos.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulario de Creación */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-lg">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Nueva Categoría</h3>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Ej. Artículos de Cuero Grabados"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </form>
      </div>

      {/* Tabla de Categorías */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID Único</th>
                <th className="py-3 px-4">Nombre Categoría</th>
                <th className="py-3 px-4">Fecha Creación</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {cat.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {cat.name}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(cat.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar"
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

