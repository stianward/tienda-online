import { NextResponse } from "next/server";
import {
  sendEmail,
  buildOrderConfirmedHtml,
  buildStatusChangedHtml,
} from "@/lib/email/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, order, newStatus, note } = body;

    if (!order) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@grabamil.com";
    const customerEmail = order.customerData?.email;
    const customerName = order.customerData?.name || "Cliente";

    if (type === "order_confirmed") {
      // 1. Correo para el cliente
      const customerHtml = buildOrderConfirmedHtml({
        orderNumber: order.orderNumber,
        customerName,
        productName: order.productName,
        quantity: order.quantity,
        total: order.total,
        paymentId: order.mercadoPagoPaymentId || "MP-CONFIRMED",
        tableData: order.tableData,
      });

      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `✅ ¡Tu pedido ${order.orderNumber} ha sido confirmado! - GrabaMil`,
          html: customerHtml,
        });
      }

      // 2. Correo de alerta para el administrador
      await sendEmail({
        to: adminEmail,
        subject: `🔔 [NUEVA VENTA PAGADA] Orden ${order.orderNumber} - ${order.productName}`,
        html: `
          <h2>Nueva orden pagada vía Mercado Pago</h2>
          <p><strong>Orden:</strong> ${order.orderNumber}</p>
          <p><strong>Cliente:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>Producto:</strong> ${order.productName} (${order.quantity} unidades)</p>
          <p><strong>Total:</strong> $${order.total.toLocaleString("es-CO")} COP</p>
          <p><strong>ID Mercado Pago:</strong> ${order.mercadoPagoPaymentId}</p>
        `,
      });

      return NextResponse.json({ success: true, message: "Confirmation emails sent" });
    }

    if (type === "status_changed" && newStatus) {
      if (customerEmail) {
        const statusHtml = buildStatusChangedHtml({
          orderNumber: order.orderNumber,
          customerName,
          productName: order.productName,
          newStatusName: newStatus.name,
          newStatusColor: newStatus.color || "#4f46e5",
          note,
        });

        await sendEmail({
          to: customerEmail,
          subject: `📦 Actualización de tu pedido ${order.orderNumber}: ${newStatus.name}`,
          html: statusHtml,
        });
      }

      return NextResponse.json({ success: true, message: "Status update email sent" });
    }

    return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
  } catch (error: any) {
    console.error("[Email Notification Route Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

