// /api/admin : API de la page /admin (demandes de devis et acomptes).
// - Connexion par mot de passe d'équipe (ADMIN_PASSWORD), 8 essais ratés au plus par quart d'heure et par adresse IP.
// - Session dans un cookie signé avec ADMIN_SECRET (HttpOnly, 30 jours).
// - Données dans la base PostgreSQL (netlify/lib/demandes.mjs, variable DATABASE_URL).
import crypto from "node:crypto";
import {
  ajouterPaiement, historique, lister, modifierDemande, modifierPaiement, noterEchec, supprimerDemande, supprimerPaiement, tropDEssais, urlBase,
} from "../lib/demandes.mjs";

const COOKIE = "cp_admin";
const DUREE_SESSION = 30 * 24 * 3600;
const env = (k) => (process.env[k] || "").trim();

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

/* ---------- Session signée ---------- */

// La signature dépend aussi du mot de passe : le changer dans Vercel déconnecte tout le monde.
const cleSession = () => crypto.createHmac("sha256", env("ADMIN_SECRET")).update(`session|${env("ADMIN_PASSWORD")}`).digest();
const signer = (exp) => crypto.createHmac("sha256", cleSession()).update(`equipe|${exp}`).digest("base64url");

function creerCookie(secure) {
  const exp = Math.floor(Date.now() / 1000) + DUREE_SESSION;
  return `${COOKIE}=${exp}.${signer(exp)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${DUREE_SESSION}${secure ? "; Secure" : ""}`;
}
const effacerCookie = (secure) => `${COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;

const egal = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function sessionValide(request) {
  const brut = (request.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!brut) return false;
  const [exp, sig] = brut.slice(COOKIE.length + 1).split(".");
  return Boolean(exp && sig && egal(signer(exp), sig) && Number(exp) > Date.now() / 1000);
}

const adresseIp = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "inconnue";

/* ---------- Point d'entrée ---------- */

export default async (request) => {
  if (!env("ADMIN_PASSWORD") || !env("ADMIN_SECRET") || !urlBase()) return json({ erreur: "non-configure" }, 503);
  const secure = new URL(request.url).protocol === "https:";

  if (request.method === "GET") return sessionValide(request) ? json({ ok: true }) : json({ erreur: "connexion" }, 401);
  if (request.method !== "POST") return json({ erreur: "methode" }, 405);

  let d;
  try {
    d = await request.json();
  } catch {
    return json({ erreur: "requete" }, 400);
  }

  try {
    if (d.action === "connexion") {
      const ip = adresseIp(request);
      if (await tropDEssais(ip)) return json({ erreur: "essais" }, 429);
      if (!egal(String(d.motDePasse || ""), env("ADMIN_PASSWORD"))) {
        await noterEchec(ip);
        return json({ erreur: "mot-de-passe" }, 401);
      }
      return json({ ok: true }, 200, { "Set-Cookie": creerCookie(secure) });
    }
    if (d.action === "deconnexion") return json({ ok: true }, 200, { "Set-Cookie": effacerCookie(secure) });

    if (!sessionValide(request)) return json({ erreur: "connexion" }, 401);
    const reponse = (r) => (r.erreur ? json(r, r.erreur === "introuvable" ? 404 : 400) : json(r));
    switch (d.action) {
      case "donnees": return json(await lister());
      case "modifier": {
        const champs = { id: d.id };
        for (const k of ["statut", "devis", "notes", "confirmation"]) if (d[k] !== undefined) champs[k] = d[k];
        return reponse(await modifierDemande(champs));
      }
      case "supprimer": return reponse(await supprimerDemande(d.id));
      case "paiement-ajouter": return reponse(await ajouterPaiement(d));
      case "paiement-modifier": return reponse(await modifierPaiement({ id: d.id, pointe: d.pointe, statut: d.statut }));
      case "historique": return json(await historique(d.mois));
      case "paiement-supprimer": return reponse(await supprimerPaiement(d.id));
      default: return json({ erreur: "action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ erreur: "base" }, 500);
  }
};
