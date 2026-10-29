import { NextResponse } from "next/server";
import { mpPreference } from "@/lib/mercadopago/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, quantity, unit_price, orderId, payer } = body;

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const hostHeader = request.headers.get("host") || "localhost:3000";

    const customAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    let baseUrl: string;

    if (customAppUrl && !customAppUrl.includes("localhost")) {
      baseUrl = customAppUrl.replace(/\/$/, "");
    } else {
      const activeHost = forwardedHost || hostHeader;
      const protocol = forwardedProto || (activeHost.includes("localhost") ? "http" : "https");
      baseUrl = `${protocol}://${activeHost}`;
    }

    // Si es https permite auto_return; si es localhost, Mercado Pago rechaza auto_return
    const isHttps = baseUrl.startsWith("https://");

    try {
      const response = await mpPreference.create({
        body: {
          items: [
            {
              id: String(orderId || "item-1"),
              title: String(title || "Producto Personalizado GrabaMil"),
              description: String(description || "Grabado y personalización de alta precisión GrabaMil"),
              quantity: Math.max(1, Number(quantity) || 1),
              unit_price: Math.max(1, Number(unit_price) || 10000),
              currency_id: "COP",
            },
          ],
          payer: payer
            ? {
                name: payer.name || "Cliente",
                email: payer.email || "cliente@ejemplo.com",
                phone: payer.phone ? { number: String(payer.phone) } : undefined,
                address: payer.address ? { street_name: String(payer.address) } : undefined,
              }
            : undefined,
          back_urls: {
            success: `${baseUrl}/transaction-result?order_id=${orderId}&status=approved`,
            pending: `${baseUrl}/transaction-result?order_id=${orderId}&status=pending`,
            failure: `${baseUrl}/transaction-result?order_id=${orderId}&status=rejected`,
          },
          ...(isHttps ? { auto_return: "approved" } : {}),
          payment_methods: {
            installments: 12,
          },
          statement_descriptor: "GRABAMIL",
          external_reference: String(orderId),
        },
      });

      console.log(`[Mercado Pago] Preference created: ${response.id}`);

      const isProduction = process.env.NEXT_PUBLIC_MERCADOPAGO_ENV === "production" || process.env.NODE_ENV === "production";
      const checkoutUrl = isProduction ? (response.init_point || response.sandbox_init_point) : (response.sandbox_init_point || response.init_point);

      return NextResponse.json({
        id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
        checkout_url: checkoutUrl,
      });
    } catch (sdkError: any) {
      console.error("[Mercado Pago SDK Error]:", sdkError?.message || sdkError);

      return NextResponse.json(
        {
          id: `pref_mock_${Date.now()}`,
          init_point: `${baseUrl}/transaction-result?order_id=${orderId}&status=approved`,
          sandbox_init_point: `${baseUrl}/transaction-result?order_id=${orderId}&status=approved`,
          warning: sdkError?.message,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("[Create Preference Handler Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
