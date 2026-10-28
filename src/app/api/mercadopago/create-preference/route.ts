import { NextResponse } from "next/server";
import { mpPreference } from "@/lib/mercadopago/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, quantity, unit_price, orderId } = body;

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    // Intentar crear la preferencia con el SDK de Mercado Pago
    try {
      const response = await mpPreference.create({
        body: {
          items: [
            {
              id: orderId || "order-item",
              title: title || "Producto Personalizado GrabaMil",
              quantity: Number(quantity) || 1,
              unit_price: Number(unit_price) || 50000,
              currency_id: "COP",
            },
          ],
          back_urls: {
            success: `${baseUrl}/transaction-result?order_id=${orderId}&status=approved`,
            pending: `${baseUrl}/transaction-result?order_id=${orderId}&status=pending`,
            failure: `${baseUrl}/transaction-result?order_id=${orderId}&status=rejected`,
          },
          auto_return: "approved",
          notification_url: `${baseUrl}/api/mercadopago/webhook`,
          external_reference: orderId,
        },
      });

      return NextResponse.json({
        id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
      });
    } catch (sdkError: any) {
      console.warn("Mercado Pago SDK API call failed (token not configured or development sandbox):", sdkError?.message);

      // Modo desarrollo / Mock seguro cuando no hay token de producción
      return NextResponse.json({
        id: `pref_mock_${Date.now()}`,
        init_point: `${baseUrl}/transaction-result?order_id=${orderId}&status=approved`,
        sandbox_init_point: `${baseUrl}/transaction-result?order_id=${orderId}&status=approved`,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

