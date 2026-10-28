"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { OrderStatus } from "@/types";
import { Activity, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function OrderStatusesAdminPage() {
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = () => {
    const db = getDatabase();
    setStatuses(db.orderStatuses);
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
    const newId = `st-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newStatus: OrderStatus = {
      id: newId,
      name: name.trim(),
      color: color,
      createdAt: new Date().toISOString(),
    };

    saveDatabase({ ...db, orderStatuses: [...db.orderStatuses, newStatus] });
    setSuccessMsg(`Estado de pedido "${newStatus.name}" creado con éxito (ID: ${newStatus.id}).`);
    setName("");
    setColor("#3b82f6");
  };

  const handleDelete = (id: string) => {
    const target = statuses.find((s) => s.id === id);
    if (target?.isDefaultInitial || target?.isPendingPayment || target?.isCancelled) {
      alert("No se puede eliminar un estado base del ciclo de Mercado Pago.");
      return;
    }

    if (confirm("¿Deseas eliminar este estado?")) {
      const db = getDatabase();
      saveDatabase({
        ...db,
        orderStatuses: db.orderStatuses.filter((s) => s.id !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Módulo Estados de Pedidos
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configuración de estados y colores utilizados para el seguimiento en tiempo real y notificaciones por correo.
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
        <h3 className="text-sm font-bold text-slate-900 mb-3">Nuevo Estado de Pedido</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Ej. En Control de Calidad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2 py-1 bg-white">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <span className="text-xs font-mono text-slate-600">{color}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Estado</span>
          </button>
        </form>
      </div>

      {/* Tabla de Estados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID Único</th>
                <th className="py-3 px-4">Nombre del Estado</th>
                <th className="py-3 px-4">Color Identificador</th>
                <th className="py-3 px-4">Tipo en Ciclo Mercado Pago</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statuses.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {st.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <span>{st.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm inline-block"
                      style={{ backgroundColor: st.color }}
                    >
                      {st.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {st.isDefaultInitial && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        Inicial (Pago Exitoso)
                      </span>
                    )}
                    {st.isPendingPayment && (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                        Pendiente de Pago
                      </span>
                    )}
                    {st.isCancelled && (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold border border-rose-200">
                        Cancelado (Rechazado)
                      </span>
                    )}
                    {!st.isDefaultInitial && !st.isPendingPayment && !st.isCancelled && (
                      <span className="text-slate-500">Personalizado</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(st.id)}
                      disabled={st.isDefaultInitial || st.isPendingPayment || st.isCancelled}
                      className={`p-1.5 rounded-lg transition ${
                        st.isDefaultInitial || st.isPendingPayment || st.isCancelled
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                      title={
                        st.isDefaultInitial || st.isPendingPayment || st.isCancelled
                          ? "Estado protegido del sistema"
                          : "Eliminar"
                      }
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

