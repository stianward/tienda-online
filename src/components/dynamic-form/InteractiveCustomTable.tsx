"use client";

import React, { useState } from "react";
import { CustomTable, Render3D } from "@/types";
import { Plus, Trash2, Box, Eye, Sparkles, X, RotateCcw } from "lucide-react";
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

  // REQUERIMIENTO: La previsualización 3D se cargará en estado inicial OCULTO
  // Se abre en una ventana modal cuando el usuario hace clic en "Visualizar en 3D"
  const [is3DModalOpen, setIs3DModalOpen] = useState<boolean>(false);
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
      {/* Barra de cabecera de la tabla */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100">{tableConfig.name}</h4>
              <span className="text-[10px] font-bold bg-indigo-600/60 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                {rows.length} {rows.length === 1 ? "unidad" : "unidades"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cada fila agregada representa 1 unidad del producto en el valor del pedido.
            </p>
          </div>
        </div>

        {/* Botón para abrir el Modal de Previsualización 3D (Oculto inicialmente) */}
        {renderConfig && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIs3DModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>Visualizar en 3D</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </button>
          </div>
        )}
      </div>

      {/* Tabla interactiva a ancho completo */}
      <div className="space-y-3">
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
                {renderConfig && (
                  <th className="py-2.5 px-2 text-xs font-semibold text-center w-24">Visor 3D</th>
                )}
                {!readOnly && (
                  <th className="py-2.5 px-2 text-xs font-semibold text-center w-14">Acción</th>
                )}
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
                    <td className="py-2.5 px-3 text-center text-xs font-bold text-slate-500">
                      {rIdx + 1}
                    </td>

                    {tableConfig.columns.map((col) => (
                      <td key={col.id} className="py-2 px-2.5">
                        {readOnly ? (
                          <span className="text-slate-800 text-sm font-medium">{row[col.id] || "—"}</span>
                        ) : col.type === "select" && col.options ? (
                          <select
                            value={String(row[col.id] || "")}
                            onChange={(e) => handleCellChange(rIdx, col.id, e.target.value)}
                            className="w-full text-base sm:text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg py-2 sm:py-1.5 px-2.5 sm:px-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px] sm:min-h-0"
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
                            className="w-full text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 sm:py-1.5 px-2.5 sm:px-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 min-h-[40px] sm:min-h-0"
                          />
                        )}
                      </td>
                    ))}

                    {/* Botón para enfocar y abrir modal 3D para este registro */}
                    {renderConfig && (
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRowIndex(rIdx);
                            setIs3DModalOpen(true);
                          }}
                          title="Abrir este registro en el visor 3D"
                          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition min-h-[40px] cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ver 3D</span>
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
                          className={`p-2.5 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer ${
                            rows.length <= 1
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                          title="Eliminar fila (reduce 1 unidad del pedido)"
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
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-4 py-3 rounded-xl border border-indigo-200 transition shadow-xs cursor-pointer w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar otra pieza / fila (+1 unidad al pedido)</span>
            </button>
            <span className="text-[11px] text-slate-500 text-center sm:text-right">
              Total filas en tabla: <strong>{rows.length}</strong> (representa <strong>{rows.length}</strong> {rows.length === 1 ? "unidad" : "unidades"} a cobrar)
            </span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DE PREVISUALIZACIÓN 3D (Requerimiento explícito) */}
      {/* ======================================================== */}
      {is3DModalOpen && renderConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-700 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh]">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Previsualización 3D en Vivo</span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      Sandbox Seguro
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {renderConfig.name} • Visualizando fila #{selectedRowIndex + 1}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIs3DModalOpen(false)}
                className="text-slate-400 hover:text-white p-2.5 hover:bg-slate-700/80 rounded-xl transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                title="Cerrar ventana 3D"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal: Selector rápido de fila y Visor 3D */}
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              {/* Barra para alternar filas dentro del modal */}
              <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-300 font-medium">
                  Registro visualizado:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {rows.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedRowIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        selectedRowIndex === idx
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Fila #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visor 3D Seguro aislado */}
              <Secure3DRenderViewer
                htmlContent={renderConfig.htmlContent}
                renderName={renderConfig.name}
                activeRowData={activeRowData}
                height="420px"
              />
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Texto proyectado: <strong className="text-sky-300">{String(activeRowData["col-1"] || "—")}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIs3DModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
