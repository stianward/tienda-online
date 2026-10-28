"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { Render3D } from "@/types";
import { Box, Plus, Trash2, Upload, CheckCircle2, Eye, ShieldCheck } from "lucide-react";
import Secure3DRenderViewer from "@/components/renders/Secure3DRenderViewer";

export default function RendersAdminPage() {
  const [renders, setRenders] = useState<Render3D[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [selectedPreview, setSelectedPreview] = useState<Render3D | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setRenders(db.renders);
    if (db.renders.length > 0 && !selectedPreview) {
      setSelectedPreview(db.renders[0]);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  // Manejar subida de archivo HTML
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      alert("Por favor selecciona un archivo con extensión .html");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsText(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !htmlContent.trim()) return;

    const db = getDatabase();
    const newId = `render-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newRender: Render3D = {
      id: newId,
      name: name.trim(),
      htmlContent: htmlContent.trim(),
      createdAt: new Date().toISOString(),
    };

    saveDatabase({ ...db, renders: [...db.renders, newRender] });
    setSuccessMsg(`Render 3D "${newRender.name}" guardado exitosamente (ID: ${newRender.id}).`);
    setName("");
    setHtmlContent("");
    setShowModal(false);
    setSelectedPreview(newRender);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Deseas eliminar esta estructura de render 3D?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        renders: db.renders.filter((r) => r.id !== id),
      });
      if (selectedPreview?.id === id) {
        setSelectedPreview(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-6 h-6 text-indigo-600" />
            Módulo de Renderizado 3D
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sube o edita archivos HTML con la estructura del render 3D. Se visualizan en un sandbox aislado seguro para protección contra XSS.
          </p>
        </div>

        <button
          onClick={() => {
            setName("");
            setHtmlContent("");
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Archivo HTML de Render</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Lista de renders + Visor activo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Renders Registrados ({renders.length})
            </h3>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sandbox Protegido
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {renders.map((render) => {
              const isSelected = selectedPreview?.id === render.id;
              return (
                <div
                  key={render.id}
                  onClick={() => setSelectedPreview(render)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? "bg-indigo-50/70 border-l-4 border-indigo-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {render.id}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900">{render.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Subido el {new Date(render.createdAt).toLocaleDateString("es-CO")} • {render.htmlContent.length} bytes
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreview(render);
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Ver 3D</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(render.id);
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

        {/* Visor 3D en Vivo */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Previsualización en Tiempo Real
            </h3>
            {selectedPreview && (
              <span className="text-xs font-semibold text-indigo-600">
                {selectedPreview.name}
              </span>
            )}
          </div>

          {selectedPreview ? (
            <Secure3DRenderViewer
              htmlContent={selectedPreview.htmlContent}
              renderName={selectedPreview.name}
              height="380px"
            />
          ) : (
            <div className="h-64 rounded-xl border border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Box className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold">Selecciona un render para previsualizarlo</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Subir / Crear Render */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Subir Render HTML
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Render
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Anillo Láser Giratorio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subir archivo .html con la estructura del render
                </label>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  O edita/pega el código HTML directamente
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="<!DOCTYPE html><html><head>...</head><body>...</body></html>"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-slate-100"
                />
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
                  Guardar Render
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

