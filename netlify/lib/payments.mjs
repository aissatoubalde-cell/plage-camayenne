// Logique partagée des fonctions de paiement (Netlify Functions). Les clés viennent des variables d’environnement.
// Orange Money et carte bancaire passent tous deux par CinetPay : une seule intégration, un seul jeu de clés.
const CINETPAY_API = "https://api-checkout.cinetpay.com/v2";
export const CURRENCY = "GNF";

export function settings() {
  const env = process.env;
  return {
    cinetpay: { apiKey: env.CINETPAY_API_KEY || "", siteId: env.CINETPAY_SITE_ID || "", currency: CURRENCY, enabled: Boolean(env.CINETPAY_API_KEY && env.CINETPAY_SITE_ID) },
    web3formsKey: env.WEB3FORMS_KEY || "",
  };
}

/** URL publique du site (SITE_URL, sinon l’URL fournie par Netlify, sinon l’origine de la requête). */
export const siteUrl = (req) => (process.env.SITE_URL || process.env.URL || new URL(req.url).origin).replace(/\/$/, "");

export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
export const text = (body, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export const formatAmount = (n) => new Intl.NumberFormat("fr-FR").format(n);
export const amountBounds = () => ({ min: 50_000, max: 500_000_000 });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Canaux CinetPay : Orange Money (Mobile Money) ou carte bancaire. */
export const CHANNELS = { mobile: "MOBILE_MONEY", card: "CREDIT_CARD" };

/** Valide le corps JSON du formulaire de paiement. */
export function parsePaymentInput(body) {
  const b = body && typeof body === "object" ? body : {};
  const channel = b.channel === "card" ? "card" : "mobile";
  const name = str(b.name, 80), email = str(b.email, 120), phone = str(b.phone, 30).replace(/[^\d+ ]/g, ""), reference = str(b.reference, 40);
  const city = str(b.city, 60), country = str(b.country, 2).toUpperCase();
  const amount = Number(b.amount);
  if (name.length < 2) return { ok: false, error: "Indiquez votre nom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Indiquez un e-mail valide." };
  if (!Number.isInteger(amount)) return { ok: false, error: "Le montant doit être un nombre entier." };
  if (amount % 5 !== 0) return { ok: false, error: "Le montant doit être un multiple de 5 GNF." };
  const { min, max } = amountBounds();
  if (amount < min || amount > max) return { ok: false, error: `Le montant doit être compris entre ${formatAmount(min)} et ${formatAmount(max)} ${CURRENCY}.` };
  if (channel === "card") {
    // La banque exige ces informations pour sécuriser un paiement par carte (sinon CinetPay refuse la transaction).
    if (phone.replace(/\D/g, "").length < 8) return { ok: false, error: "Indiquez votre numéro de téléphone : il est demandé pour le paiement par carte." };
    if (city.length < 2) return { ok: false, error: "Indiquez votre ville : elle est demandée pour le paiement par carte." };
    if (!/^[A-Z]{2}$/.test(country)) return { ok: false, error: "Indiquez votre pays." };
  }
  return { ok: true, data: { channel, name, email, phone, reference, amount, city, country } };
}

export const readJson = (req) => req.json().catch(() => null);

/* ---------- CinetPay (Orange Money et carte bancaire) : https://docs.cinetpay.com ---------- */
export async function createCinetPayPayment(input, urls) {
  const s = settings().cinetpay;
  const transactionId = `CP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [first, ...rest] = input.name.split(/\s+/);
  const address = input.city
    ? { customer_address: input.city, customer_city: input.city, customer_country: input.country || "GN", customer_state: input.city, customer_zip_code: "00000" }
    : {};
  const res = await fetch(`${CINETPAY_API}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: s.apiKey, site_id: s.siteId, transaction_id: transactionId, amount: input.amount, currency: s.currency,
      description: `Acompte Camayenne Plage${input.reference ? ` – réf. ${input.reference}` : ""}`,
      customer_name: first, customer_surname: rest.join(" ") || first, customer_email: input.email, customer_phone_number: input.phone,
      ...address,
      notify_url: urls.notifyUrl, return_url: urls.returnUrl, channels: CHANNELS[input.channel] || CHANNELS.mobile, lang: "fr", metadata: input.reference,
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

/** Libellé lisible du moyen de paiement renvoyé par CinetPay (ex. OM, VISAM, MASTERCARD). */
const methodLabel = (m) => (/VISA|MASTER|CARD|CB/i.test(m || "") ? "Carte bancaire" : "Orange Money") + (m ? ` (${m})` : "");

/* ---------- Enregistrement ---------- */
/**
 * Enregistre un paiement confirmé : journal serveur (Vercel ou Netlify → Logs → Functions) et, si WEB3FORMS_KEY
 * est renseignée, e-mail « Acompte reçu » à l’équipe. C’est ici que l’on branchera une base de données plus tard.
 */
export async function recordPayment(p) {
  console.log("[paiement]", JSON.stringify(p));
  const key = settings().web3formsKey;
  if (!key || p.status !== "paid") return;
  const lines = [
    "Un acompte vient d’être reçu sur le site Camayenne Plage.", "",
    `• Montant : ${formatAmount(p.amount)} ${p.currency}`,
    `• Moyen : ${methodLabel(p.method)} via CinetPay`,
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
