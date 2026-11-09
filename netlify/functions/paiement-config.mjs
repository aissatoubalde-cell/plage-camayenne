// GET /api/paiement-config : quels moyens de paiement sont activés (lu par src/pages/Paiement.jsx).
// Orange Money et carte bancaire passent par CinetPay : les mêmes clés activent les deux.
import { json, settings } from "../lib/payments.mjs";


export default async () => {
  const s = settings();
  return json({ cinetpay: s.cinetpay.enabled, card: s.cinetpay.enabled, currency: s.cinetpay.currency });
};
