"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDatabase, DatabaseState } from "@/lib/data-store";
import { Product, CustomForm, CustomTable, Render3D } from "@/types";
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Box,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import DynamicFormRenderer from "@/components/dynamic-form/DynamicFormRenderer";

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [db, setDb] = useState<DatabaseState | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [customTable, setCustomTable] = useState<CustomTable | null>(null);
  const [render3D, setRender3D] = useState<Render3D | null>(null);

  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    const database = getDatabase();
    setDb(database);

    const foundProd = database.products.find((p) => p.id === productId);
    if (foundProd) {
      setProduct(foundProd);

      if (foundProd.formId) {
        const foundForm = database.customForms.find((f) => f.id === foundProd.formId);
        if (foundForm) {
          setCustomForm(foundForm);

          if (foundForm.customTableId) {
            const foundTable = database.customTables.find((t) => t.id === foundForm.customTableId);
            if (foundTable) {
              setCustomTable(foundTable);

              if (foundTable.renderId) {
                const foundRender = database.renders.find((r) => r.id === foundTable.renderId);
                setRender3D(foundRender || null);
              }
            }
          }
        }
      }
    }
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-500 text-sm">
        Cargando producto o no encontrado...
      </div>
    );
  }

  const totalPrice = product.price * quantity;

  const handleProceedToBilling = (
    formData: Record<string, any>,
    tableRows?: Record<string, string | number>[]
  ) => {
    // Guardar pedido provisional en sessionStorage para el módulo de facturación
    const draftOrder = {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      total: totalPrice,
      customFormData: formData,
      tableData: tableRows || [],
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("grabamil_draft_order", JSON.stringify(draftOrder));
    }

    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </Link>
          <span className="font-mono text-xs font-bold text-slate-400">
            ID: {product.id}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Información del Producto & Cantidades */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-4">
              <div className="relative h-80 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-xs">
                  Stock: {product.stock} disponibles
                </div>
              </div>

              <div className="pt-5 space-y-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Selector de Cantidades */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Cantidad a comprar:
                  </span>
                  <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold shadow-xs hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black text-slate-900 w-6 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= product.stock}
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold shadow-xs hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-700 block">
                      Total por {quantity} {quantity === 1 ? "unidad" : "unidades"}:
                    </span>
                    <span className="text-2xl font-black text-indigo-950">
                      ${totalPrice.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                    ${product.price.toLocaleString("es-CO")} c/u
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garantía de personalización láser de alta precisión</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>Despachos a nivel nacional con seguimiento continuo</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario Personalizado Embebido con 3D */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Formulario Dinámico Embebido</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {customForm ? customForm.name : "Personalización de Producto"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Diligencia las especificaciones para tu producto. Si incluye tabla personalizada, utiliza el visor 3D para previsualizar el resultado.
                </p>
              </div>

              {customForm ? (
                <DynamicFormRenderer
                  form={customForm}
                  customTable={customTable}
                  render3D={render3D}
                  submitButtonText="Continuar a Facturación y Pago"
                  cancelButtonText="Volver al Catálogo"
                  onSubmit={handleProceedToBilling}
                  onCancel={() => router.push("/")}
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Este producto no tiene un formulario personalizado asignado. Puedes proceder directamente al pago.
                  </p>
                  <button
                    onClick={() => handleProceedToBilling({})}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Continuar a Facturación</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-500 text-sm">Cargando producto...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}

