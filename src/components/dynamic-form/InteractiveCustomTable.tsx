"use client";

import React, { useState } from "react";
import { CustomTable, Render3D } from "@/types";
import { Plus, Trash2, Box, Eye, EyeOff, Sparkles } from "lucide-react";
import Secure3DRenderViewer from "@/components/renders/Secure3DRenderViewer";

interface InteractiveCustomTableProps {
  tableConfig: CustomTable;
  renderConfig?: Render3D | null;
  value?: Record<string, string | number>[];
  onChange?: (rows: Record<string, string | number>[]) => void;
  readOnly?: boolean;
}

export default function InteractiveCustomTable({
  tableConfig,
  renderConfig,
  value,
  onChange,
  readOnly = false,
}: InteractiveCustomTableProps) {
  // Filas actuales (controladas o por defecto)
  const [rows, setRows] = useState<Record<string, string | number>[]>(() => {
    if (value && value.length > 0) return value;
    if (tableConfig.initialRows && tableConfig.initialRows.length > 0) return tableConfig.initialRows;
    // Fila inicial por defecto si está vacía
    const defaultRow: Record<string, string | number> = {};
    tableConfig.columns.forEach((col) => {
      defaultRow[col.id] = col.type === "number" ? 1 : "";
    });
    return [defaultRow];
  });

  // Toggle de previsualización 3D (REGLA OBLIGATORIA DEL REQUERIMIENTO)
  const [show3DPreview, setShow3DPreview] = useState<boolean>(true);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  const updateRows = (newRows: Record<string, string | number>[]) => {
    setRows(newRows);
    if (onChange) {
      onChange(newRows);
    }
    if (selectedRowIndex >= newRows.length) {
      setSelectedRowIndex(Math.max(0, newRows.length - 1));
    }
  };

  const handleCellChange = (rowIndex: number, columnId: string, val: string | number) => {
    const updated = [...rows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [columnId]: val,
    };
    updateRows(updated);
  };

  const handleAddRow = () => {
    const newRow: Record<string, string | number> = {};
    tableConfig.columns.forEach((col) => {
      newRow[col.id] = col.type === "number" ? 1 : col.type === "select" ? (col.options?.[0] || "") : "";
    });
    const updated = [...rows, newRow];
    updateRows(updated);
    setSelectedRowIndex(updated.length - 1);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return; // Mantener al menos una fila
    const updated = rows.filter((_, i) => i !== index);
    updateRows(updated);
  };

  const activeRowData = rows[selectedRowIndex] || rows[0];

  return (
    <div className="w-full space-y-4 my-4">
      {/* Barra de cabecera con Toggle de Previsualización 3D */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{tableConfig.name}</h4>
            <p className="text-xs text-slate-400">
              {rows.length} {rows.length === 1 ? "registro configurado" : "registros configurados"}
            </p>
          </div>
        </div>

        {/* Toggle de Previsualización 3D (Requerimiento explícito) */}
        {renderConfig && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShow3DPreview(!show3DPreview)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                show3DPreview
                  ? "bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-500"
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              }`}
            >
              {show3DPreview ? <Eye className="w-4 h-4 text-emerald-300" /> : <EyeOff className="w-4 h-4" />}
              <span>Previsualizar en 3D</span>
              <span className={`w-2 h-2 rounded-full ${show3DPreview ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Tabla interactiva */}
        <div className={show3DPreview && renderConfig ? "lg:col-span-7 space-y-3" : "lg:col-span-12 space-y-3"}>
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-xs font-semibold w-12 text-center">#</th>
                  {tableConfig.columns.map((col) => (
                    <th key={col.id} className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wider">
                      {col.header}
                    </th>
                  ))}
                  {renderConfig && <th className="py-2.5 px-2 text-xs font-semibold text-center w-14">3D</th>}
                  {!readOnly && <th className="py-2.5 px-2 text-xs font-semibold text-center w-12">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => {
                  const isSelected = selectedRowIndex === rIdx;
                  return (
                    <tr
                      key={rIdx}
                      onClick={() => setSelectedRowIndex(rIdx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-xs font-medium text-slate-400">
                        {rIdx + 1}
                      </td>

                      {tableConfig.columns.map((col) => (
                        <td key={col.id} className="py-2 px-2.5">
                          {readOnly ? (
                            <span className="text-slate-800 text-sm">{row[col.id] || "—"}</span>
                          ) : col.type === "select" && col.options ? (
                            <select
                              value={String(row[col.id] || "")}
                              onChange={(e) => handleCellChange(rIdx, col.id, e.target.value)}
                              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                              {col.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type === "number" ? "number" : "text"}
                              value={row[col.id] ?? ""}
                              onChange={(e) =>
                                handleCellChange(
                                  rIdx,
                                  col.id,
                                  col.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                                )
                              }
                              placeholder={col.header}
                              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                            />
                          )}
                        </td>
                      ))}

                      {/* Botón para enfocar en 3D */}
                      {renderConfig && (
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRowIndex(rIdx);
                              setShow3DPreview(true);
                            }}
                            title="Ver este registro en 3D"
                            className={`p-1.5 rounded-md transition ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </td>
                      )}

                      {!readOnly && (
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            disabled={rows.length <= 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRow(rIdx);
                            }}
                            className={`p-1.5 rounded-md transition ${
                              rows.length <= 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            }`}
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!readOnly && (
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg border border-indigo-200 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar fila de especificación</span>
              </button>
              <span className="text-[11px] text-slate-500">
                Selecciona una fila para proyectar su contenido en el modelo 3D
              </span>
            </div>
          )}
        </div>

        {/* Panel del Visor 3D Reactivo */}
        {show3DPreview && renderConfig && (
          <div className="lg:col-span-5">
            <Secure3DRenderViewer
              htmlContent={renderConfig.htmlContent}
              renderName={renderConfig.name}
              activeRowData={activeRowData}
              height="350px"
            />
          </div>
        )}
      </div>
    </div>
  );
}

