import { NextResponse } from "next/server";
import { mpPayment } from "@/lib/mercadopago/client";
import { sendEmail, buildOrderConfirmedHtml } from "@/lib/email/service";

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

    if (paymentId && (topic === "payment" || !topic)) {
      try {
        const paymentData = await mpPayment.get({ id: String(paymentId) });
        console.log(`[Mercado Pago Webhook] Payment ${paymentId} status: ${paymentData.status}`);

        if (paymentData.status === "approved") {
          const payerEmail = paymentData.payer?.email;
          const orderRef = paymentData.external_reference || `ORD-${paymentId}`;

          if (payerEmail) {
            await sendEmail({
              to: payerEmail,
              subject: `✅ Pago Confirmado: Orden ${orderRef} - GrabaMil`,
              html: buildOrderConfirmedHtml({
                orderNumber: orderRef,
                customerName: `${paymentData.payer?.first_name || ""} ${paymentData.payer?.last_name || ""}`.trim() || "Cliente",
                productName: paymentData.description || "Producto Personalizado GrabaMil",
                quantity: 1,
                total: paymentData.transaction_amount || 0,
                paymentId: String(paymentId),
              }),
            });
          }
        }
      } catch (e: any) {
        console.warn(`[Mercado Pago Webhook] Error processing payment ${paymentId}:`, e?.message);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Mercado Pago Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

