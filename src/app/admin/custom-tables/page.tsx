"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { CustomTable, TableColumn, Render3D } from "@/types";
import { Table, Plus, Trash2, CheckCircle2, Box, Eye } from "lucide-react";
import InteractiveCustomTable from "@/components/dynamic-form/InteractiveCustomTable";

export default function CustomTablesAdminPage() {
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [renders, setRenders] = useState<Render3D[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [tableName, setTableName] = useState("");
  const [renderId, setRenderId] = useState("");
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: "col-1", header: "Texto o Detalle", type: "text" },
    { id: "col-2", header: "Cantidad o Medida", type: "number" },
  ]);

  const [previewTable, setPreviewTable] = useState<CustomTable | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setTables(db.customTables);
    setRenders(db.renders);
    if (db.customTables.length > 0 && !previewTable) {
      setPreviewTable(db.customTables[0]);
    }
    if (db.renders.length > 0 && !renderId) {
      setRenderId(db.renders[0].id);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const handleAddColumn = () => {
    const newColId = `col-${Date.now().toString(36)}`;
    setColumns((prev) => [
      ...prev,
      { id: newColId, header: `Nueva Columna ${prev.length + 1}`, type: "text" },
    ]);
  };

  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const handleColumnChange = (colId: string, field: keyof TableColumn, val: any) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === colId ? { ...col, [field]: val } : col))
    );
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || columns.length === 0) return;

    const db = getDatabase();
    const newId = `tbl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newTable: CustomTable = {
      id: newId,
      name: tableName.trim(),
      columns: columns,
      renderId: renderId || undefined,
      initialRows: [
        columns.reduce((acc, c) => ({ ...acc, [c.id]: c.type === "number" ? 1 : "" }), {}),
      ],
      createdAt: new Date().toISOString(),
    };

    saveDatabase({ ...db, customTables: [...db.customTables, newTable] });
    setSuccessMsg(`Tabla personalizada "${newTable.name}" creada con éxito (ID: ${newTable.id}).`);
    setTableName("");
    setShowModal(false);
    setPreviewTable(newTable);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Deseas eliminar esta tabla personalizada?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        customTables: db.customTables.filter((t) => t.id !== id),
      });
      if (previewTable?.id === id) {
        setPreviewTable(null);
      }
    }
  };

  const activeRender = renders.find((r) => r.id === previewTable?.renderId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-6 h-6 text-indigo-600" />
            Módulo de Tablas Personalizadas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Crea estructuras de tablas dinámicas con columnas y encabezados personalizados, vinculadas al renderizado 3D interactivo.
          </p>
        </div>

        <button
          onClick={() => {
            setTableName("");
            setColumns([
              { id: "col-1", header: "Texto a Grabar", type: "text" },
              { id: "col-2", header: "Profundidad (mm)", type: "number" },
            ]);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Tabla Personalizada</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Listado de Tablas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Tablas Creadas ({tables.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {tables.map((tbl) => {
            const isSelected = previewTable?.id === tbl.id;
            const rObj = renders.find((r) => r.id === tbl.renderId);
            return (
              <div
                key={tbl.id}
                onClick={() => setPreviewTable(tbl)}
                className={`p-4 flex items-center justify-between cursor-pointer transition ${
                  isSelected ? "bg-indigo-50/70 border-l-4 border-indigo-600" : "hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {tbl.id}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">{tbl.name}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500">
                      Columnas ({tbl.columns.length}): {tbl.columns.map((c) => c.header).join(", ")}
                    </span>
                    {rObj && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        <Box className="w-3 h-3" />
                        {rObj.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTable(tbl);
                    }}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Interactuar</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tbl.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previsualización en Vivo de la Tabla y su 3D */}
      {previewTable && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Previsualización Interactiva: {previewTable.name}
              </h3>
              <p className="text-xs text-slate-500">
                Esta es la experiencia exacta que tendrá el cliente final al configurar su pedido.
              </p>
            </div>
            {activeRender && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Render 3D Asignado: {activeRender.name}
              </span>
            )}
          </div>

          <InteractiveCustomTable
            tableConfig={previewTable}
            renderConfig={activeRender}
          />
        </div>
      )}

      {/* Modal Crear Tabla */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-600" />
                Nueva Tabla Personalizada
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Tabla
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Parámetros de Grabado Láser"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Renderizado (Estructura 3D asociada)
                </label>
                <select
                  value={renderId}
                  onChange={(e) => setRenderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">-- Sin render 3D --</option>
                  {renders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Permite que cada fila de la tabla se renderice en 3D en tiempo real con el toggle de previsualizar.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Definición de Columnas ({columns.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Columna</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {columns.map((col, idx) => (
                    <div
                      key={col.id}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Encabezado de columna"
                        value={col.header}
                        onChange={(e) => handleColumnChange(col.id, "header", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
                      />
                      <select
                        value={col.type}
                        onChange={(e) =>
                          handleColumnChange(col.id, "type", e.target.value as any)
                        }
                        className="w-28 px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
                      >
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                      </select>
                      <button
                        type="button"
                        disabled={columns.length <= 1}
                        onClick={() => handleRemoveColumn(col.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
                  Crear Tabla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

