import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: "sendgrid" | "smtp" | "resend" | "mock";
  messageId?: string;
  error?: string;
}

/**
 * SERVICIO UNIFICADO DE CORREOS PARA GOOGLE CLOUD PLATFORM (GCP):
 * 
 * Prioridad de proveedores:
 * 1. SendGrid (GCP Marketplace - 12.000 correos/mes gratis) -> SENDGRID_API_KEY
 * 2. SMTP Nativo / Gmail / Google Workspace -> SMTP_HOST, SMTP_USER, SMTP_PASS
 * 3. Resend API (3.000 correos/mes gratis) -> RESEND_API_KEY
 * 4. Mock / Logger (Modo seguro en desarrollo para no bloquear la app)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = "GrabaMil Pedidos",
}: SendEmailOptions): Promise<EmailSendResult> {
  const fromEmail = process.env.EMAIL_FROM || "notificaciones@grabamil.com";
  const formattedFrom = `"${fromName}" <${fromEmail}>`;
  const recipients = Array.isArray(to) ? to : [to];

  // 1. Envío vía SendGrid REST API (Convenio Oficial Google Cloud - 12k/mes gratis)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: recipients.map((r) => ({ email: r })),
            },
          ],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [
            {
              type: "text/html",
              value: html,
            },
            ...(text ? [{ type: "text/plain", value: text }] : []),
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        console.log(`[Email Service - SendGrid GCP] Correo despachado con éxito a: ${recipients.join(", ")}`);
        return { success: true, provider: "sendgrid", messageId: `sg-${Date.now()}` };
      } else {
        const errText = await response.text();
        console.warn(`[Email Service - SendGrid GCP Error]`, errText);
      }
    } catch (sgError: any) {
      console.error("[Email Service - SendGrid Exception]:", sgError?.message);
    }
  }

  // 2. Envío vía Resend API (3.000 correos/mes gratis)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail.includes("@") ? fromEmail : "onboarding@resend.dev"}>`,
          to: recipients,
          subject,
          html,
          text,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        console.log(`[Email Service - Resend] Correo despachado: ${resData.id}`);
        return { success: true, provider: "resend", messageId: resData.id };
      }
    } catch (resendError: any) {
      console.error("[Email Service - Resend Exception]:", resendError?.message);
    }
  }

  // 3. Envío vía SMTP (Gmail, Google Workspace, o Relay GCP)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: formattedFrom,
        to: recipients.join(", "),
        subject,
        html,
        text: text || "Notificación de GrabaMil",
      });

      console.log(`[Email Service - SMTP] Correo enviado: ${info.messageId}`);
      return { success: true, provider: "smtp", messageId: info.messageId };
    } catch (smtpError: any) {
      console.error("[Email Service - SMTP Exception]:", smtpError?.message);
    }
  }

  // 4. Modo Simulado / Registro local (Si aún no se han configurado llaves de producción)
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SIMULADO - GCP FREE TIER LOGGER]`);
  console.log(`De: ${formattedFrom}`);
  console.log(`Para: ${recipients.join(", ")}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  return {
    success: true,
    provider: "mock",
    messageId: `mock-mail-${Date.now()}`,
  };
}

/**
 * Plantilla HTML: Confirmación de Orden Recibida (Post-Mercado Pago)
 */
export function buildOrderConfirmedHtml({
  orderNumber,
  customerName,
  productName,
  quantity,
  total,
  paymentId,
  tableData,
}: {
  orderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  total: number;
  paymentId: string;
  tableData?: Array<Record<string, any>>;
}): string {
  const tableRowsHtml =
    tableData && tableData.length > 0
      ? `
      <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 10px 14px; font-weight: bold; font-size: 13px; color: #334155;">
          Detalle de Unidades para Grabado (${tableData.length} fila/unidad):
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <tbody>
            ${tableData
              .map(
                (row, i) => `
                <tr style="border-top: 1px solid #e2e8f0; background-color: ${i % 2 === 0 ? "#ffffff" : "#fbfcfe"};">
                  <td style="padding: 8px 12px; font-weight: bold; color: #4f46e5; width: 40px;">#${i + 1}</td>
                  <td style="padding: 8px 12px; color: #1e293b;">
                    ${Object.entries(row)
                      .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                      .join(" &nbsp;|&nbsp; ")}
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
      : "";

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Logo & Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #4f46e5; color: #ffffff; font-weight: 900; font-size: 20px;">G</div>
            <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 12px 0 4px 0;">¡Gracias por tu compra, ${customerName}!</h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Tu pago fue confirmado por Mercado Pago y tu orden ya está en nuestro sistema.</p>
          </div>

          <!-- Resumen del Pedido -->
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #64748b;">Número de Orden:</span>
              <strong style="color: #0f172a; font-family: monospace;">${orderNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #64748b;">Producto:</span>
              <strong style="color: #0f172a;">${productName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #64748b;">Cantidad / Unidades:</span>
              <strong style="color: #0f172a;">${quantity} unidad(es)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #64748b;">ID Transacción Mercado Pago:</span>
              <strong style="color: #15803d; font-family: monospace;">${paymentId}</strong>
            </div>
            <div style="border-top: 1px dashed #cbd5e1; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px;">
              <span style="font-weight: 700; color: #0f172a;">Total Pagado:</span>
              <strong style="color: #4f46e5;">$${total.toLocaleString("es-CO")} COP</strong>
            </div>
          </div>

          ${tableRowsHtml}

          <!-- Footer -->
          <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 6px 0;">GrabaMil • Sistema de Personalización y Grabado Láser de Precisión</p>
            <p style="margin: 0;">Este es un correo automático generado por el servidor de la tienda.</p>
          </div>

        </div>
      </body>
    </html>
  `;
}

/**
 * Plantilla HTML: Actualización de Estado de Orden
 */
export function buildStatusChangedHtml({
  orderNumber,
  customerName,
  productName,
  newStatusName,
  newStatusColor,
  note,
}: {
  orderNumber: string;
  customerName: string;
  productName: string;
  newStatusName: string;
  newStatusColor: string;
  note?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #4f46e5; color: #ffffff; font-weight: 900; font-size: 20px;">G</div>
            <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 12px 0 4px 0;">Actualización de tu Pedido ${orderNumber}</h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Hola ${customerName}, tenemos novedades sobre tu producto <strong>${productName}</strong>.</p>
          </div>

          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 8px;">Nuevo Estado:</span>
            <span style="display: inline-block; background-color: ${newStatusColor}; color: #ffffff; font-weight: 800; font-size: 15px; padding: 6px 18px; border-radius: 9999px;">
              ${newStatusName}
            </span>
            ${
              note
                ? `<p style="font-size: 12px; color: #475569; margin-top: 12px; font-style: italic;">"${note}"</p>`
                : ""
            }
          </div>

          <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 6px 0;">GrabaMil • Sistema de Personalización y Grabado Láser de Precisión</p>
          </div>

        </div>
      </body>
    </html>
  `;
}

