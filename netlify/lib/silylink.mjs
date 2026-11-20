// Paiement en ligne via Sily Link (passerelle guinéenne : Orange Money, MTN MoMo ; carte quand ils l'ouvriront).
// Documentation : https://silylink.com/documentation · SDK officiels : https://gitlab.com/sily-link/plugins
//
// Parcours : le site crée une session « checkout » (montant, référence, coordonnées du client), le client est
// redirigé vers la page sécurisée Sily Link où il valide sur son téléphone, puis revient sur /confirmation.
// Sily Link prévient le site (notify_url) ; le site revérifie toujours la session auprès de Sily Link avant
// d'enregistrer le paiement dans /admin.
//
// Variables (Vercel) : SILYLINK_API_KEY (slk_test_… pour les essais, slk_live_… pour le réel) et
// SILYLINK_ENCRYPTION_PASSWORD (secret HMAC), toutes deux affichées à la création de l'application dans
// Sily Link → Développeur → Gestion des apps. Facultatif : SILYLINK_API_URL (défaut https://silylink.com/api/v1).
import crypto from "node:crypto";

const env = (k) => (process.env[k] || "").trim();

export function reglages() {
  const apiKey = env("SILYLINK_API_KEY"), secret = env("SILYLINK_ENCRYPTION_PASSWORD");
  return {
    enabled: Boolean(apiKey && secret),
    apiKey, secret,
    test: apiKey.startsWith("slk_test_"),
    baseUrl: (env("SILYLINK_API_URL") || "https://silylink.com/api/v1").replace(/\/+$/, ""),
  };
}

const hmac = (texte, secret) => crypto.createHmac("sha256", secret).update(texte, "utf8").digest("hex");

function egal(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/*
 * Signature des requêtes d'écriture. La documentation (2026) signe « horodatage.nonce.corps » avec les en-têtes
 * SLK-Timestamp et SLK-Nonce ; les SDK officiels (v1.0.0) signent le corps seul. On essaie la première, puis la
 * seconde si Sily Link répond 401, et on retient celle qui marche. SILYLINK_SIGNATURE=corps|horodatage la fixe.
 */
let modeSignature = env("SILYLINK_SIGNATURE") === "corps" ? "corps" : "horodatage";
const modeFixe = Boolean(env("SILYLINK_SIGNATURE"));

function entetesSignes(mode, corps, secret) {
  if (mode === "corps") return { "SLK-HMAC-Signature": hmac(corps, secret) };
  const ts = String(Math.floor(Date.now() / 1000)), nonce = crypto.randomUUID();
  return { "SLK-Timestamp": ts, "SLK-Nonce": nonce, "SLK-HMAC-Signature": hmac(`${ts}.${nonce}.${corps}`, secret) };
}

async function appel(methode, chemin, donnees) {
  const s = reglages();
  const url = `${s.baseUrl}/${chemin.replace(/^\/+/, "")}`;
  const envoyer = async (mode) => {
    const corps = donnees ? JSON.stringify(donnees) : undefined;
    const headers = { Accept: "application/json", "SLK-Api-Key": s.apiKey };
    if (corps !== undefined) Object.assign(headers, { "Content-Type": "application/json" }, entetesSignes(mode, corps, s.secret));
    const res = await fetch(url, { method: methode, headers, body: corps, signal: AbortSignal.timeout(20000) });
    const texte = await res.text();
    let data = {};
    try { data = texte ? JSON.parse(texte) : {}; } catch { data = { message: texte.slice(0, 300) }; }
    return { http: res.status, data };
  };
  let r = await envoyer(modeSignature);
  if (donnees && r.http === 401 && !modeFixe) {
    const autre = modeSignature === "corps" ? "horodatage" : "corps";
    const r2 = await envoyer(autre);
    if (r2.http !== 401) modeSignature = autre;
    r = r2;
  }
  return r;
}

const message = (d) => (typeof d?.message === "string" && d.message) || (typeof d?.error === "string" && d.error) || "";

/** Statut normalisé : paid, failed ou pending (le statut peut être une chaîne ou un objet { code }). */
export function statutNormalise(data) {
  const brut = String(typeof data?.status === "string" ? data.status : data?.status?.code || "").toLowerCase();
  if (["paid", "success", "succeeded", "completed"].includes(brut)) return "paid";
  if (["failed", "expired", "cancelled", "canceled"].includes(brut)) return "failed";
  return "pending";
}

/** Numéro guinéen sans indicatif (9 chiffres), comme sur la page Sily Link ; sinon le numéro tel quel. */
function telephoneLocal(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("224")) return d.slice(3);
  return d.length === 9 ? d : "";
}

/**
 * Crée la session de paiement. `p` : { orderId, amount, name, email, phone, reference }, `base` : URL du site.
 * Renvoie { url, operationId }.
 */
export async function creerSession(p, base) {
  const [prenom, ...reste] = p.name.split(/\s+/).filter(Boolean);
  const client = { firstname: prenom || p.name, lastname: reste.join(" ") || prenom || p.name, email: p.email };
  const tel = telephoneLocal(p.phone);
  if (tel) client.tel = tel;
  const corps = {
    amount: p.amount,
    order_id: p.orderId,
    description: `Acompte Camayenne Plage${p.reference ? ` – réf. ${p.reference}` : ""}`.slice(0, 255),
    return_url: `${base}/confirmation?provider=silylink&transaction_id=${encodeURIComponent(p.orderId)}`,
    cancel_url: `${base}/paiement?annule=1`,
    notify_url: `${base}/api/paiement-silylink-notify`,
    options: { customer: client },
  };
  let r = await appel("POST", "checkout/create", corps);
  if (r.http === 422 && /custom|tel|phone|email|option/i.test(JSON.stringify(r.data))) {
    // Coordonnées refusées (format inattendu) : on réessaie sans elles, le client les saisira chez Sily Link.
    const { options: _o, ...sansOptions } = corps;
    r = await appel("POST", "checkout/create", sansOptions);
  }
  if (!r.data?.payment_url) throw new Error(`Sily Link : ${message(r.data) || `réponse inattendue (HTTP ${r.http})`}`);
  return { url: r.data.payment_url, operationId: r.data.operation_id || "" };
}

/** État réel d'une session, par notre référence (order_id) ou par l'operation_id de Sily Link. */
export async function verifierSession({ orderId, operationId }) {
  const chemin = operationId ? `checkout/session/${encodeURIComponent(operationId)}` : `checkout/order/${encodeURIComponent(orderId)}`;
  const { http, data } = await appel("GET", chemin);
  if (http === 404) return { status: "unknown" };
  if (http >= 400) throw new Error(`Sily Link : ${message(data) || `HTTP ${http}`}`);
  const tx = data.transaction && typeof data.transaction === "object" ? data.transaction : {};
  return {
    status: statutNormalise(data),
    orderId: data.order_id || tx.order_id || orderId || "",
    operationId: data.operation_id || operationId || "",
    amount: Number(data.amount ?? tx.amount) || 0,
    provider: tx.provider || data.payment_method || "",
  };
}

/** Webhook : clé API et signature HMAC du corps brut. Renvoie true si l'appel vient bien de Sily Link. */
export function webhookAuthentique(headers, corpsBrut) {
  const s = reglages();
  const cle = headers.get("slk-api-key") || "", sig = headers.get("slk-hmac-signature") || "";
  return Boolean(cle && sig && egal(cle, s.apiKey) && egal(hmac(corpsBrut, s.secret), sig));
}

/** Moyen de paiement lisible pour /admin. */
export const moyenLisible = (provider) =>
  ({ orange_money: "Orange Money", mtn_momo: "MTN MoMo", cc: "Carte bancaire", card: "Carte bancaire", paycard: "Paycard" })[String(provider || "").toLowerCase()] || "Paiement en ligne";

/**
 * Vérifie la session auprès de Sily Link puis enregistre le résultat dans la base (une seule fois).
 * Appelé par la notification de Sily Link et, par sécurité, par la page de confirmation.
 */
export async function verifierEtEnregistrer({ orderId, operationId }) {
  const { resultatPaiementEnLigne } = await import("./demandes.mjs");
  const v = await verifierSession({ orderId, operationId });
  if (v.status === "unknown" || !v.orderId) return v;
  await resultatPaiementEnLigne({ orderId: v.orderId, status: v.status, amount: v.amount, moyen: moyenLisible(v.provider), operationId: v.operationId });
  return v;
}
