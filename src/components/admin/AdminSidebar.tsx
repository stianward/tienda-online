"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SYSTEM_MODULES, ModuleKey } from "@/types";
import {
  Users,
  Shield,
  Link as LinkIcon,
  Lock,
  Tags,
  Activity,
  Layers,
  FileText,
  Table,
  Box,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Shield,
  Link: LinkIcon,
  Lock,
  Tags,
  Activity,
  Layers,
  FileText,
  Table,
  Box,
  Package,
  ShoppingBag,
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { hasAccess, currentRole, currentProfile, currentUser } = useAuth();

  // Filtrar los módulos según los permisos del perfil activo
  const visibleModules = SYSTEM_MODULES.filter((mod) => hasAccess(mod.id));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand / Logo */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
            G
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">
              GrabaMil
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Control Panel
            </p>
          </div>
        </Link>
      </div>

      {/* User & Role Badge */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-slate-200 truncate">
            {currentUser?.name || "Usuario"}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              currentRole?.type === "system_admin"
                ? "bg-purple-950 text-purple-300 border border-purple-700/50"
                : currentRole?.type === "admin"
                ? "bg-blue-950 text-blue-300 border border-blue-700/50"
                : "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
            }`}
          >
            {currentRole?.type === "system_admin"
              ? "System Admin"
              : currentRole?.type === "admin"
              ? "Admin"
              : "Agente"}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">
          Perfil: <span className="text-slate-300">{currentProfile?.name || "Sin perfil asociado"}</span>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos Autorizados ({visibleModules.length})
        </div>

        {visibleModules.map((module) => {
          const IconComponent = ICON_MAP[module.icon] || Box;
          const isActive = pathname === module.path || pathname.startsWith(`${module.path}/`);

          return (
            <Link
              key={module.id}
              href={module.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{module.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
            </Link>
          );
        })}

        {visibleModules.length === 0 && (
          <div className="p-4 text-center text-xs text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded-lg">
            Tu perfil actual no tiene módulos asignados en este momento.
          </div>
        )}
      </div>

      {/* Footer Store Link */}
      <div className="p-3 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
        >
          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          <span>Ver Catálogo Público</span>
        </Link>
      </div>
    </aside>
  );
}

