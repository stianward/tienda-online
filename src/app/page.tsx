"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDatabase, DatabaseState } from "@/lib/data-store";
import { Product, ProductCategory } from "@/types";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Box,
  Layers,
} from "lucide-react";

export default function ShopHomePage() {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    setDb(getDatabase());
    const onDbChange = (e: any) => setDb(e.detail);
    window.addEventListener("grabamil_db_changed", onDbChange);
    return () => window.removeEventListener("grabamil_db_changed", onDbChange);
  }, []);

  if (!db) return null;

  const filteredProducts = db.products.filter((p) => {
    if (p.status !== "activo") return false;
    if (selectedCategory === "all") return true;
    return p.categoryId === selectedCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              G
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
                GrabaMil
              </h1>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                Personalización Láser & 3D
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition border border-slate-200 flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Panel Administrativo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Visualizador 3D en Tiempo Real • Pagos con Mercado Pago</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Personaliza y Graba Productos Únicos al Instante
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-normal">
            Elige tu producto, diligencia especificaciones con nuestros formularios dinámicos, previsualiza tu grabado en 3D y realiza tu compra de forma 100% segura.
          </p>
        </div>
      </section>

      {/* Features Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center justify-center gap-2.5">
            <Box className="w-4 h-4 text-indigo-600" />
            <span>Previsualización 3D interactiva en vivo</span>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pagos protegidos con Mercado Pago</span>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Seguimiento y notificaciones por correo</span>
          </div>
        </div>
      </div>

      {/* Main Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Filtros por Categoría */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Catálogo de Productos</h3>
            <p className="text-xs text-slate-500">
              Mostrando {filteredProducts.length} productos disponibles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Todos los productos
            </button>
            {db.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const catObj = db.categories.find((c) => c.id === product.categoryId);
            const formObj = db.customForms.find((f) => f.id === product.formId);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl transition group"
              >
                <div>
                  <div className="relative h-52 bg-slate-100 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as any).src =
                          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-white/90 text-slate-800 shadow-xs backdrop-blur">
                        {catObj?.name || "Joyería"}
                      </span>
                    </div>
                    {formObj && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-xs flex items-center gap-1">
                          <Box className="w-3 h-3" />
                          <span>Personalizable 3D</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Precio Unitario
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      ${product.price.toLocaleString("es-CO")}
                    </span>
                  </div>

                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
                  >
                    <span>Personalizar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-semibold text-slate-300">
            GrabaMil • Sistema de Personalización de Productos & Pagos Seguros con Mercado Pago
          </p>
          <p className="text-[11px] text-slate-500">
            Next.js • React • Tailwind CSS • Firebase Firestore • Google Cloud
          </p>
        </div>
      </footer>
    </div>
  );
}
