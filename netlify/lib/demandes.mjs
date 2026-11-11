// Stockage des demandes de devis, des acomptes et du journal des actions, dans une base PostgreSQL
// (Neon, rattachée au projet Vercel). Utilisé par :
// - netlify/functions/demande.mjs (formulaire « Demander un devis » du site),
// - netlify/functions/paiement-declare.mjs (acompte Orange Money déclaré sur la page Paiement, mode manuel),
// - netlify/functions/admin.mjs (page /admin).
//
// Variable : DATABASE_URL (créée par l'intégration Neon de Vercel ; POSTGRES_URL accepté aussi).
// En local, DATABASE_URL=pglite lance une base PostgreSQL embarquée en mémoire (tests, sans serveur).
// Rien n'est jamais effacé automatiquement : le tableau de bord montre le mois en cours, l'historique tous les mois.

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
  // Une lecture qui échoue (base en veille qui se réveille, coupure réseau) est retentée une fois.
  return async (texte, params = []) => {
    try {
      return await sql.query(texte, params);
    } catch (e) {
      if (!/^\s*select/i.test(texte)) throw e;
      await new Promise((r) => setTimeout(r, 400));
      return sql.query(texte, params);
    }
  };
}

// Les « add column if not exists » font évoluer une base déjà créée sans rien perdre.
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
  `alter table paiements add column if not exists telephone text`,
  `alter table paiements add column if not exists email text`,
  `alter table paiements add column if not exists transaction text`,
  `alter table paiements add column if not exists origine text not null default 'admin'`,
  `create table if not exists journal (
    id serial primary key,
    quand timestamptz not null default now(),
    action text not null, objet text not null, objet_id integer, resume text not null
  )`,
  `create index if not exists journal_quand on journal (quand)`,
  `create table if not exists tentatives (ip text not null, quand timestamptz not null default now())`,
];

/** Renvoie la fonction de requête ; crée ou met à jour les tables au premier appel. */
export function base() {
  if (!pret) {
    pret = (async () => {
      const q = await connecter();
      // Plusieurs serveurs peuvent démarrer en même temps : une mise à jour du schéma qui échoue est retentée,
      // puis ignorée (les tables existent déjà dans ce cas) plutôt que de bloquer la page.
      for (const s of SCHEMA) {
        try {
          await q(s);
        } catch {
          await new Promise((r) => setTimeout(r, 300));
          await q(s).catch((e) => console.error("Schéma :", e.message));
        }
      }
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
const gnf = (n) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR").replace(/ | /g, " ")} GNF`;

/* ---------- Journal ---------- */

async function journaliser(q, action, objet, objetId, resume) {
  await q(`insert into journal (action, objet, objet_id, resume) values ($1, $2, $3, $4)`, [action, objet, objetId, texte(resume, 400)]);
}

/* ---------- Lecture (dates rendues en texte : même format quel que soit le pilote) ---------- */

const COLS_DEMANDE = `id, to_char(recue at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as recue,
  nom, email, coalesce(org, '') as org, coalesce(tel, '') as tel, coalesce(type, '') as type,
  coalesce(to_char(date_souhaitee, 'YYYY-MM-DD'), '') as date, nb, coalesce(duree, '') as duree,
  coalesce(espaces, '') as espaces, coalesce(services, '') as services, coalesce(message, '') as message,
  statut, devis::float8 as devis, coalesce(notes, '') as notes, coalesce(confirmation, '') as confirmation`;

const COLS_PAIEMENT = `id, to_char(date, 'YYYY-MM-DD') as date, coalesce(client, '') as client,
  coalesce(reference, '') as reference, montant::float8 as montant, coalesce(moyen, '') as moyen,
  statut, pointe, coalesce(notes, '') as notes, coalesce(telephone, '') as telephone, coalesce(email, '') as email,
  coalesce(transaction, '') as transaction, origine,
  to_char(cree at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as cree`;

const COLS_JOURNAL = `id, to_char(quand at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as quand, action, objet, objet_id, resume`;

export async function lister() {
  const q = await base();
  const [demandes, paiements] = await Promise.all([
    q(`select ${COLS_DEMANDE} from demandes order by recue desc, id desc`),
    q(`select ${COLS_PAIEMENT} from paiements order by date desc, id desc`),
  ]);
  return { demandes, paiements };
}

/**
 * Historique d'un mois (« 2026-11 ») : résumé chiffré, demandes reçues, paiements, journal des actions,
 * et liste des mois qui ont des données (pour naviguer).
 */
export async function historique(mois) {
  const m = /^\d{4}-\d{2}$/.test(String(mois || "")) ? mois : new Date().toISOString().slice(0, 7);
  const debut = `${m}-01`;
  const q = await base();
  const fenetre = `>= $1::date and %s < ($1::date + interval '1 month')`;
  const [demandes, paiements, journal, moisDispo] = await Promise.all([
    q(`select ${COLS_DEMANDE} from demandes where recue ${fenetre.replace("%s", "recue")} order by recue desc`, [debut]),
    q(`select ${COLS_PAIEMENT} from paiements where date ${fenetre.replace("%s", "date")} order by date desc, id desc`, [debut]),
    q(`select ${COLS_JOURNAL} from journal where quand ${fenetre.replace("%s", "quand")} order by quand desc, id desc`, [debut]),
    q(`select distinct m from (
         select to_char(recue at time zone 'UTC', 'YYYY-MM') as m from demandes
         union select to_char(date, 'YYYY-MM') from paiements
         union select to_char(quand at time zone 'UTC', 'YYYY-MM') from journal
       ) t order by m desc`),
  ]);
  const encaisse = paiements.filter((p) => p.statut === "Confirmé").reduce((s, p) => s + p.montant, 0);
  return {
    mois: m,
    resume: {
      demandes: demandes.length,
      confirmees: demandes.filter((d) => d.statut === "Confirmé" || d.statut === "Acompte reçu").length,
      annulees: demandes.filter((d) => d.statut === "Annulé").length,
      encaisse,
      paiements: paiements.filter((p) => p.statut === "Confirmé").length,
      aVerifier: paiements.filter((p) => p.statut === "En attente").length,
    },
    demandes, paiements, journal,
    moisDispo: [...new Set([m, ...moisDispo.map((r) => r.m)])].sort().reverse(),
  };
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
  const type = texte(d.type, 80);
  const date = dateIso(d.date);
  const [{ id }] = await q(
    `insert into demandes (nom, email, org, tel, type, date_souhaitee, nb, duree, espaces, services, message)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
    [nom, email, texte(d.org, 160), texte(d.tel, 30), type, date, nb || null,
      texte(d.duree, 40), liste(d.espaces), liste(d.services), texte(d.msg, 3000)],
  );
  await journaliser(q, "Demande reçue", "demande", id,
    `${nom} · ${[type, date && `le ${date.split("-").reverse().join("/")}`, nb && `${nb} pers.`].filter(Boolean).join(", ")}`);
  return { ok: true };
}

export async function modifierDemande(d) {
  const q = await base();
  const [avant] = await q(`select ${COLS_DEMANDE} from demandes where id = $1`, [Number(d.id)]);
  if (!avant) return { erreur: "introuvable" };
  const sets = [];
  const params = [];
  const traces = [];
  const ajouter = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (d.statut !== undefined && d.statut !== avant.statut) {
    if (!STATUTS.includes(d.statut)) return { erreur: "statut" };
    ajouter("statut", d.statut);
    traces.push(["Statut changé", `${avant.nom} : ${avant.statut} → ${d.statut}`]);
  }
  if (d.devis !== undefined) {
    const devis = d.devis === "" || d.devis === null ? null : entier(d.devis);
    if (d.devis !== "" && d.devis !== null && devis === null) return { erreur: "devis" };
    if (devis !== (avant.devis ?? null)) {
      ajouter("devis", devis);
      traces.push(["Devis modifié", `${avant.nom} : ${devis === null ? "montant retiré" : gnf(devis)}`]);
    }
  }
  if (d.notes !== undefined && texte(d.notes, 500) !== avant.notes) {
    ajouter("notes", texte(d.notes, 500));
    traces.push(["Note modifiée", `${avant.nom} : ${texte(d.notes, 120) || "note effacée"}`]);
  }
  if (d.confirmation !== undefined) {
    ajouter("confirmation", texte(d.confirmation, 200));
    traces.push(["Confirmation envoyée", `${avant.nom} : ${texte(d.confirmation, 200)}`]);
  }
  if (sets.length) {
    params.push(Number(d.id));
    await q(`update demandes set ${sets.join(", ")}, maj = now() where id = $${params.length}`, params);
    for (const [action, resume] of traces) await journaliser(q, action, "demande", Number(d.id), resume);
  }
  const [demande] = await q(`select ${COLS_DEMANDE} from demandes where id = $1`, [Number(d.id)]);
  return { ok: true, demande };
}

export async function supprimerDemande(id) {
  const q = await base();
  const rows = await q(`delete from demandes where id = $1 returning nom, type, statut`, [Number(id)]);
  if (!rows.length) return { erreur: "introuvable" };
  await journaliser(q, "Demande supprimée", "demande", Number(id), `${rows[0].nom} · ${rows[0].type || "sans type"} (statut ${rows[0].statut})`);
  return { ok: true };
}

/* ---------- Paiements ---------- */

function champsPaiement(d) {
  const date = dateIso(d.date);
  const montant = entier(d.montant);
  if (!date) return { erreur: "date" };
  if (montant === null || montant === 0) return { erreur: "montant" };
  if (d.moyen && !MOYENS.includes(d.moyen)) return { erreur: "moyen" };
  if (d.statut && !STATUTS_PAIEMENT.includes(d.statut)) return { erreur: "statut" };
  return { date, montant };
}

/** Acompte saisi par l'équipe dans /admin. */
export async function ajouterPaiement(d) {
  const c = champsPaiement(d);
  if (c.erreur) return c;
  const q = await base();
  const client = texte(d.client, 160);
  const [{ id }] = await q(
    `insert into paiements (date, client, reference, montant, moyen, statut, pointe, notes, transaction, origine)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'admin') returning id`,
    [c.date, client, texte(d.reference, 60), c.montant, d.moyen || "", d.statut || "Confirmé", d.pointe === true,
      texte(d.notes, 300), texte(d.transaction, 60)]);
  await journaliser(q, "Paiement ajouté", "paiement", id, `${client || "Client non précisé"} · ${gnf(c.montant)} · ${d.moyen || "moyen non précisé"} · ${d.statut || "Confirmé"}`);
  const [paiement] = await q(`select ${COLS_PAIEMENT} from paiements where id = $1`, [id]);
  return { ok: true, paiement };
}

/** Acompte Orange Money déclaré par le client sur la page Paiement (mode manuel) : à vérifier par l'équipe. */
export async function declarerPaiement(d) {
  const nom = texte(d.name, 120);
  const email = texte(d.email, 160);
  const telephone = texte(d.phone, 30);
  const transaction = texte(d.transaction, 60).replace(/\s+/g, "");
  const montant = entier(d.amount, 1e10);
  if (nom.length < 2 || !estEmail(email)) return { erreur: "champs" };
  if (!/^[A-Za-z0-9./_-]{4,60}$/.test(transaction)) return { erreur: "transaction" };
  if (!montant || montant < 50000) return { erreur: "montant" };
  const q = await base();
  const [{ n }] = await q(`select count(*)::int as n from paiements where origine = 'site' and cree > now() - interval '1 hour'`);
  if (n >= 30) return { erreur: "limite" };
  const deja = await q(`select id from paiements where lower(transaction) = lower($1) limit 1`, [transaction]);
  if (deja.length) return { erreur: "doublon" };
  const [{ id }] = await q(
    `insert into paiements (date, client, reference, montant, moyen, statut, pointe, telephone, email, transaction, origine)
     values ((now() at time zone 'UTC')::date, $1, $2, $3, 'Orange Money', 'En attente', false, $4, $5, $6, 'site') returning id`,
    [nom, texte(d.reference, 60), montant, telephone, email, transaction]);
  await journaliser(q, "Paiement déclaré sur le site", "paiement", id, `${nom} · ${gnf(montant)} · Orange Money · transaction ${transaction} · à vérifier`);
  return { ok: true };
}

export async function modifierPaiement(d) {
  const q = await base();
  const [avant] = await q(`select ${COLS_PAIEMENT} from paiements where id = $1`, [Number(d.id)]);
  if (!avant) return { erreur: "introuvable" };
  const sets = [];
  const params = [];
  const traces = [];
  const libelle = `${avant.client || "Client non précisé"} · ${gnf(avant.montant)}`;
  if (d.pointe !== undefined && (d.pointe === true) !== avant.pointe) {
    params.push(d.pointe === true); sets.push(`pointe = $${params.length}`);
    traces.push([d.pointe === true ? "Paiement pointé" : "Pointage retiré", libelle]);
  }
  if (d.statut !== undefined && d.statut !== avant.statut) {
    if (!STATUTS_PAIEMENT.includes(d.statut)) return { erreur: "statut" };
    params.push(d.statut); sets.push(`statut = $${params.length}`);
    traces.push(["Statut du paiement changé", `${libelle} : ${avant.statut} → ${d.statut}`]);
  }
  if (sets.length) {
    params.push(Number(d.id));
    await q(`update paiements set ${sets.join(", ")} where id = $${params.length}`, params);
    for (const [action, resume] of traces) await journaliser(q, action, "paiement", Number(d.id), resume);
  }
  const [paiement] = await q(`select ${COLS_PAIEMENT} from paiements where id = $1`, [Number(d.id)]);
  return { ok: true, paiement };
}

export async function supprimerPaiement(id) {
  const q = await base();
  const rows = await q(`delete from paiements where id = $1 returning client, montant::float8 as montant, statut`, [Number(id)]);
  if (!rows.length) return { erreur: "introuvable" };
  await journaliser(q, "Paiement supprimé", "paiement", Number(id), `${rows[0].client || "Client non précisé"} · ${gnf(rows[0].montant)} (statut ${rows[0].statut})`);
  return { ok: true };
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
