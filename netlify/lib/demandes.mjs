// Stockage des demandes de devis et des acomptes, dans une base PostgreSQL (Neon, rattachée au projet Vercel).
// Utilisé par netlify/functions/demande.mjs (formulaire du site) et netlify/functions/admin.mjs (page /admin).
//
// Variable : DATABASE_URL (créée par l'intégration Neon de Vercel ; POSTGRES_URL accepté aussi).
// En local, DATABASE_URL=pglite lance une base PostgreSQL embarquée en mémoire (tests, sans serveur).

export const STATUTS = ["Nouvelle", "Contacté", "Devis envoyé", "Acompte reçu", "Confirmé", "Annulé"];
export const MOYENS = ["Orange Money", "Carte bancaire", "Espèces", "Virement"];
export const STATUTS_PAIEMENT = ["Confirmé", "En attente", "Refusé", "Remboursé"];

export const urlBase = () => (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();

/* ---------- Connexion ---------- */

let pret = null;

async function connecter() {
  const url = urlBase();
  if (url === "pglite") {
    // Nom de module dans une variable : l'outil d'empaquetage de Vercel ne l'embarque pas en production.
    const nom = "@electric-sql/pglite";
    const { PGlite } = await import(nom);
    const db = new PGlite();
    return async (texte, params = []) => (await db.query(texte, params)).rows;
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  return (texte, params = []) => sql.query(texte, params);
}

const SCHEMA = [
  `create table if not exists demandes (
    id serial primary key,
    recue timestamptz not null default now(),
    nom text not null, email text not null, org text, tel text,
    type text, date_souhaitee date, nb integer, duree text, espaces text, services text, message text,
    statut text not null default 'Nouvelle', devis bigint, notes text, confirmation text,
    maj timestamptz not null default now()
  )`,
  `create table if not exists paiements (
    id serial primary key,
    date date not null, client text, reference text, montant bigint not null default 0,
    moyen text, statut text not null default 'Confirmé', pointe boolean not null default false, notes text,
    cree timestamptz not null default now()
  )`,
  `create table if not exists tentatives (ip text not null, quand timestamptz not null default now())`,
];

/** Renvoie la fonction de requête ; crée les tables au premier appel. */
export function base() {
  if (!pret) {
    pret = (async () => {
      const q = await connecter();
      for (const s of SCHEMA) await q(s);
      return q;
    })().catch((e) => { pret = null; throw e; });
  }
  return pret;
}

/* ---------- Nettoyage des champs ---------- */

export const texte = (v, max = 200) => String(v == null ? "" : v).trim().slice(0, max);
export const liste = (v) => texte(Array.isArray(v) ? v.join(", ") : v, 400);
export const estEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());
export const entier = (v, max = 1e12) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^\d.-]/g, "")));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};
export const dateIso = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : null);

/* ---------- Lecture (dates rendues en texte : même format quel que soit le pilote) ---------- */

const COLS_DEMANDE = `id, to_char(recue at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as recue,
  nom, email, coalesce(org, '') as org, coalesce(tel, '') as tel, coalesce(type, '') as type,
  coalesce(to_char(date_souhaitee, 'YYYY-MM-DD'), '') as date, nb, coalesce(duree, '') as duree,
  coalesce(espaces, '') as espaces, coalesce(services, '') as services, coalesce(message, '') as message,
  statut, devis::float8 as devis, coalesce(notes, '') as notes, coalesce(confirmation, '') as confirmation`;

const COLS_PAIEMENT = `id, to_char(date, 'YYYY-MM-DD') as date, coalesce(client, '') as client,
  coalesce(reference, '') as reference, montant::float8 as montant, coalesce(moyen, '') as moyen,
  statut, pointe, coalesce(notes, '') as notes`;

export async function lister() {
  const q = await base();
  const [demandes, paiements] = await Promise.all([
    q(`select ${COLS_DEMANDE} from demandes order by recue desc, id desc`),
    q(`select ${COLS_PAIEMENT} from paiements order by date desc, id desc`),
  ]);
  return { demandes, paiements };
}

/* ---------- Demandes ---------- */

/** Nouvelle demande venant du formulaire du site. Renvoie { ok } ou { erreur }. */
export async function ajouterDemande(d) {
  const nom = texte(d.nom, 120);
  const email = texte(d.email, 160);
  if (!nom || !estEmail(email)) return { erreur: "champs" };
  const q = await base();
  // Plafond anti-abus : le formulaire est public.
  const [{ n }] = await q(`select count(*)::int as n from demandes where recue > now() - interval '1 hour'`);
  if (n >= 60) return { erreur: "limite" };
  const nb = entier(d.nb, 100000);
  await q(
    `insert into demandes (nom, email, org, tel, type, date_souhaitee, nb, duree, espaces, services, message)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [nom, email, texte(d.org, 160), texte(d.tel, 30), texte(d.type, 80), dateIso(d.date), nb || null,
      texte(d.duree, 40), liste(d.espaces), liste(d.services), texte(d.msg, 3000)],
  );
  return { ok: true };
}

export async function modifierDemande(d) {
  const sets = [];
  const params = [];
  const ajouter = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (d.statut !== undefined) {
    if (!STATUTS.includes(d.statut)) return { erreur: "statut" };
    ajouter("statut", d.statut);
  }
  if (d.devis !== undefined) {
    const devis = d.devis === "" || d.devis === null ? null : entier(d.devis);
    if (d.devis !== "" && d.devis !== null && devis === null) return { erreur: "devis" };
    ajouter("devis", devis);
  }
  if (d.notes !== undefined) ajouter("notes", texte(d.notes, 500));
  if (d.confirmation !== undefined) ajouter("confirmation", texte(d.confirmation, 200));
  if (!sets.length) return { erreur: "vide" };
  const q = await base();
  params.push(Number(d.id));
  const rows = await q(`update demandes set ${sets.join(", ")}, maj = now() where id = $${params.length} returning id`, params);
  if (!rows.length) return { erreur: "introuvable" };
  const [demande] = await q(`select ${COLS_DEMANDE} from demandes where id = $1`, [Number(d.id)]);
  return { ok: true, demande };
}

export async function supprimerDemande(id) {
  const q = await base();
  const rows = await q(`delete from demandes where id = $1 returning id`, [Number(id)]);
  return rows.length ? { ok: true } : { erreur: "introuvable" };
}

/* ---------- Paiements ---------- */

function champsPaiement(d) {
  const date = dateIso(d.date);
  const montant = entier(d.montant);
  if (!date) return { erreur: "date" };
  if (montant === null || montant === 0) return { erreur: "montant" };
  if (d.moyen && !MOYENS.includes(d.moyen)) return { erreur: "moyen" };
  if (d.statut && !STATUTS_PAIEMENT.includes(d.statut)) return { erreur: "statut" };
  return {
    valeurs: [date, texte(d.client, 160), texte(d.reference, 60), montant, d.moyen || "", d.statut || "Confirmé",
      d.pointe === true, texte(d.notes, 300)],
  };
}

export async function ajouterPaiement(d) {
  const c = champsPaiement(d);
  if (c.erreur) return c;
  const q = await base();
  const [{ id }] = await q(
    `insert into paiements (date, client, reference, montant, moyen, statut, pointe, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`, c.valeurs);
  const [paiement] = await q(`select ${COLS_PAIEMENT} from paiements where id = $1`, [id]);
  return { ok: true, paiement };
}

export async function pointerPaiement(id, pointe) {
  const q = await base();
  const rows = await q(`update paiements set pointe = $1 where id = $2 returning id`, [pointe === true, Number(id)]);
  if (!rows.length) return { erreur: "introuvable" };
  const [paiement] = await q(`select ${COLS_PAIEMENT} from paiements where id = $1`, [Number(id)]);
  return { ok: true, paiement };
}

export async function supprimerPaiement(id) {
  const q = await base();
  const rows = await q(`delete from paiements where id = $1 returning id`, [Number(id)]);
  return rows.length ? { ok: true } : { erreur: "introuvable" };
}

/* ---------- Limite des essais de mot de passe ---------- */

export async function tropDEssais(ip) {
  const q = await base();
  await q(`delete from tentatives where quand < now() - interval '1 day'`);
  const [{ n, total }] = await q(
    `select count(*) filter (where ip = $1)::int as n, count(*)::int as total
     from tentatives where quand > now() - interval '15 minutes'`, [ip]);
  return n >= 8 || total >= 40;
}

export async function noterEchec(ip) {
  const q = await base();
  await q(`insert into tentatives (ip) values ($1)`, [ip]);
}
