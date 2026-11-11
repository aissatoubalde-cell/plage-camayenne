// /api/admin : API de la page /admin (demandes de devis, acomptes, historique).
// - Connexion par adresse e-mail autorisée (ADMIN_EMAILS) et mot de passe personnel (netlify/lib/comptes.mjs).
//   Première connexion ou oubli : clé de secours ADMIN_PASSWORD, puis nouveau mot de passe obligatoire.
// - 8 essais ratés au plus par quart d'heure et par adresse IP.
// - Session dans un cookie signé avec ADMIN_SECRET (HttpOnly, 30 jours), liée à la version du compte :
//   changer de mot de passe déconnecte les autres appareils.
// - Données dans la base PostgreSQL (netlify/lib/demandes.mjs, variable DATABASE_URL).
import crypto from "node:crypto";
import {
  ajouterPaiement, historique, journaliser, lister, modifierDemande, modifierPaiement, noterEchec, supprimerDemande, supprimerPaiement, tropDEssais, urlBase,
} from "../lib/demandes.mjs";
import { autorises, changerMotDePasse, compteParId, connecter, egal } from "../lib/comptes.mjs";

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

const cleSession = () => crypto.createHmac("sha256", env("ADMIN_SECRET")).update("session-compte").digest();
const signer = (charge) => crypto.createHmac("sha256", cleSession()).update(charge).digest("base64url");

function creerCookie(compte, secure) {
  const exp = Math.floor(Date.now() / 1000) + DUREE_SESSION;
  const charge = `${compte.id}.${compte.version}.${exp}`;
  return `${COOKIE}=${charge}.${signer(charge)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${DUREE_SESSION}${secure ? "; Secure" : ""}`;
}
const effacerCookie = (secure) => `${COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;

/** Compte de la session, ou null. Vérifie la signature, l'expiration, la version du compte et l'adresse autorisée. */
async function compteDeSession(request) {
  const brut = (request.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!brut) return null;
  const morceaux = brut.slice(COOKIE.length + 1).split(".");
  if (morceaux.length !== 4) return null;
  const [id, version, exp, sig] = morceaux;
  if (!egal(signer(`${id}.${version}.${exp}`), sig) || Number(exp) < Date.now() / 1000) return null;
  const compte = await compteParId(id);
  if (!compte || String(compte.version) !== version || !autorises().includes(compte.email)) return null;
  return compte;
}

const adresseIp = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "inconnue";

/* ---------- Point d'entrée ---------- */

export default async (request) => {
  if (!env("ADMIN_PASSWORD") || !env("ADMIN_SECRET") || !autorises().length || !urlBase()) return json({ erreur: "non-configure" }, 503);
  const secure = new URL(request.url).protocol === "https:";

  try {
    if (request.method === "GET") {
      const compte = await compteDeSession(request);
      return compte ? json({ email: compte.email, changer: compte.doit_changer }) : json({ erreur: "connexion" }, 401);
    }
    if (request.method !== "POST") return json({ erreur: "methode" }, 405);

    let d;
    try {
      d = await request.json();
    } catch {
      return json({ erreur: "requete" }, 400);
    }

    if (d.action === "connexion") {
      const ip = adresseIp(request);
      if (await tropDEssais(ip)) return json({ erreur: "essais" }, 429);
      const r = await connecter(d.email, d.motDePasse);
      if (r.erreur) {
        await noterEchec(ip);
        return json({ erreur: r.erreur }, 401);
      }
      await journaliser(null, "Connexion", "compte", r.compte.id, `${r.compte.email}${r.secours ? " · avec la clé de secours" : ""}`);
      return json({ email: r.compte.email, changer: r.compte.doit_changer }, 200, { "Set-Cookie": creerCookie(r.compte, secure) });
    }
    if (d.action === "deconnexion") return json({ ok: true }, 200, { "Set-Cookie": effacerCookie(secure) });

    const compte = await compteDeSession(request);
    if (!compte) return json({ erreur: "connexion" }, 401);

    if (d.action === "changer-mot-de-passe") {
      const r = await changerMotDePasse(compte.id, d.ancien, d.nouveau);
      if (r.erreur) return json({ erreur: r.erreur }, 400);
      await journaliser(null, "Mot de passe changé", "compte", compte.id, compte.email);
      return json({ email: r.compte.email, changer: false }, 200, { "Set-Cookie": creerCookie(r.compte, secure) });
    }
    // Tant que le mot de passe provisoire n'est pas remplacé, rien d'autre n'est accessible.
    if (compte.doit_changer) return json({ erreur: "changer" }, 403);

    const reponse = (r) => (r.erreur ? json(r, r.erreur === "introuvable" ? 404 : 400) : json(r));
    switch (d.action) {
      case "donnees": return json({ ...(await lister()), email: compte.email });
      case "modifier": {
        const champs = { id: d.id };
        for (const k of ["statut", "devis", "notes", "confirmation"]) if (d[k] !== undefined) champs[k] = d[k];
        return reponse(await modifierDemande(champs));
      }
      case "supprimer": return reponse(await supprimerDemande(d.id));
      case "paiement-ajouter": return reponse(await ajouterPaiement(d));
      case "paiement-modifier": return reponse(await modifierPaiement({ id: d.id, pointe: d.pointe, statut: d.statut }));
      case "paiement-supprimer": return reponse(await supprimerPaiement(d.id));
      case "historique": return json(await historique(d.mois));
      default: return json({ erreur: "action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ erreur: "base" }, 500);
  }
};
