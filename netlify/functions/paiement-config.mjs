// GET /api/paiement-config : quels moyens de paiement sont activés (lu par src/pages/Paiement.jsx).
import { json, settings } from "../lib/payments.mjs";


export default async () => {
  const s = settings().cinetpay;
  return json({ cinetpay: s.enabled, card: s.card, currency: s.currency });
};
