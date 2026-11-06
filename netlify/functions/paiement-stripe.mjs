// POST /api/paiement-stripe : crée une session Stripe Checkout.
// Avec { embedded: true } et STRIPE_PUBLISHABLE_KEY : renvoie { clientSecret } (formulaire de carte intégré à la page), sinon { url } (redirection).
import { createStripeCheckout, json, parsePaymentInput, readJson, settings, siteUrl } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  const s = settings().stripe;
  if (!s.enabled) return json({ error: "Le paiement par carte n’est pas encore activé." }, 503);
  const body = await readJson(req);
  const parsed = parsePaymentInput(body, s.currency);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const base = siteUrl(req);
  try {
    const embedded = Boolean(body?.embedded && s.publishableKey);
    const r = await createStripeCheckout(parsed.data, { successUrl: `${base}/confirmation?provider=stripe&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: `${base}/paiement?annule=1` }, { embedded });
    return json(embedded ? { clientSecret: r.clientSecret } : { url: r.url });
  } catch (e) {
    console.error("[stripe] création impossible", e);
    return json({ error: "Impossible de démarrer le paiement pour le moment. Réessayez ou contactez-nous." }, 502);
  }
};
