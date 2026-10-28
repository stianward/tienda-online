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

  // REQUERIMIENTO: La cantidad la determina dinámicamente el número de filas en la tabla
  // Si no hay tabla, representa 1 unidad.
  const [tableRowsCount, setTableRowsCount] = useState<number>(1);

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
              const initialCount =
                foundTable.initialRows && foundTable.initialRows.length > 0
                  ? foundTable.initialRows.length
                  : 1;
              setTableRowsCount(initialCount);

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

  // REGLA: Cada registro de la tabla que sea agregado/eliminado representará 1 unidad del producto.
  // Ejemplo: Si el producto vale 10.000 y se agregan 5 filas, entonces el valor del pedido será 50.000.
  const effectiveQuantity = customTable ? Math.max(1, tableRowsCount) : 1;
  const totalPrice = product.price * effectiveQuantity;

  const handleProceedToBilling = (
    formData: Record<string, any>,
    tableRows?: Record<string, string | number>[]
  ) => {
    const rowsCount = tableRows && tableRows.length > 0 ? tableRows.length : effectiveQuantity;
    const finalTotal = product.price * rowsCount;

    const draftOrder = {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: rowsCount,
      total: finalTotal,
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
          {/* Columna Izquierda: Información del Producto & Valor Total Dinámico */}
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

              <div className="pt-5 space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {product.name}
                  </h1>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {product.description}
                  </p>
                </div>

                {/* Subtotal Dinámico Calculado según las filas de la tabla */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-700 block">
                      {customTable ? (
                        <>
                          Total por <strong>{effectiveQuantity}</strong>{" "}
                          {effectiveQuantity === 1 ? "unidad (1 fila en tabla)" : "unidades (filas en tabla)"}:
                        </>
                      ) : (
                        <>Valor del producto (1 unidad):</>
                      )}
                    </span>
                    <span className="text-2xl font-black text-indigo-950">
                      ${totalPrice.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 block">
                      ${product.price.toLocaleString("es-CO")} c/u
                    </span>
                    {customTable && (
                      <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                        1 fila = 1 unidad
                      </span>
                    )}
                  </div>
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

          {/* Columna Derecha: Formulario Personalizado Embebido con Tabla y Modal 3D */}
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
                  Diligencia las especificaciones. Cada fila agregada a la tabla suma 1 unidad al valor total del pedido.
                </p>
              </div>

              {customForm ? (
                <DynamicFormRenderer
                  form={customForm}
                  customTable={customTable}
                  render3D={render3D}
                  onTableRowsChange={(rows) => setTableRowsCount(Math.max(1, rows.length))}
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-500 text-sm">
          Cargando producto...
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
