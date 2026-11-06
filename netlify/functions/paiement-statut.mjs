// GET /api/paiement-statut?provider=stripe|cinetpay&id=… : état réel d’un paiement, pour la page de confirmation.
import { checkCinetPayPayment, fromMinorUnits, getStripe, json, settings } from "../lib/payments.mjs";


export default async (req) => {
  const u = new URL(req.url);
  const provider = u.searchParams.get("provider"), id = (u.searchParams.get("id") || "").slice(0, 120);
  const s = settings();
  try {
    if (provider === "stripe" && id.startsWith("pi_") && s.stripe.enabled) {
      const pi = await getStripe().paymentIntents.retrieve(id);
      const currency = (pi.currency || s.stripe.currency).toUpperCase();
      const status = pi.status === "succeeded" ? "paid" : ["canceled", "requires_payment_method"].includes(pi.status) ? "failed" : "pending";
      return json({ status, amount: fromMinorUnits(pi.amount ?? 0, currency), currency });
    }
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
