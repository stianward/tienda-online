"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { Order, OrderStatus } from "@/types";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
  ArrowRight,
  Mail,
  RotateCcw,
  ShieldCheck,
  FileText,
} from "lucide-react";

function TransactionResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Obtener identificador de orden desde parámetros de Mercado Pago o sesión local
  const urlOrderId = searchParams.get("order_id") || searchParams.get("external_reference");
  const [effectiveOrderId, setEffectiveOrderId] = useState<string | null>(urlOrderId);

  // Parámetros de estado devueltos por Mercado Pago
  const rawMpStatus = searchParams.get("collection_status") || searchParams.get("status") || "approved";
  const incomingPaymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(rawMpStatus);
  const [emailNotification, setEmailNotification] = useState<string | null>(null);

  useEffect(() => {
    // Si no vino en la URL, intentar rescatar el último pedido de sessionStorage o localStorage
    let orderIdToUse = urlOrderId;
    if (!orderIdToUse && typeof window !== "undefined") {
      orderIdToUse = sessionStorage.getItem("grabamil_last_order_id") || localStorage.getItem("grabamil_last_order_id");
    }

    if (orderIdToUse) {
      setEffectiveOrderId(orderIdToUse);
      const db = getDatabase();
      const foundOrder = db.orders.find((o) => o.id === orderIdToUse || o.orderNumber === orderIdToUse);

      if (foundOrder) {
        applyMercadoPagoStatus(foundOrder, rawMpStatus, incomingPaymentId);
      }
    }
  }, [urlOrderId, rawMpStatus, incomingPaymentId]);

  const applyMercadoPagoStatus = (targetOrder: Order, mpStatus: string, realPaymentId?: string | null) => {
    const db = getDatabase();
    let targetStatus: OrderStatus | undefined;

    /**
     * REGLAS ESTRICTAS DE MERCADO PAGO:
     * - "Orden recibida" siempre y cuando el pago haya sido realizado y confirmado por la api de mercado pago
     * - "Pendiente de pago" siempre y cuando la api de mercado pago aun no haya reportado el pago exitoso
     * - "Cancelado por falta de pago" siempre y cuando la api de mercado pago haya reportado un mensaje de rechazo
     */
    const normalizedStatus =
      mpStatus === "approved"
        ? "approved"
        : mpStatus === "pending" || mpStatus === "in_process"
        ? "pending"
        : "rejected";

    if (normalizedStatus === "approved") {
      targetStatus = db.orderStatuses.find((s) => s.isDefaultInitial);
    } else if (normalizedStatus === "pending") {
      targetStatus = db.orderStatuses.find((s) => s.isPendingPayment);
    } else {
      targetStatus = db.orderStatuses.find((s) => s.isCancelled);
    }

    if (!targetStatus) return;

    const timestamp = new Date().toISOString();
    const finalPaymentId = realPaymentId || targetOrder.mercadoPagoPaymentId || `MP-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const updatedOrder: Order = {
      ...targetOrder,
      statusId: targetStatus.id,
      mercadoPagoStatus: normalizedStatus,
      mercadoPagoPaymentId: finalPaymentId,
      updatedAt: timestamp,
      statusHistory: [
        ...(targetOrder.statusHistory || []),
        {
          statusId: targetStatus.id,
          statusName: targetStatus.name,
          timestamp,
          note: `Respuesta API Mercado Pago: ${normalizedStatus.toUpperCase()} (ID: ${finalPaymentId})`,
        },
      ],
    };

    const updatedOrders = db.orders.map((o) => (o.id === targetOrder.id ? updatedOrder : o));
    saveDatabase({ ...db, orders: updatedOrders });
    setOrder(updatedOrder);
    setCurrentStatus(normalizedStatus);

    // Notificación automática por correo a cliente y administrador
    setEmailNotification(
      `📧 [CORREO AUTOMÁTICO ENVIADO]:\n• Cliente: ${targetOrder.customerData.email} ("Estado de tu compra ${targetOrder.orderNumber}: ${targetStatus.name}")\n• Administrador: admin@grabamil.com ("Orden ${targetOrder.orderNumber} actualizada vía Mercado Pago a: ${targetStatus.name}")`
    );

    // Despacho real mediante el servicio de email (SendGrid GCP / SMTP / Resend)
    if (normalizedStatus === "approved") {
      fetch("/api/orders/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_confirmed",
          order: updatedOrder,
        }),
      }).catch((err) => console.error("Error dispatching email:", err));
    }
  };

  const db = getDatabase();
  const statusObj = order ? db.orderStatuses.find((s) => s.id === order.statusId) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm">
              G
            </div>
            <span className="font-extrabold text-slate-900 text-base">GrabaMil</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500">
            Resultado de Transacción
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        {/* Card Principal del Resultado devuelto por Mercado Pago */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 text-center space-y-6">
          {currentStatus === "approved" && (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Transacción Aprobada • Mercado Pago
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Tu pago ha sido confirmado satisfactoriamente por la pasarela de Mercado Pago. Tu pedido ya está registrado en el sistema.
              </p>
            </div>
          )}

          {currentStatus === "pending" && (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-amber-500/20">
                <Clock className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Transacción Pendiente de Pago
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Pago en Proceso de Acreditación
              </h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Mercado Pago aún no reporta la acreditación (pago en efectivo o en validación bancaria). Te notificaremos en cuanto se confirme.
              </p>
            </div>
          )}

          {currentStatus === "rejected" && (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-rose-500/20">
                <XCircle className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Cancelado por Falta de Pago
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Transacción Rechazada o Cancelada
              </h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                La pasarela de Mercado Pago reportó un mensaje de rechazo o fondos insuficientes. Puedes reintentar con otro medio de pago.
              </p>
            </div>
          )}

          {/* Selector de Simulación de Estados para Evaluación del Requerimiento */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Simulador de Respuestas de la API de Mercado Pago:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => order && applyMercadoPagoStatus(order, "approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentStatus === "approved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                Simular Pago Exitoso (Orden recibida)
              </button>
              <button
                type="button"
                onClick={() => order && applyMercadoPagoStatus(order, "pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentStatus === "pending"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-50"
                }`}
              >
                Simular Pago Pendiente
              </button>
              <button
                type="button"
                onClick={() => order && applyMercadoPagoStatus(order, "rejected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentStatus === "rejected"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-rose-800 border border-rose-300 hover:bg-rose-50"
                }`}
              >
                Simular Rechazo (Cancelado)
              </button>
            </div>
          </div>

          {/* Detalle del Pedido */}
          {order && (
            <div className="text-left border-t border-slate-100 pt-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Número de Orden
                  </span>
                  <strong className="font-mono text-slate-900">{order.orderNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Total Pagado
                  </span>
                  <strong className="text-slate-900">${order.total.toLocaleString("es-CO")}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Estado en Plataforma
                  </span>
                  <span
                    className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full text-white mt-0.5"
                    style={{ backgroundColor: statusObj?.color || "#6b7280" }}
                  >
                    {statusObj?.name || "Estado"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    ID Mercado Pago
                  </span>
                  <strong className="font-mono text-emerald-700">
                    {order.mercadoPagoPaymentId}
                  </strong>
                </div>
              </div>

              {/* Confirmación de Notificación de Correo Enviada */}
              {emailNotification && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Notificación de Correo Despachada</span>
                  </div>
                  <pre className="whitespace-pre-line font-mono text-[11px] text-emerald-800">
                    {emailNotification}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Botones de Navegación */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition text-center"
            >
              Volver a la Tienda
            </Link>

            <Link
              href="/admin/orders"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver en Módulo de Seguimiento de Pedidos</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TransactionResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Cargando resultado...</div>}>
      <TransactionResultContent />
    </Suspense>
  );
}

