"use client";

import React, { useState, useEffect } from "react";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { Order, OrderStatus } from "@/types";
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock,
  User,
  CreditCard,
  FileText,
  Table,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [emailNotificationMsg, setEmailNotificationMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const refreshData = () => {
    const db = getDatabase();
    setOrders(db.orders);
    setStatuses(db.orderStatuses);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("grabamil_db_changed", refreshData);
    return () => window.removeEventListener("grabamil_db_changed", refreshData);
  }, []);

  const toggleAccordion = (orderId: string) => {
    setOpenAccordionId((prev) => (prev === orderId ? null : orderId));
  };

  // REGLA: Cada actualizado de estado, generará un envío de correo electrónico al cliente y al administrador de la plataforma
  const handleStatusChange = (orderId: string, newStatusId: string) => {
    const db = getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return;

    const newStatusObj = db.orderStatuses.find((s) => s.id === newStatusId);
    if (!newStatusObj) return;

    const timestamp = new Date().toISOString();
    const updatedHistory = [
      ...(order.statusHistory || []),
      {
        statusId: newStatusId,
        statusName: newStatusObj.name,
        timestamp,
        note: `Estado actualizado manualmente por el administrador a "${newStatusObj.name}"`,
      },
    ];

    const updatedOrders = db.orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            statusId: newStatusId,
            updatedAt: timestamp,
            statusHistory: updatedHistory,
          }
        : o
    );

    saveDatabase({ ...db, orders: updatedOrders });

    // Notificación de Correo Electrónico generada
    setEmailNotificationMsg(
      `📧 [NOTIFICACIÓN DE CORREO ENVIADA]:\n• Destinatario Cliente: ${order.customerData.email} ("Tu pedido ${order.orderNumber} cambió a: ${newStatusObj.name}")\n• Destinatario Administrador: admin@grabamil.com ("Actualización de estado en orden ${order.orderNumber}")`
    );

    // Despacho real de correo de actualización de estado
    fetch("/api/orders/notify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "status_changed",
        order: { ...order, statusId: newStatusId },
        newStatus: newStatusObj,
        note: `Estado actualizado a "${newStatusObj.name}"`,
      }),
    }).catch((err) => console.error("Error dispatching status email:", err));

    setTimeout(() => {
      setEmailNotificationMsg(null);
    }, 8000);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "all") return true;
    return o.statusId === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            Módulo de Seguimiento de Pedidos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Revisa el detalle tipo acordeón con la información de facturación y el formulario personalizado de cada producto.
          </p>
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-600">Filtrar por estado:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-medium bg-transparent text-slate-800 focus:outline-none"
          >
            <option value="all">Todos los pedidos ({orders.length})</option>
            {statuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerta de Envío de Correo Electrónico en Vivo */}
      {emailNotificationMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-start gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-800">
              Notificación Automática por Correo Enviada con Éxito
            </h4>
            <p className="whitespace-pre-line font-mono text-[11px] text-emerald-700">
              {emailNotificationMsg}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Pedidos tipo Acordeón */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isOpen = openAccordionId === order.id;
          const statusObj = statuses.find((s) => s.id === order.statusId);

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
            >
              {/* Cabecera del Acordeón */}
              <div
                onClick={() => toggleAccordion(order.id)}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {order.orderNumber}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {order.productName} (x{order.quantity})
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cliente: <strong>{order.customerData.name}</strong> • Correo: {order.customerData.email} • Fecha: {new Date(order.createdAt).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Pagado</p>
                    <p className="text-sm font-black text-slate-900">
                      ${order.total.toLocaleString("es-CO")}
                    </p>
                  </div>

                  {/* Select para actualizar el estado del pedido */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5"
                  >
                    <select
                      value={order.statusId}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {statuses.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Badge de color del estado */}
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm shrink-0"
                    style={{ backgroundColor: statusObj?.color || "#6b7280" }}
                  >
                    {statusObj?.name || "Estado"}
                  </span>

                  <button className="text-slate-400 p-1">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Contenido Desplegable del Acordeón */}
              {isOpen && (
                <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Datos de Facturación y Cliente */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        Módulo de Facturación y Despacho
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nombre del Cliente:</span>
                          <strong className="text-slate-800">{order.customerData.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Correo Electrónico:</span>
                          <strong className="text-slate-800">{order.customerData.email}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Teléfono:</span>
                          <strong className="text-slate-800">{order.customerData.phone || "No especificado"}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Dirección de Entrega:</span>
                          <strong className="text-slate-800">{order.customerData.address || "No especificada"}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">ID Transacción Mercado Pago:</span>
                          {order.mercadoPagoPaymentId && order.mercadoPagoPaymentId !== "null" ? (
                            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              {order.mercadoPagoPaymentId}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {order.mercadoPagoStatus === "rejected"
                                ? "Sin ID (Rechazado)"
                                : "Pendiente de Pasarela"}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Estado de Pago Mercado Pago:</span>
                          {order.mercadoPagoStatus === "approved" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Aprobado
                            </span>
                          ) : order.mercadoPagoStatus === "rejected" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              Rechazado
                            </span>
                          ) : order.mercadoPagoStatus === "pending" || order.mercadoPagoStatus === "in_process" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              Sin procesar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Formulario Personalizado Diligenciado */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600" />
                        Formulario Personalizado Implementado
                      </h4>
                      {Object.keys(order.customFormData || {}).length > 0 ? (
                        <div className="space-y-1.5 text-xs">
                          {Object.entries(order.customFormData).map(([label, val]) => (
                            <div key={label} className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">{label}:</span>
                              <strong className="text-slate-800 text-right">{String(val || "—")}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Sin datos de campos personalizados.</p>
                      )}
                    </div>
                  </div>

                  {/* 3. Filas de Tabla Personalizada (con 3D) si existen */}
                  {order.tableData && order.tableData.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Table className="w-4 h-4 text-purple-600" />
                        Registros de Tabla Personalizada Diligenciados por el Cliente
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 uppercase font-bold">
                            <tr>
                              <th className="py-2 px-3">#</th>
                              {Object.keys(order.tableData[0]).map((key) => (
                                <th key={key} className="py-2 px-3">
                                  {key === "col-1" ? "Texto a Grabar" : key === "col-2" ? "Tipografía" : key === "col-3" ? "Posición" : key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {order.tableData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                                {Object.values(row).map((val, cIdx) => (
                                  <td key={cIdx} className="py-2 px-3 font-semibold text-slate-800">
                                    {String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 4. Historial de Estados y Notificaciones */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      Historial de Estados y Envíos de Notificaciones
                    </h4>
                    <div className="space-y-1.5">
                      {order.statusHistory?.map((h, hIdx) => (
                        <div key={hIdx} className="text-xs flex items-center gap-2 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800">{h.statusName}</span>
                          <span className="text-[11px] text-slate-400">
                            ({new Date(h.timestamp).toLocaleString("es-CO")})
                          </span>
                          {h.note && <span className="text-slate-500 italic">— {h.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold">No se encontraron pedidos con el estado seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

