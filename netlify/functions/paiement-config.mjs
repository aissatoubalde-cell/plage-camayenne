// GET /api/paiement-config : quels moyens de paiement sont activés (lu par src/pages/Paiement.jsx).
import { json, settings } from "../lib/payments.mjs";


export default async () => {
  const s = settings();
  return json({ cinetpay: s.cinetpay.enabled, stripe: s.stripe.enabled, stripeKey: s.stripe.enabled ? s.stripe.publishableKey : "", currency: s.stripe.currency.toUpperCase() });
};
