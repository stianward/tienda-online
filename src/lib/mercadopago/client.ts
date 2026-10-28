import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "TEST-0000000000000000-000000-00000000000000000000000000000000-000000000",
  options: { timeout: 5000 },
});

export const mpPreference = new Preference(client);
export const mpPayment = new Payment(client);
export default client;

