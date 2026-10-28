"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { CustomForm, FormTypeItem, CustomTable, Render3D, Product } from "@/types";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Copy,
  Table as TableIcon,
  Sparkles,
  Package,
  Clock,
  X,
} from "lucide-react";
import FormBuilder from "@/components/admin/forms/FormBuilder";
import DynamicFormRenderer from "@/components/dynamic-form/DynamicFormRenderer";

function CustomFormsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editIdParam = searchParams.get("edit");

  const [forms, setForms] = useState<CustomForm[]>([]);
  const [formTypes, setFormTypes] = useState<FormTypeItem[]>([]);
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [renders, setRenders] = useState<Render3D[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isBuilding, setIsBuilding] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | undefined>(undefined);
  const [previewingForm, setPreviewingForm] = useState<CustomForm | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setForms(db.customForms);
    setFormTypes(db.formTypes);
    setCustomTables(db.customTables);
    setRenders(db.renders);
    setProducts(db.products);

    // Si viene parámetro de URL ?edit=<id>, abrir el editor directamente
    if (editIdParam) {
      const target = db.customForms.find((f) => f.id === editIdParam);
      if (target) {
        setEditingForm(target);
        setIsBuilding(true);
      }
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, [editIdParam]);

  const handleStartCreate = () => {
    setEditingForm(undefined);
    setIsBuilding(true);
  };

  const handleStartEdit = (form: CustomForm) => {
    setEditingForm(form);
    setIsBuilding(true);
  };

  const handleDuplicate = (sourceForm: CustomForm) => {
    const db = getDatabase();
    const newId = `form-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: CustomForm = {
      ...sourceForm,
      id: newId,
      name: `${sourceForm.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Crear clones profundos de los elementos con nuevos IDs
      elements: sourceForm.elements.map((elem, idx) => ({
        ...elem,
        id: `elem-${Date.now().toString(36)}-${idx}`,
      })),
    };

    saveDatabase({ ...db, customForms: [...db.customForms, duplicated] });
    setSuccessMsg(`Formulario duplicado con éxito como "${duplicated.name}".`);
  };

  const handleSaveForm = (formToSave: CustomForm) => {
    const db = getDatabase();
    const existingIndex = db.customForms.findIndex((f) => f.id === formToSave.id);

    let updated: CustomForm[];
    const isEdit = existingIndex >= 0;

    if (isEdit) {
      updated = [...db.customForms];
      updated[existingIndex] = {
        ...formToSave,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [...db.customForms, formToSave];
    }

    saveDatabase({ ...db, customForms: updated });
    setSuccessMsg(
      isEdit
        ? `Formulario "${formToSave.name}" actualizado con éxito. Los cambios se reflejarán en los productos asociados.`
        : `Formulario "${formToSave.name}" creado con éxito.`
    );
    setIsBuilding(false);
    setEditingForm(undefined);

    // Limpiar query param de la URL si existía
    if (editIdParam) {
      router.replace("/admin/custom-forms");
    }
  };

  const handleDelete = (id: string) => {
    const target = forms.find((f) => f.id === id);
    if (!target) return;

    // Verificar si algún producto tiene asignado este formulario
    const assignedProducts = products.filter((p) => p.formId === id);
    if (assignedProducts.length > 0) {
      const prodNames = assignedProducts.map((p) => `"${p.name}"`).join(", ");
      alert(
        `No se puede eliminar el formulario "${target.name}" porque está asignado a los siguientes productos:\n${prodNames}\n\nPor favor reasigna el formulario de esos productos antes de eliminarlo.`
      );
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el formulario "${target.name}"?`)) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        customForms: db.customForms.filter((f) => f.id !== id),
      });
      setSuccessMsg(`Formulario "${target.name}" eliminado.`);
    }
  };

  if (isBuilding) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              {editingForm ? `Editar: ${editingForm.name}` : "Nuevo Formulario Personalizado"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingForm
                ? `ID: ${editingForm.id} • Modifica los campos, reordena con Drag & Drop y vincula tablas 3D`
                : "Agrega campos, define reglas de negocio y construye la experiencia de compra"}
            </p>
          </div>

          <button
            onClick={() => {
              setIsBuilding(false);
              setEditingForm(undefined);
              if (editIdParam) router.replace("/admin/custom-forms");
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            ← Volver a la Lista
          </button>
        </div>

        <FormBuilder
          key={editingForm?.id || "new-form-instance"}
          initialForm={editingForm}
          formTypes={formTypes}
          customTables={customTables}
          renders={renders}
          onSave={handleSaveForm}
          onCancel={() => {
            setIsBuilding(false);
            setEditingForm(undefined);
            if (editIdParam) router.replace("/admin/custom-forms");
          }}
        />
      </div>
    );
  }

  // Previsualización activa en modal
  const activePreviewTable = customTables.find((t) => t.id === previewingForm?.customTableId);
  const activePreviewRender = renders.find((r) => r.id === activePreviewTable?.renderId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Módulo Formularios Personalizados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Crea, edita y personaliza formularios con constructor Drag & Drop. Vincula tablas dinámicas y visores 3D para productos o clientes.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Formulario (Drag & Drop)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-xs">
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
          <span className="text-xs text-slate-500 font-medium">
            Haz clic en <strong>Editar</strong> para modificar cualquier formulario existente
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {forms.map((form) => {
            const ftObj = formTypes.find((ft) => ft.id === form.formTypeId);
            const tblObj = customTables.find((t) => t.id === form.customTableId);
            const assignedProducts = products.filter((p) => p.formId === form.id);

            return (
              <div
                key={form.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {form.id}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{form.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ftObj?.name === "PRODUCTO"
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          : "bg-sky-100 text-sky-800 border border-sky-200"
                      }`}
                    >
                      {ftObj?.name || "General"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Elementos ({form.elements.length}):
                    </span>{" "}
                    {form.elements.map((e) => e.label).slice(0, 5).join(", ")}
                    {form.elements.length > 5 ? "..." : ""}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    {tblObj && (
                      <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <TableIcon className="w-3 h-3 text-indigo-600" />
                        Tabla: {tblObj.name}
                      </span>
                    )}

                    {assignedProducts.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Package className="w-3 h-3 text-emerald-600" />
                        Asignado a {assignedProducts.length}{" "}
                        {assignedProducts.length === 1 ? "producto" : "productos"} ({assignedProducts.map((p) => p.name).join(", ")})
                      </span>
                    ) : (
                      <span className="text-slate-400">Sin productos vinculados</span>
                    )}

                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Actualizado: {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString("es-CO") : "Inicial"}
                    </span>
                  </div>
                </div>

                {/* Acciones del Formulario */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewingForm(form)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                    title="Previsualizar cómo lo verá el cliente"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Probar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(form)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                    title="Duplicar como nuevo formulario"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duplicar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(form)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Formulario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Eliminar formulario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Previsualización y Prueba de Formulario */}
      {previewingForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Modo Prueba de Formulario
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {previewingForm.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingForm(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DynamicFormRenderer
              form={previewingForm}
              customTable={activePreviewTable}
              render3D={activePreviewRender}
              submitButtonText="Simular Envío de Petición"
              cancelButtonText="Cerrar Previsualización"
              onSubmit={(data, rows) => {
                alert(
                  `¡Formulario diligenciado correctamente!\n\nDatos capturados:\n${JSON.stringify(
                    data,
                    null,
                    2
                  )}\n\nFilas de tabla (unidades): ${rows ? rows.length : 0}`
                );
              }}
              onCancel={() => setPreviewingForm(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomFormsAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Cargando módulo de formularios personalizados...
        </div>
      }
    >
      <CustomFormsContent />
    </Suspense>
  );
}
