// Comptes de la page /admin : adresse e-mail + mot de passe personnel, haché (scrypt) dans la base.
//
// - ADMIN_EMAILS (Vercel) : adresses autorisées, séparées par des virgules. Une adresse retirée perd l'accès.
// - ADMIN_PASSWORD (Vercel) : clé de secours. Elle sert de mot de passe provisoire à la première connexion
//   et en cas d'oubli ; l'utiliser oblige toujours à choisir un nouveau mot de passe avant d'aller plus loin.
// - Changer de mot de passe déconnecte les autres appareils (numéro de version du compte).
import crypto from "node:crypto";
import { promisify } from "node:util";
import { base } from "./demandes.mjs";

const scrypt = promisify(crypto.scrypt);
const env = (k) => (process.env[k] || "").trim();

export const autorises = () => env("ADMIN_EMAILS").toLowerCase().split(/[\s,;]+/).filter(Boolean);
export const normaliser = (email) => String(email || "").trim().toLowerCase();

export const egal = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* ---------- Hachage ---------- */

async function hacher(motDePasse) {
  const sel = crypto.randomBytes(16).toString("base64url");
  const h = await scrypt(motDePasse, sel, 32);
  return `scrypt$${sel}$${h.toString("base64url")}`;
}

async function verifierHash(motDePasse, stocke) {
  const [algo, sel, attendu] = String(stocke || "").split("$");
  if (algo !== "scrypt" || !sel || !attendu) return false;
  const h = await scrypt(motDePasse, sel, 32);
  return egal(h.toString("base64url"), attendu);
}

/* ---------- Comptes ---------- */

let tablePrete = null;
async function q() {
  const requete = await base();
  if (!tablePrete) {
    tablePrete = requete(`create table if not exists comptes (
      id serial primary key,
      email text not null unique,
      hash text,
      doit_changer boolean not null default true,
      version integer not null default 1,
      cree timestamptz not null default now(),
      derniere_connexion timestamptz
    )`).catch((e) => { tablePrete = null; throw e; });
  }
  await tablePrete;
  return requete;
}

export async function compteParId(id) {
  const r = await (await q())(`select id, email, doit_changer, version from comptes where id = $1`, [Number(id)]);
  return r[0] || null;
}

/** Règles d'un nouveau mot de passe ; renvoie un code d'erreur ou null. */
export function regleMotDePasse(nouveau) {
  const s = String(nouveau || "");
  if (s.length < 10) return "trop-court";
  if (!/[A-Za-zÀ-ÿ]/.test(s) || !/\d/.test(s)) return "trop-simple";
  if (egal(s, env("ADMIN_PASSWORD"))) return "cle-de-secours";
  return null;
}

/**
 * Connexion. Renvoie { compte } (doit_changer à true s'il faut choisir un mot de passe) ou { erreur }.
 * Même message d'erreur que l'adresse soit inconnue ou le mot de passe faux.
 */
export async function connecter(email, motDePasse) {
  const e = normaliser(email);
  const mdp = String(motDePasse || "");
  if (!autorises().includes(e) || !mdp) return { erreur: "identifiants" };
  const requete = await q();
  let [compte] = await requete(`select id, email, hash, doit_changer, version from comptes where email = $1`, [e]);

  if (compte?.hash && (await verifierHash(mdp, compte.hash))) {
    await requete(`update comptes set derniere_connexion = now() where id = $1`, [compte.id]);
    return { compte, secours: false };
  }
  if (egal(mdp, env("ADMIN_PASSWORD"))) {
    // Clé de secours : première connexion ou mot de passe oublié. Le compte doit choisir un nouveau mot de passe.
    if (!compte) {
      [compte] = await requete(`insert into comptes (email, doit_changer) values ($1, true) returning id, email, hash, doit_changer, version`, [e]);
    } else {
      [compte] = await requete(`update comptes set doit_changer = true, derniere_connexion = now() where id = $1 returning id, email, hash, doit_changer, version`, [compte.id]);
    }
    return { compte, secours: true };
  }
  return { erreur: "identifiants" };
}

/** Nouveau mot de passe. `ancien` est exigé sauf si le compte vient d'entrer avec la clé de secours. */
export async function changerMotDePasse(compteId, ancien, nouveau) {
  const requete = await q();
  const [compte] = await requete(`select id, email, hash, doit_changer, version from comptes where id = $1`, [Number(compteId)]);
  if (!compte) return { erreur: "connexion" };
  if (!compte.doit_changer && !(await verifierHash(String(ancien || ""), compte.hash))) return { erreur: "ancien" };
  const regle = regleMotDePasse(nouveau);
  if (regle) return { erreur: regle };
  if (compte.hash && (await verifierHash(String(nouveau), compte.hash))) return { erreur: "identique" };
  const [maj] = await requete(
    `update comptes set hash = $1, doit_changer = false, version = version + 1 where id = $2 returning id, email, doit_changer, version`,
    [await hacher(String(nouveau)), compte.id]);
  return { compte: maj };
}
