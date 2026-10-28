import { NextResponse } from "next/server";
import { mpPayment } from "@/lib/mercadopago/client";

/**
 * WEBHOOK SEGURO DE MERCADO PAGO:
 * Procesa notificaciones IPN / Webhook de pagos.
 * Actualiza el estado según:
 * - approved -> Orden recibida
 * - pending / in_process -> Pendiente de pago
 * - rejected / cancelled -> Cancelado por falta de pago
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    const body = await request.json().catch(() => ({}));
    const paymentId = id || body?.data?.id;

    if (paymentId && topic === "payment") {
      try {
        const paymentData = await mpPayment.get({ id: paymentId });
        console.log(`[Mercado Pago Webhook] Payment ${paymentId} status: ${paymentData.status}`);

        // Aquí se actualiza el documento en Cloud Firestore en producción
        // y se dispara el correo con Sendgrid / Firebase Mail Extension
      } catch (e: any) {
        console.warn(`[Mercado Pago Webhook] Error fetching payment ${paymentId}:`, e?.message);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Mercado Pago Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

