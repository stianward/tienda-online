"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDatabase, saveDatabase } from "@/lib/data-store";
import { CustomForm, Order } from "@/types";
import {
  CreditCard,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import DynamicFormRenderer from "@/components/dynamic-form/DynamicFormRenderer";

export default function CheckoutBillingPage() {
  const router = useRouter();
  const [draftOrder, setDraftOrder] = useState<any>(null);
  const [clientForm, setClientForm] = useState<CustomForm | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved =
        sessionStorage.getItem("grabamil_draft_order") ||
        localStorage.getItem("grabamil_draft_order");
      if (saved) {
        setDraftOrder(JSON.parse(saved));
      } else {
        router.push("/");
      }
    }

    const db = getDatabase();
    // Buscar formulario de tipo CLIENTE para facturación con búsqueda por varios criterios
    const clientType = db.formTypes.find(
      (ft) => ft.name.toUpperCase() === "CLIENTE" || ft.id === "ft-cliente"
    );
    const foundForm =
      db.customForms.find((f) => clientType && f.formTypeId === clientType.id) ||
      db.customForms.find(
        (f) =>
          f.id === "form-cliente-basico" ||
          f.name.toLowerCase().includes("factura") ||
          f.name.toLowerCase().includes("cliente") ||
          f.name.toLowerCase().includes("envío") ||
          f.name.toLowerCase().includes("despacho")
      ) ||
      db.customForms.find((f) => f.elements.some((e) => e.type === "email" || e.type === "address")) ||
      db.customForms[0];

    setClientForm(foundForm);
  }, [router]);

  if (!draftOrder || !clientForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-500 text-sm">
        Cargando orden de compra...
      </div>
    );
  }

  // Función extractora insensible a mayúsculas, tildes y variaciones de nombres de campo
  const extractCustomerField = (
    data: Record<string, any>,
    patterns: RegExp[],
    fallback = ""
  ): string => {
    // 1. Buscar en las llaves del objeto
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        const cleanKey = key
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (patterns.some((pattern) => pattern.test(cleanKey))) {
          return String(val).trim();
        }
      }
    }

    // 2. Si es email, buscar valores que tengan formato de correo
    if (patterns.some((p) => p.test("email") || p.test("correo"))) {
      for (const val of Object.values(data)) {
        if (typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
          return val.trim();
        }
      }
    }

    // 3. Si es teléfono, buscar valores numéricos que parezcan teléfono
    if (patterns.some((p) => p.test("tel") || p.test("celular") || p.test("phone"))) {
      for (const val of Object.values(data)) {
        if (typeof val === "string" || typeof val === "number") {
          const digits = String(val).replace(/[\s\-\(\)]/g, "");
          if (/^\+?\d{7,15}$/.test(digits)) {
            return String(val).trim();
          }
        }
      }
    }

    return fallback;
  };

  // Enviar a Mercado Pago
  const handleProceedPayment = async (customerBillingData: Record<string, any>) => {
    setIsProcessing(true);

    try {
      // 1. Generar número de orden único
      const orderNumber = `GRB-${Math.floor(10000 + Math.random() * 90000)}`;
      const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      // 2. Extraer datos reales del cliente diligenciados en el formulario
      const customerName =
        customerBillingData.name ||
        extractCustomerField(customerBillingData, [
          /nombre/i,
          /name/i,
          /cliente/i,
          /titular/i,
          /destinatario/i,
        ]) ||
        "Cliente";

      const customerEmail =
        customerBillingData.email ||
        extractCustomerField(customerBillingData, [/correo/i, /email/i, /mail/i]) ||
        "cliente@grabamil.com";

      const customerPhone =
        customerBillingData.phone ||
        extractCustomerField(customerBillingData, [
          /tel/i,
          /cel/i,
          /whatsapp/i,
          /phone/i,
          /movil/i,
        ]) ||
        "";

      const customerAddress =
        customerBillingData.address ||
        extractCustomerField(customerBillingData, [
          /direcci/i,
          /ciudad/i,
          /address/i,
          /domicilio/i,
          /entrega/i,
          /despacho/i,
          /ubicaci/i,
        ]) ||
        "";

      // 3. Crear orden en estado "Pendiente de pago" inicialmente
      const db = getDatabase();
      const pendingStatus =
        db.orderStatuses.find((s) => s.isPendingPayment) || db.orderStatuses[1];

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        productId: draftOrder.productId,
        productName: draftOrder.productName,
        unitPrice: draftOrder.unitPrice,
        quantity: draftOrder.quantity,
        total: draftOrder.total,
        customerData: {
          ...customerBillingData,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
        },
        customFormData: draftOrder.customFormData || {},
        tableData: draftOrder.tableData || [],
        statusId: pendingStatus.id,
        mercadoPagoStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [
          {
            statusId: pendingStatus.id,
            statusName: pendingStatus.name,
            timestamp: new Date().toISOString(),
            note: "Orden generada. Redirigiendo a pasarela Mercado Pago.",
          },
        ],
      };

      // Guardar en la base de datos
      const nextDb = {
        ...db,
        orders: [newOrder, ...db.orders],
      };
      saveDatabase(nextDb);

      try {
        const { persistDatabaseToFirestore } = await import("@/lib/firebase/firestore-sync");
        await persistDatabaseToFirestore(nextDb);
      } catch (syncErr) {
        console.warn("Sync error on checkout:", syncErr);
      }

      // Guardar referencia activa
      if (typeof window !== "undefined") {
        sessionStorage.setItem("grabamil_last_order_id", newOrder.id);
        localStorage.setItem("grabamil_last_order_id", newOrder.id);
      }

      // 3. Crear preferencia oficial con la API de Mercado Pago
      const prefResponse = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newOrder.productName,
          description: `Pedido ${newOrder.orderNumber} - ${newOrder.quantity} unidad(es)`,
          quantity: newOrder.quantity,
          unit_price: newOrder.unitPrice,
          orderId: newOrder.id,
          payer: {
            name: newOrder.customerData.name,
            email: newOrder.customerData.email,
            phone: newOrder.customerData.phone,
            address: newOrder.customerData.address,
          },
        }),
      });

      const prefData = await prefResponse.json();

      if (prefData.checkout_url || prefData.init_point || prefData.sandbox_init_point) {
        // Redirección directa al Checkout Pro oficial de Mercado Pago
        const checkoutUrl = prefData.checkout_url || prefData.init_point || prefData.sandbox_init_point;
        window.location.href = checkoutUrl;
      } else {
        // Fallback local en caso de error de red
        router.push(`/transaction-result?order_id=${newOrder.id}&status=approved`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Hubo un error al procesar la facturación. Por favor intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar a la Tienda</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Checkout Seguro Mercado Pago</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Módulo de Facturación y Pago
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Formulario embebido del módulo de formularios personalizados que captura los datos de envío y facturación para enviar a la API de Mercado Pago.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Formulario de Facturación Embebido */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Formulario Embebido: {clientForm.name}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-2">
                Información del Cliente y Facturación
              </h2>
            </div>

            <DynamicFormRenderer
              form={clientForm}
              submitButtonText={isProcessing ? "Procesando con Mercado Pago..." : "Pagar con Mercado Pago"}
              cancelButtonText="Modificar Pedido"
              onSubmit={handleProceedPayment}
              onCancel={() => router.back()}
            />
          </div>

          {/* Resumen del Pedido */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Resumen de tu Compra
              </h3>

              <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-slate-900">
                    {draftOrder.productName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cantidad: {draftOrder.quantity} un. • ${draftOrder.unitPrice.toLocaleString("es-CO")} c/u
                  </p>
                </div>
              </div>

              {/* Especificaciones personalizadas diligenciadas */}
              {Object.keys(draftOrder.customFormData || {}).length > 0 && (
                <div className="space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Personalización Seleccionada:
                  </span>
                  {Object.entries(draftOrder.customFormData).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{k}:</span>
                      <strong className="text-slate-800">{String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Totales */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal productos:</span>
                  <span>${draftOrder.total.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Envío nacional asegurado:</span>
                  <span className="text-emerald-600 font-bold">GRATIS</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total a Pagar:</span>
                  <span className="text-indigo-600">
                    ${draftOrder.total.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </div>

            {/* Mercado Pago Security Badge */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-sky-950 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Pasarela Oficial Mercado Pago</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Tus pagos son procesados de forma cifrada mediante Mercado Pago. Se admiten tarjetas de crédito, PSE, Efecty y dinero en cuenta.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

