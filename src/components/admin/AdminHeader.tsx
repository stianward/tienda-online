"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { resetDatabaseToDefault } from "@/lib/data-store";
import { UserCheck, RotateCcw, Menu } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { currentUser, allUsers, loginAs, currentRole } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleResetData = () => {
    if (confirm("¿Deseas restaurar la base de datos a sus valores iniciales predeterminados?")) {
      resetDatabaseToDefault();
      window.location.reload();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botón Hamburguesa para Móvil y iPad Vertical (Touch Target >= 44px) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Abrir menú de navegación"
          className="lg:hidden p-2.5 -ml-1 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
          Panel de Control
        </h2>
        <span className="hidden md:inline-block text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
          v1.0 Producción
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulador de Cambio de Usuario / Rol para pruebas de RBAC */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-xl border border-slate-200">
          <UserCheck className="w-4 h-4 text-indigo-600 ml-1 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 hidden md:inline">
            Rol:
          </span>
          <select
            value={currentUser?.id || ""}
            onChange={(e) => loginAs(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg py-1 px-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[130px] sm:max-w-none truncate"
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
          className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
