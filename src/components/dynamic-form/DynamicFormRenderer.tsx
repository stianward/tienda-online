"use client";

import React, { useState } from "react";
import { CustomForm, CustomTable, Render3D } from "@/types";
import InteractiveCustomTable from "./InteractiveCustomTable";
import { X, Send } from "lucide-react";

interface DynamicFormRendererProps {
  form: CustomForm;
  customTable?: CustomTable | null;
  render3D?: Render3D | null;
  initialValues?: Record<string, any>;
  initialTableRows?: Record<string, string | number>[];
  onTableRowsChange?: (rows: Record<string, string | number>[]) => void;
  onSubmit: (formData: Record<string, any>, tableRows?: Record<string, string | number>[]) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  className?: string;
}

export default function DynamicFormRenderer({
  form,
  customTable,
  render3D,
  initialValues = {},
  initialTableRows = [],
  onTableRowsChange,
  onSubmit,
  onCancel,
  submitButtonText,
  cancelButtonText,
  className = "",
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [tableRows, setTableRows] = useState<Record<string, string | number>[]>(initialTableRows);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTableRowsUpdate = (newRows: Record<string, string | number>[]) => {
    setTableRows(newRows);
    if (onTableRowsChange) {
      onTableRowsChange(newRows);
    }
  };

  const handleInputChange = (elementId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [elementId]: value,
    }));
    // Limpiar error al escribir
    if (errors[elementId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[elementId];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obligatorios
    const newErrors: Record<string, string> = {};
    form.elements.forEach((elem) => {
      if (elem.required && !elem.type.startsWith("button_") && elem.type !== "label") {
        const val = formData[elem.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          newErrors[elem.id] = `El campo "${elem.label}" es obligatorio.`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mapear elementos por label para que los datos sean legibles en el pedido
    const readableData: Record<string, any> = {};
    form.elements.forEach((elem) => {
      if (!elem.type.startsWith("button_") && elem.type !== "label" && elem.type !== "custom_table") {
        readableData[elem.label || elem.id] = formData[elem.id];
      }
    });

    onSubmit(readableData, customTable ? tableRows : undefined);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  // Ordenar elementos
  const sortedElements = [...form.elements].sort((a, b) => a.order - b.order);

  // Determinar si hay botones explícitos en la definición del formulario
  const hasCustomSubmit = sortedElements.some((e) => e.type === "button_submit");
  const hasCustomCancel = sortedElements.some((e) => e.type === "button_cancel");

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {sortedElements.map((elem) => {
        switch (elem.type) {
          case "label":
            return (
              <div key={elem.id} className="pt-2 pb-1 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-800">{elem.label}</h3>
                {elem.placeholder && <p className="text-xs text-slate-500 mt-0.5">{elem.placeholder}</p>}
              </div>
            );

          case "text":
          case "email":
          case "address":
          case "number":
            return (
              <div key={elem.id} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {elem.label}
                  {elem.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <input
                  type={elem.type === "number" ? "number" : elem.type === "email" ? "email" : "text"}
                  placeholder={elem.placeholder || `Ingresa ${elem.label.toLowerCase()}`}
                  value={formData[elem.id] ?? ""}
                  onChange={(e) => handleInputChange(elem.id, e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition ${
                    errors[elem.id]
                      ? "border-rose-300 ring-rose-200 focus:ring-rose-400"
                      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
                {errors[elem.id] && <p className="text-xs text-rose-500 font-medium">{errors[elem.id]}</p>}
              </div>
            );

          case "select":
            return (
              <div key={elem.id} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {elem.label}
                  {elem.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <select
                  value={formData[elem.id] ?? ""}
                  onChange={(e) => handleInputChange(elem.id, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium text-slate-800"
                >
                  <option value="">{elem.placeholder || "-- Seleccione una opción --"}</option>
                  {elem.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors[elem.id] && <p className="text-xs text-rose-500 font-medium">{errors[elem.id]}</p>}
              </div>
            );

          case "radio":
            return (
              <div key={elem.id} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {elem.label}
                  {elem.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {elem.options?.map((opt) => {
                    const isChecked = formData[elem.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                          isChecked
                            ? "border-indigo-500 bg-indigo-50/70 text-indigo-900 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name={elem.id}
                          value={opt}
                          checked={isChecked}
                          onChange={() => handleInputChange(elem.id, opt)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
                {errors[elem.id] && <p className="text-xs text-rose-500 font-medium">{errors[elem.id]}</p>}
              </div>
            );

          case "custom_table":
            if (!customTable) return null;
            return (
              <div key={elem.id} className="pt-2">
                <InteractiveCustomTable
                  tableConfig={customTable}
                  renderConfig={render3D}
                  value={tableRows}
                  onChange={handleTableRowsUpdate}
                />
              </div>
            );

          case "button_cancel":
            return (
              <button
                key={elem.id}
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition"
              >
                <X className="w-4 h-4" />
                <span>{cancelButtonText || elem.label || "Cancelar"}</span>
              </button>
            );

          case "button_submit":
            return (
              <button
                key={elem.id}
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition"
              >
                <Send className="w-4 h-4" />
                <span>{submitButtonText || elem.label || "Enviar Petición"}</span>
              </button>
            );

          default:
            return null;
        }
      })}

      {/* Si el formulario no tenía botones explícitos, agregar la botonera por defecto */}
      {(!hasCustomSubmit || !hasCustomCancel) && (
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
          {!hasCustomCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition"
            >
              {cancelButtonText || "Cancelar"}
            </button>
          )}
          {!hasCustomSubmit && (
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitButtonText || "Enviar Petición"}</span>
            </button>
          )}
        </div>
      )}
    </form>
  );
}

