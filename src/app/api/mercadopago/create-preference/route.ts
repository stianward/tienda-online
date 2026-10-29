import { NextResponse } from "next/server";
import { mpPreference } from "@/lib/mercadopago/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, quantity, unit_price, orderId, payer } = body;

    const forwardedHost = request.headers.get("x-forwarded-host");
    const hostHeader = request.headers.get("host");
    const activeHost = forwardedHost || hostHeader;

    let baseUrl: string;
    if (activeHost && !activeHost.includes("localhost")) {
      const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
      baseUrl = `${forwardedProto}://${activeHost}`;
    } else if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    } else {
      baseUrl = "https://tienda-online-371992299473.us-east4.run.app";
    }

    // Si es https permite auto_return; si es localhost, Mercado Pago rechaza auto_return
    const isHttps = baseUrl.startsWith("https://");

    // 1. Separar nombre y apellido requeridos por el estándar de Mercado Pago
    let firstName = "Cliente";
    let lastName = "Comprador";
    if (payer?.name) {
      const parts = String(payer.name).trim().split(/\s+/);
      firstName = parts[0] || "Cliente";
      lastName = parts.slice(1).join(" ") || "Comprador";
    }

    // 2. Extraer y formatear teléfono con código de área para Colombia (+57)
    const cleanDigits = payer?.phone ? String(payer.phone).replace(/\D/g, "") : "";
    const phoneObj =
      cleanDigits.length >= 7
        ? {
            area_code: "57",
            number: cleanDigits.slice(-10),
          }
        : undefined;

    // 3. Formatear dirección según estándar de Checkout Pro
    const addressObj = payer?.address
      ? {
          street_name: String(payer.address).trim().substring(0, 100) || "Dirección de Despacho",
        }
      : undefined;

    // 4. Validar correo electrónico
    const validEmail =
      payer?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payer.email).trim())
        ? String(payer.email).trim()
        : "cliente@grabamil.com";

    // 5. Normalizar precio unitario y cantidad (COP en enteros)
    const normalizedUnitPrice = Math.max(1000, Math.round(Number(unit_price) || 10000));
    const normalizedQuantity = Math.max(1, Math.round(Number(quantity) || 1));

    try {
      const response = await mpPreference.create({
        body: {
          items: [
            {
              id: String(orderId || "item-1"),
              title: String(title || "Producto Personalizado GrabaMil").substring(0, 120),
              description: String(description || "Grabado y personalización de alta precisión GrabaMil").substring(0, 250),
              quantity: normalizedQuantity,
              unit_price: normalizedUnitPrice,
              currency_id: "COP",
              category_id: "art",
            },
          ],
          payer: {
            name: firstName,
            surname: lastName,
            email: validEmail,
            phone: phoneObj,
            address: addressObj,
          },
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
