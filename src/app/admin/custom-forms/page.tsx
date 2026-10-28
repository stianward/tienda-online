"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { CustomForm, FormTypeItem, CustomTable, Render3D } from "@/types";
import { FileText, Plus, Trash2, Edit2, Eye, CheckCircle2 } from "lucide-react";
import FormBuilder from "@/components/admin/forms/FormBuilder";

export default function CustomFormsAdminPage() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [formTypes, setFormTypes] = useState<FormTypeItem[]>([]);
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [renders, setRenders] = useState<Render3D[]>([]);

  const [isBuilding, setIsBuilding] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | undefined>(undefined);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setForms(db.customForms);
    setFormTypes(db.formTypes);
    setCustomTables(db.customTables);
    setRenders(db.renders);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const handleStartCreate = () => {
    setEditingForm(undefined);
    setIsBuilding(true);
  };

  const handleStartEdit = (form: CustomForm) => {
    setEditingForm(form);
    setIsBuilding(true);
  };

  const handleSaveForm = (formToSave: CustomForm) => {
    const db = getDatabase();
    const existingIndex = db.customForms.findIndex((f) => f.id === formToSave.id);

    let updated: CustomForm[];
    if (existingIndex >= 0) {
      updated = [...db.customForms];
      updated[existingIndex] = formToSave;
    } else {
      updated = [...db.customForms, formToSave];
    }

    saveDatabase({ ...db, customForms: updated });
    setSuccessMsg(`Formulario "${formToSave.name}" guardado exitosamente.`);
    setIsBuilding(false);
    setEditingForm(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Deseas eliminar este formulario personalizado?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        customForms: db.customForms.filter((f) => f.id !== id),
      });
    }
  };

  if (isBuilding) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            {editingForm ? `Editar: ${editingForm.name}` : "Nuevo Formulario Personalizado"}
          </h2>
          <button
            onClick={() => setIsBuilding(false)}
            className="text-xs font-semibold text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            ← Volver a la Lista
          </button>
        </div>

        <FormBuilder
          initialForm={editingForm}
          formTypes={formTypes}
          customTables={customTables}
          renders={renders}
          onSave={handleSaveForm}
          onCancel={() => setIsBuilding(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Módulo Formularios Personalizados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Constructor visual Drag & Drop con inputs, radios, selects, labels, botones y tablas 3D para clientes o productos.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Formulario (Drag & Drop)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Listado de Formularios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Formularios Registrados ({forms.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {forms.map((form) => {
            const ftObj = formTypes.find((ft) => ft.id === form.formTypeId);
            const tblObj = customTables.find((t) => t.id === form.customTableId);

            return (
              <div
                key={form.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {form.id}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">{form.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        ftObj?.name === "PRODUCTO"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {ftObj?.name || "General"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Elementos ({form.elements.length}):{" "}
                    {form.elements.map((e) => e.label).slice(0, 4).join(", ")}
                    {form.elements.length > 4 ? "..." : ""}
                    {tblObj && (
                      <span className="ml-2 text-indigo-600 font-semibold">
                        • Incluye Tabla 3D: {tblObj.name}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(form)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar en Canvas D&D</span>
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

