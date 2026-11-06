// GET /api/paiement-statut?provider=stripe|cinetpay&id=… : état réel d’un paiement, pour la page de confirmation.
import { checkCinetPayPayment, fromMinorUnits, getStripe, json, settings } from "../lib/payments.mjs";


export default async (req) => {
  const u = new URL(req.url);
  const provider = u.searchParams.get("provider"), id = (u.searchParams.get("id") || "").slice(0, 120);
  const s = settings();
  try {
    if (provider === "stripe" && id && s.stripe.enabled) {
      const sess = await getStripe().checkout.sessions.retrieve(id);
      const currency = (sess.currency || s.stripe.currency).toUpperCase();
      return json({ status: sess.payment_status === "paid" ? "paid" : sess.status === "expired" ? "failed" : "pending", amount: fromMinorUnits(sess.amount_total ?? 0, currency), currency });
    }
    if (provider === "cinetpay" && id && s.cinetpay.enabled) {
      const c = await checkCinetPayPayment(id);
      return json({ status: c.status === "ACCEPTED" ? "paid" : c.status === "REFUSED" ? "failed" : "pending", amount: c.amount, currency: c.currency || "GNF" });
    }
  } catch (e) {
    console.error("[paiement] vérification impossible", e);
  }
  return json({ status: "unknown" });
};
