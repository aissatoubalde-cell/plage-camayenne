// GET /api/paiement-config : quels moyens de paiement sont activés (lu par src/pages/Paiement.jsx).
import { json, settings } from "../lib/payments.mjs";
import { urlBase } from "../lib/demandes.mjs";
import { reglages } from "../lib/silylink.mjs";


export default async () => {
  const s = settings().cinetpay;
  const sily = reglages();
  return json({ cinetpay: s.enabled, card: s.card, currency: s.currency, silylink: sily.enabled && Boolean(urlBase()), silylinkTest: sily.enabled && sily.test });
};
