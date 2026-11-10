// /api/admin : API de la page /admin (tableau de bord des demandes).
// - Connexion par code à 6 chiffres envoyé par e-mail, réservée aux adresses de ADMIN_EMAILS.
// - Session dans un cookie signé (HttpOnly, 30 jours), sans base de données.
// - Les données restent dans la feuille Google : on les lit et on les modifie via son script (tableau-de-bord/suivi.gs),
//   en joignant la clé ADMIN_SECRET que seul ce serveur connaît.
//
// Variables : ADMIN_EMAILS (adresses autorisées, séparées par des virgules), ADMIN_SECRET (même valeur que dans le script),
// SHEET_URL (adresse /exec du script ; à défaut VITE_SHEET_URL).
import crypto from "node:crypto";

const COOKIE = "cp_admin";
const DUREE_SESSION = 30 * 24 * 3600;

const env = (k) => (process.env[k] || "").trim();
const urlFeuille = () => env("SHEET_URL") || env("VITE_SHEET_URL");
const autorises = () => env("ADMIN_EMAILS").toLowerCase().split(/[\s,;]+/).filter(Boolean);
const normaliser = (email) => String(email || "").trim().toLowerCase();

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

/* ---------- Session signée ---------- */

const cleSession = () => crypto.createHmac("sha256", env("ADMIN_SECRET")).update("session-admin-camayenne").digest();
const signer = (email, exp) => crypto.createHmac("sha256", cleSession()).update(`${email}|${exp}`).digest("base64url");

function creerCookie(email, secure) {
  const exp = Math.floor(Date.now() / 1000) + DUREE_SESSION;
  const valeur = `${Buffer.from(email).toString("base64url")}.${exp}.${signer(email, exp)}`;
  return `${COOKIE}=${valeur}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${DUREE_SESSION}${secure ? "; Secure" : ""}`;
}

const effacerCookie = (secure) => `${COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;

function lireSession(request) {
  const brut = (request.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!brut) return null;
  const [b64, exp, sig] = brut.slice(COOKIE.length + 1).split(".");
  if (!b64 || !exp || !sig) return null;
  const email = Buffer.from(b64, "base64url").toString();
  const attendu = Buffer.from(signer(email, exp));
  const recu = Buffer.from(sig);
  if (attendu.length !== recu.length || !crypto.timingSafeEqual(attendu, recu)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  // Une adresse retirée de ADMIN_EMAILS perd l'accès tout de suite, même avec un cookie valide.
  return autorises().includes(email) ? email : null;
}

/* ---------- Appel du script de la feuille ---------- */

async function script(action, donnees = {}) {
  const res = await fetch(urlFeuille(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, secret: env("ADMIN_SECRET"), ...donnees }),
    redirect: "follow",
  });
  const texte = await res.text();
  try {
    return JSON.parse(texte);
  } catch {
    throw new Error(`Réponse inattendue de la feuille (${res.status})`);
  }
}

/* ---------- Point d'entrée ---------- */

export default async (request) => {
  if (!env("ADMIN_SECRET") || !autorises().length || !urlFeuille()) return json({ erreur: "non-configure" }, 503);
  const secure = new URL(request.url).protocol === "https:";

  if (request.method === "GET") {
    const email = lireSession(request);
    return email ? json({ email }) : json({ erreur: "connexion" }, 401);
  }
  if (request.method !== "POST") return json({ erreur: "methode" }, 405);

  let d;
  try {
    d = await request.json();
  } catch {
    return json({ erreur: "requete" }, 400);
  }

  try {
    switch (d.action) {
      case "envoyer-code": {
        const email = normaliser(d.email);
        // Même réponse que l'adresse soit autorisée ou non : la page ne révèle pas la liste.
        if (autorises().includes(email)) {
          const r = await script("code-envoyer", { email });
          if (!r.ok) return json({ erreur: r.erreur || "envoi" }, 502);
        }
        return json({ ok: true });
      }
      case "verifier-code": {
        const email = normaliser(d.email);
        const code = String(d.code || "").replace(/\D/g, "");
        if (!autorises().includes(email) || code.length !== 6) return json({ ok: false, erreur: "code" }, 400);
        const r = await script("code-verifier", { email, code });
        if (!r.ok) return json({ ok: false, erreur: r.erreur || "code" }, 400);
        return json({ ok: true, email }, 200, { "Set-Cookie": creerCookie(email, secure) });
      }
      case "deconnexion":
        return json({ ok: true }, 200, { "Set-Cookie": effacerCookie(secure) });
    }

    // Les actions suivantes demandent une session valide.
    const email = lireSession(request);
    if (!email) return json({ erreur: "connexion" }, 401);
    if (d.action === "donnees") {
      const r = await script("lister");
      return r.ok ? json({ email, demandes: r.demandes, paiements: r.paiements }) : json({ erreur: r.erreur || "feuille" }, 502);
    }
    if (d.action === "modifier") {
      const champs = { id: d.id };
      for (const k of ["statut", "devis", "notes"]) if (d[k] !== undefined) champs[k] = d[k];
      const r = await script("modifier", champs);
      return r.ok ? json(r) : json({ erreur: r.erreur || "feuille" }, 400);
    }
    return json({ erreur: "action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ erreur: "feuille" }, 502);
  }
};
