"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SYSTEM_MODULES } from "@/types";
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
  X,
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

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isMobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { hasAccess, currentRole, currentProfile, currentUser } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const visibleModules = mounted ? SYSTEM_MODULES.filter((mod) => hasAccess(mod.id)) : SYSTEM_MODULES;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand / Logo */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-2.5"
        >
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

        {/* Botón Cerrar (Solo en móvil) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User & Role Badge */}
      <div className="p-3.5 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-200 truncate max-w-[130px]">
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
              ? "Super Admin"
              : currentRole?.type === "admin"
              ? "Admin"
              : "Agente"}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">
          Perfil: <span className="text-slate-300">{currentProfile?.name || "Sin perfil"}</span>
        </p>
      </div>

      {/* Navigation Modules */}
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
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition min-h-[42px] ${
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
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition min-h-[44px]"
        >
          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          <span>Ver Catálogo Público</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (Fijo en pantallas grandes lg >= 1024px) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 min-h-screen sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* 2. Mobile / Tablet Drawer (Deslizable con overlay en móviles < 1024px) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop con desenfoque */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
          {/* Panel Lateral Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 shadow-2xl flex flex-col z-10 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
