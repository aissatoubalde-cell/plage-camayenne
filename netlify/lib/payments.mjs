// Logique partagée des fonctions de paiement (Netlify Functions). Les clés viennent des variables d’environnement.
import Stripe from "stripe";

const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
const CINETPAY_API = "https://api-checkout.cinetpay.com/v2";

export function settings() {
  const env = process.env;
  return {
    cinetpay: { apiKey: env.CINETPAY_API_KEY || "", siteId: env.CINETPAY_SITE_ID || "", currency: "GNF", enabled: Boolean(env.CINETPAY_API_KEY && env.CINETPAY_SITE_ID) },
    stripe: { secretKey: env.STRIPE_SECRET_KEY || "", publishableKey: env.STRIPE_PUBLISHABLE_KEY || "", webhookSecret: env.STRIPE_WEBHOOK_SECRET || "", currency: (env.STRIPE_CURRENCY || "gnf").toLowerCase(), enabled: Boolean(env.STRIPE_SECRET_KEY) },
    web3formsKey: env.WEB3FORMS_KEY || "",
  };
}

/** URL publique du site (SITE_URL, sinon l’URL fournie par Netlify, sinon l’origine de la requête). */
export const siteUrl = (req) => (process.env.SITE_URL || process.env.URL || new URL(req.url).origin).replace(/\/$/, "");

export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
export const text = (body, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export const formatAmount = (n) => new Intl.NumberFormat("fr-FR").format(n);
export const amountBounds = (currency) => (currency.toLowerCase() === "gnf" ? { min: 50_000, max: 500_000_000 } : { min: 10, max: 50_000 });
export const toMinorUnits = (amount, currency) => (ZERO_DECIMAL.has(currency.toLowerCase()) ? amount : Math.round(amount * 100));
export const fromMinorUnits = (amount, currency) => (ZERO_DECIMAL.has(currency.toLowerCase()) ? amount : amount / 100);

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valide le corps JSON du formulaire de paiement. */
export function parsePaymentInput(body, currency) {
  const b = body && typeof body === "object" ? body : {};
  const name = str(b.name, 80), email = str(b.email, 120), phone = str(b.phone, 30).replace(/[^\d+ ]/g, ""), reference = str(b.reference, 40);
  const amount = Number(b.amount);
  if (name.length < 2) return { ok: false, error: "Indiquez votre nom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Indiquez un e-mail valide." };
  if (!Number.isInteger(amount)) return { ok: false, error: "Le montant doit être un nombre entier." };
  const { min, max } = amountBounds(currency);
  if (amount < min || amount > max) return { ok: false, error: `Le montant doit être compris entre ${formatAmount(min)} et ${formatAmount(max)} ${currency.toUpperCase()}.` };
  return { ok: true, data: { name, email, phone, reference, amount } };
}

export const readJson = (req) => req.json().catch(() => null);

/* ---------- CinetPay (Orange Money) : https://docs.cinetpay.com ---------- */
export async function createCinetPayPayment(input, urls) {
  const s = settings().cinetpay;
  const transactionId = `CP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [first, ...rest] = input.name.split(/\s+/);
  const res = await fetch(`${CINETPAY_API}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: s.apiKey, site_id: s.siteId, transaction_id: transactionId, amount: input.amount, currency: s.currency,
      description: `Acompte Camayenne Plage${input.reference ? ` – réf. ${input.reference}` : ""}`,
      customer_name: first, customer_surname: rest.join(" ") || first, customer_email: input.email, customer_phone_number: input.phone,
      notify_url: urls.notifyUrl, return_url: urls.returnUrl, channels: "MOBILE_MONEY", lang: "fr", metadata: input.reference,
    }),
  });
  const j = await res.json();
  if (j.code !== "201" || !j.data?.payment_url) throw new Error(`CinetPay : ${j.description || j.message || `réponse inattendue (${res.status})`}`);
  return { transactionId, url: j.data.payment_url };
}

/** Vérifie l’état réel d’une transaction auprès de CinetPay (seule source fiable). */
export async function checkCinetPayPayment(transactionId) {
  const s = settings().cinetpay;
  const res = await fetch(`${CINETPAY_API}/payment/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: s.apiKey, site_id: s.siteId, transaction_id: transactionId }),
  });
  const j = await res.json();
  const raw = String(j.data?.status || "").toUpperCase();
  const status = raw === "ACCEPTED" || j.code === "00" ? "ACCEPTED" : raw === "REFUSED" ? "REFUSED" : "PENDING";
  return { status, amount: j.data?.amount !== undefined ? Number(j.data.amount) : undefined, currency: j.data?.currency, method: j.data?.payment_method, reference: j.data?.metadata };
}

/** Identifiant de transaction envoyé par CinetPay (JSON ou formulaire). */
export async function readTransactionId(req) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) { const j = (await req.json().catch(() => ({}))) || {}; return j.cpm_trans_id || j.transaction_id || null; }
  const fd = await req.formData().catch(() => null);
  const v = fd?.get("cpm_trans_id") ?? fd?.get("transaction_id");
  return typeof v === "string" && v ? v : null;
}

/* ---------- Stripe (carte bancaire) : https://docs.stripe.com/payments/checkout ---------- */
let stripeClient = null;
export function getStripe() {
  const s = settings().stripe;
  if (!s.enabled) throw new Error("Stripe n’est pas configuré (STRIPE_SECRET_KEY).");
  return (stripeClient ??= new Stripe(s.secretKey));
}

export async function createStripeCheckout(input, urls) {
  const currency = settings().stripe.currency;
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    customer_email: input.email,
    line_items: [{ quantity: 1, price_data: { currency, unit_amount: toMinorUnits(input.amount, currency), product_data: { name: "Acompte – Camayenne Plage", description: input.reference ? `Référence du devis : ${input.reference}` : "Acompte de réservation" } } }],
    metadata: { name: input.name, phone: input.phone, reference: input.reference },
    locale: "fr",
  });
  if (!session.url) throw new Error("Stripe n’a pas renvoyé d’URL de paiement.");
  return { sessionId: session.id, url: session.url };
}

/** PaymentIntent pour le formulaire de carte intégré à la page (Stripe Payment Element). Renvoie le client_secret. */
export async function createStripeIntent(input) {
  const currency = settings().stripe.currency;
  const intent = await getStripe().paymentIntents.create({
    amount: toMinorUnits(input.amount, currency),
    currency,
    automatic_payment_methods: { enabled: true },
    receipt_email: input.email,
    description: input.reference ? `Acompte – Camayenne Plage (devis ${input.reference})` : "Acompte – Camayenne Plage",
    metadata: { name: input.name, email: input.email, phone: input.phone, reference: input.reference },
  });
  return { id: intent.id, clientSecret: intent.client_secret };
}

/* ---------- Enregistrement ---------- */
/**
 * Enregistre un paiement confirmé : journal serveur (visible dans Netlify > Logs > Functions) et, si WEB3FORMS_KEY
 * est renseignée, e-mail « Acompte reçu » à l’équipe. C’est ici que l’on branchera une base de données plus tard.
 */
export async function recordPayment(p) {
  console.log("[paiement]", JSON.stringify(p));
  const key = settings().web3formsKey;
  if (!key || p.status !== "paid") return;
  const lines = [
    "Un acompte vient d’être reçu sur le site Camayenne Plage.", "",
    `• Montant : ${formatAmount(p.amount)} ${p.currency}`,
    `• Moyen : ${p.provider === "cinetpay" ? `Orange Money${p.method ? ` (${p.method})` : ""}` : "Carte bancaire (Stripe)"}`,
    `• Transaction : ${p.transactionId}`,
    p.reference ? `• Référence devis : ${p.reference}` : "",
    p.customer?.name ? `• Client : ${p.customer.name}` : "",
    p.customer?.email ? `• E-mail : ${p.customer.email}` : "",
    p.customer?.phone ? `• Téléphone : ${p.customer.phone}` : "",
  ].filter(Boolean);
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: key, subject: `Acompte reçu – ${formatAmount(p.amount)} ${p.currency}`, from_name: "Site Camayenne Plage", message: lines.join("\n") }),
    });
  } catch (e) { console.error("[paiement] notification e-mail impossible", e); }
}
