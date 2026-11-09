// Logique partagée des fonctions de paiement (Netlify Functions). Les clés viennent des variables d’environnement.
// Paiement en ligne via l’API CinetPay v1 (2026) : connexion par clé API (sk_live_… ou sk_test_…) et mot de passe API,
// puis page de paiement hébergée par CinetPay (Orange Money, MTN Mobile Money ; carte bancaire si le compte le permet).
// Référence : SDK officiel cinetpay-js (https://www.npmjs.com/package/cinetpay-js), support@cinetpay.com.
const CINETPAY_PROD = "https://api.cinetpay.co";
const CINETPAY_SANDBOX = "https://api.cinetpay.net";
export const CURRENCY = "GNF";

export function settings() {
  const env = process.env;
  const apiKey = env.CINETPAY_API_KEY || "", apiPassword = env.CINETPAY_API_PASSWORD || "";
  const enabled = Boolean(apiKey && apiPassword);
  return {
    cinetpay: {
      apiKey, apiPassword, currency: CURRENCY, enabled,
      // sk_test_… → bac à sable, sk_live_… → production ; CINETPAY_API_URL permet de forcer l’adresse.
      baseUrl: (env.CINETPAY_API_URL || (apiKey.startsWith("sk_test_") ? CINETPAY_SANDBOX : CINETPAY_PROD)).replace(/\/$/, ""),
      // La carte bancaire n’est proposée que si CinetPay l’a activée sur le compte : CINETPAY_CARD=1 pour l’afficher.
      card: enabled && env.CINETPAY_CARD === "1",
    },
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

/** Numéro au format international exigé par CinetPay (+224XXXXXXXXX) ; "" si impossible. */
export function normalizePhone(v) {
  let d = String(v || "").replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = `+${d.slice(2)}`;
  if (!d.startsWith("+")) d = d.length === 9 ? `+224${d}` : d.length >= 11 ? `+${d}` : "";
  return /^\+\d{8,15}$/.test(d) ? d : "";
}

/** Valide le corps JSON du formulaire de paiement. */
export function parsePaymentInput(body) {
  const b = body && typeof body === "object" ? body : {};
  const channel = b.channel === "card" ? "card" : "mobile";
  const name = str(b.name, 80), email = str(b.email, 120), phone = normalizePhone(str(b.phone, 30)), reference = str(b.reference, 40);
  const amount = Number(b.amount);
  if (name.length < 2) return { ok: false, error: "Indiquez votre nom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Indiquez un e-mail valide." };
  if (!Number.isInteger(amount)) return { ok: false, error: "Le montant doit être un nombre entier." };
  const { min, max } = amountBounds();
  if (amount < min || amount > max) return { ok: false, error: `Le montant doit être compris entre ${formatAmount(min)} et ${formatAmount(max)} ${CURRENCY}.` };
  if (channel === "card" && !settings().cinetpay.card) return { ok: false, error: "Le paiement par carte n’est pas encore activé." };
  return { ok: true, data: { channel, name, email, phone, reference, amount } };
}

export const readJson = (req) => req.json().catch(() => null);

/* ---------- Appels à l’API CinetPay v1 ---------- */
let tokenCache = { token: "", until: 0 };

async function api(method, path, body, token) {
  const s = settings().cinetpay;
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${s.baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { http: res.status, data };
}

/** Jeton d’accès (JWT) obtenu avec la clé et le mot de passe API, mis en cache 50 minutes. */
export async function getCinetPayToken(force = false) {
  const s = settings().cinetpay;
  if (!force && tokenCache.token && tokenCache.until > Date.now()) return tokenCache.token;
  const { data } = await api("POST", "/v1/oauth/login", { api_key: s.apiKey, api_password: s.apiPassword });
  if (!data.access_token) throw new Error(`CinetPay : connexion refusée (${data.status || "?"} – ${data.description || "pas de jeton"})`);
  tokenCache = { token: data.access_token, until: Date.now() + 50 * 60 * 1000 };
  return data.access_token;
}

/** Appel authentifié, avec une seconde tentative si le jeton a expiré (code 1003 / EXPIRED_TOKEN). */
async function authed(method, path, body) {
  let r = await api(method, path, body, await getCinetPayToken());
  if (r.http === 401 || r.data?.code === 1003 || r.data?.status === "EXPIRED_TOKEN") r = await api(method, path, body, await getCinetPayToken(true));
  return r;
}

/** Crée la transaction et renvoie l’URL de la page de paiement CinetPay. `urls.base` = origine publique du site. */
export async function createCinetPayPayment(input, urls) {
  const s = settings().cinetpay;
  // Identifiant marchand (30 caractères max) : il sert aussi de référence sur la page de confirmation.
  const transactionId = `CAM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const parts = input.name.split(/\s+/).filter(Boolean);
  let first = parts[0] || input.name, last = parts.slice(1).join(" ") || first;
  if (first.length < 2) first = input.name;
  if (last.length < 2) last = first;
  const body = {
    currency: s.currency, merchant_transaction_id: transactionId, amount: input.amount, lang: "fr",
    designation: `Acompte Camayenne Plage${input.reference ? ` – réf. ${input.reference}` : ""}`.slice(0, 255),
    client_email: input.email, client_first_name: first.slice(0, 255), client_last_name: last.slice(0, 255),
    success_url: `${urls.base}/api/paiement-cinetpay-retour?ref=${transactionId}&issue=ok`,
    failed_url: `${urls.base}/api/paiement-cinetpay-retour?ref=${transactionId}&issue=ko`,
    // Le montant voyage dans l’URL de notification : la notification CinetPay ne le contient pas et nous n’avons pas de base de données.
    notify_url: `${urls.base}/api/paiement-cinetpay-notify?ref=${transactionId}&amount=${input.amount}`,
    channel: "PUSH", // page hébergée : le client choisit son opérateur sur la page CinetPay
  };
  if (input.phone) body.client_phone_number = input.phone;
  const { http, data } = await authed("POST", "/v1/payment", body);
  if (!data.payment_url) throw new Error(`CinetPay : ${data.description || data.status || `réponse inattendue (HTTP ${http})`}`);
  return { transactionId, cinetpayId: data.transaction_id, url: data.payment_url };
}

/** État réel d’une transaction auprès de CinetPay (seule source fiable). `id` = notre identifiant marchand ou l’identifiant CinetPay. */
export async function checkCinetPayPayment(id) {
  const { data } = await authed("GET", `/v1/payment/${encodeURIComponent(id)}`);
  const raw = String(data.status || "").toUpperCase();
  const status = raw === "SUCCESS" ? "paid" : ["FAILED", "EXPIRED", "INSUFFICIENT_BALANCE"].includes(raw) ? "failed" : raw === "NOT_FOUND" || data.code === 404 ? "unknown" : "pending";
  return { status, raw, merchantId: data.merchant_transaction_id, cinetpayId: data.transaction_id, user: data.user || {} };
}

/** Identifiant de transaction reçu de CinetPay (notification JSON ou retour client), sinon notre référence dans l’URL. */
export async function readTransactionId(req) {
  const u = new URL(req.url);
  const fromQuery = u.searchParams.get("ref") || u.searchParams.get("transaction_id") || u.searchParams.get("merchant_transaction_id");
  if (req.method !== "POST") return fromQuery;
  const ct = req.headers.get("content-type") || "";
  let b = null;
  if (ct.includes("application/json")) b = (await req.json().catch(() => null)) || null;
  else { const fd = await req.formData().catch(() => null); if (fd) b = Object.fromEntries(fd.entries()); }
  const v = b?.transaction_id || b?.merchant_transaction_id || b?.payment_token;
  return (typeof v === "string" && v) || fromQuery;
}

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
    p.amount ? `• Montant : ${formatAmount(p.amount)} ${p.currency}` : "• Montant : à vérifier dans l’espace marchand CinetPay",
    "• Moyen : paiement en ligne via CinetPay",
    `• Référence : ${p.transactionId}${p.cinetpayId ? ` (CinetPay ${p.cinetpayId})` : ""}`,
    p.customer?.name ? `• Client : ${p.customer.name}` : "",
    p.customer?.email ? `• E-mail : ${p.customer.email}` : "",
    p.customer?.phone_number ? `• Téléphone : ${p.customer.phone_number}` : "",
  ].filter(Boolean);
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: key, subject: `Acompte reçu${p.amount ? ` – ${formatAmount(p.amount)} ${p.currency}` : ""}`, from_name: "Site Camayenne Plage", message: lines.join("\n") }),
    });
  } catch (e) { console.error("[paiement] notification e-mail impossible", e); }
}
