// POST /api/paiement-stripe : paiement par carte.
// Avec { intent: true } et STRIPE_PUBLISHABLE_KEY : crée un PaymentIntent et renvoie { clientSecret } (champs de carte dans la page).
// Sinon : crée une session Stripe Checkout et renvoie { url } (redirection vers Stripe).
import { createStripeCheckout, createStripeIntent, json, parsePaymentInput, readJson, settings, siteUrl } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  const s = settings().stripe;
  if (!s.enabled) return json({ error: "Le paiement par carte n’est pas encore activé." }, 503);
  const body = await readJson(req);
  const parsed = parsePaymentInput(body, s.currency);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const base = siteUrl(req);
  try {
    if (body?.intent && s.publishableKey) {
      const { clientSecret } = await createStripeIntent(parsed.data);
      return json({ clientSecret });
    }
    const { url } = await createStripeCheckout(parsed.data, { successUrl: `${base}/confirmation?provider=stripe&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: `${base}/paiement?annule=1` });
    return json({ url });
  } catch (e) {
    console.error("[stripe] création impossible", e);
    return json({ error: "Impossible de démarrer le paiement pour le moment. Réessayez ou contactez-nous." }, 502);
  }
};
