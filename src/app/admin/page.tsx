"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDatabase, DatabaseState } from "@/lib/data-store";
import {
  ShoppingBag,
  Package,
  FileText,
  Users,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { currentRole, currentProfile, hasAccess } = useAuth();
  const [db, setDb] = useState<DatabaseState | null>(null);

  useEffect(() => {
    setDb(getDatabase());
    const onDbChange = (e: any) => setDb(e.detail);
    window.addEventListener("grabamil_db_changed", onDbChange);
    return () => window.removeEventListener("grabamil_db_changed", onDbChange);
  }, []);

  if (!db) return null;

  const totalOrders = db.orders.length;
  const totalRevenue = db.orders
    .filter((o) => o.statusId === "st-recibida")
    .reduce((acc, o) => acc + o.total, 0);
  const totalProducts = db.products.length;
  const totalForms = db.customForms.length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sesión Activa: {currentRole?.name}
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Bienvenido al Panel GrabaMil
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Plataforma para compra de productos con cantidades dinámicas, formularios personalizados, seguimiento de pedidos, renders 3D e integración con Mercado Pago.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {hasAccess("orders") && (
              <Link
                href="/admin/orders"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <span>Ver Pedidos</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
            {hasAccess("custom_forms") && (
              <Link
                href="/admin/custom-forms"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Constructor Formularios</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ingresos Confirmados
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ${totalRevenue.toLocaleString("es-CO")}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pagos aprobados
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pedidos Totales
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Órdenes registradas</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Productos Catálogo
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalProducts}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">En inventario</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Formularios Activos
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalForms}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Dinámicos con D&D</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      {hasAccess("orders") && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Últimos Pedidos Registrados
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Ver todos &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {db.orders.slice(0, 3).map((order) => {
              const statusObj = db.orderStatuses.find((s) => s.id === order.statusId);
              return (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {order.orderNumber} • {order.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Cliente: {order.customerData.name} ({order.customerData.email})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: statusObj?.color || "#6b7280" }}
                    >
                      {statusObj?.name || "Sin estado"}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      ${order.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

