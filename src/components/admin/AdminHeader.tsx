"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { resetDatabaseToDefault } from "@/lib/data-store";
import { UserCheck, RotateCcw, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function AdminHeader() {
  const { currentUser, allUsers, loginAs, currentRole } = useAuth();

  const handleResetData = () => {
    if (confirm("¿Deseas restaurar la base de datos a sus valores iniciales predeterminados?")) {
      resetDatabaseToDefault();
      window.location.reload();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-slate-800">
          Panel de Administración y Control
        </h2>
        <span className="hidden md:inline-block text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
          v1.0 Producción
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulador de Cambio de Usuario / Rol para pruebas de RBAC */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <UserCheck className="w-4 h-4 text-indigo-600 ml-1.5" />
          <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
            Actuar como:
          </span>
          <select
            value={currentUser?.id || ""}
            onChange={(e) => loginAs(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-lg py-1 px-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email.split("@")[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Botón Restaurar Datos */}
        <button
          onClick={handleResetData}
          title="Restaurar datos iniciales"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Link directo a la tienda */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Tienda</span>
        </Link>
      </div>
    </header>
  );
}

