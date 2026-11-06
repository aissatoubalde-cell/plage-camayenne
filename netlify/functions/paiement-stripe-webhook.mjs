// POST /api/paiement-stripe-webhook : confirmation fiable des paiements par carte. À déclarer dans Stripe
// (Développeurs > Webhooks) avec les événements checkout.session.completed et payment_intent.succeeded, puis coller le secret dans STRIPE_WEBHOOK_SECRET.
import { fromMinorUnits, getStripe, recordPayment, settings, text } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method !== "POST") return text("méthode non autorisée", 405);
  const s = settings().stripe;
  if (!s.enabled || !s.webhookSecret) return text("non configuré", 503);
  const signature = req.headers.get("stripe-signature") || "";
  const body = await req.text();
  let event;
  try { event = getStripe().webhooks.constructEvent(body, signature, s.webhookSecret); } catch { return text("signature invalide", 400); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const sess = event.data.object;
    const currency = (sess.currency || s.currency).toUpperCase();
    await recordPayment({
      provider: "stripe", transactionId: sess.id, status: sess.payment_status === "paid" ? "paid" : "pending",
      amount: fromMinorUnits(sess.amount_total ?? 0, currency), currency, method: "card", reference: sess.metadata?.reference || undefined,
      customer: { name: sess.metadata?.name || sess.customer_details?.name || undefined, email: sess.customer_details?.email || sess.customer_email || undefined, phone: sess.metadata?.phone || sess.customer_details?.phone || undefined },
    });
  }
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    if (pi.metadata?.name === undefined) return text("ok"); // paiement créé par Checkout : déjà traité ci-dessus
    const currency = (pi.currency || s.currency).toUpperCase();
    await recordPayment({
      provider: "stripe", transactionId: pi.id, status: "paid",
      amount: fromMinorUnits(pi.amount_received || pi.amount || 0, currency), currency, method: "card", reference: pi.metadata?.reference || undefined,
      customer: { name: pi.metadata?.name || undefined, email: pi.metadata?.email || pi.receipt_email || undefined, phone: pi.metadata?.phone || undefined },
    });
  }
  return text("ok");
};
