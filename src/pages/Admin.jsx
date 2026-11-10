import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { inputCls, labelCls } from "../components/ui";
import { Icon } from "../components/ui/icons";
import { useTitle } from "../hooks";

/*
 * Page /admin : tableau de bord des demandes de devis, réservé à l'équipe.
 * Connexion par code reçu par e-mail ; les données viennent de la feuille Google via /api/admin
 * (netlify/functions/admin.mjs). La page n'est liée nulle part sur le site et n'est pas indexée.
 */

const API = "/api/admin";
const STATUTS = ["Nouvelle", "Contacté", "Devis envoyé", "Acompte reçu", "Confirmé", "Annulé"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const TON_STATUT = {
  Nouvelle: "bg-sky/15 text-sky",
  Contacté: "bg-[#f0c766]/15 text-[#f0c766]",
  "Devis envoyé": "bg-[#f0c766]/15 text-[#f0c766]",
  "Acompte reçu": "bg-palm/15 text-palm",
  Confirmé: "bg-palm/15 text-palm",
  Annulé: "bg-danger/15 text-danger",
};

const MESSAGES = {
  code: "Code incorrect. Vérifiez les 6 chiffres reçus par e-mail.",
  expire: "Ce code a expiré. Demandez-en un nouveau.",
  essais: "Trop d’essais. Demandez un nouveau code.",
  feuille: "La feuille Google ne répond pas. Réessayez dans un instant.",
  "non-configure": "L’administration n’est pas encore configurée sur le serveur (ADMIN_EMAILS, ADMIN_SECRET).",
  introuvable: "Cette demande n’existe plus dans la feuille. Actualisez la page.",
};

async function appel(action, donnees = {}) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, ...donnees }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.erreur || "feuille"), { code: json.erreur || "feuille", status: res.status });
  return json;
}

/* ---------- Dates (les dates de la feuille sont à minuit UTC, heure de Conakry) ---------- */

const jour = (iso) => (iso ? new Date(iso.slice(0, 10) + "T00:00:00Z") : null);
const aujourdhui = () => jour(new Date().toISOString());
const debutDuMois = (decalage = 0) => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalage, 1)); };
const fmtJour = (iso, opts = { day: "2-digit", month: "2-digit", year: "numeric" }) => (iso ? jour(iso).toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts }) : "");
const fmtRecue = (iso) => (iso ? new Date(iso).toLocaleString("fr-FR", { timeZone: "Africa/Conakry", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
const gnf = (n) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} GNF`;
const chiffresTel = (t) => String(t || "").replace(/\D/g, "");

/* ---------- Petits éléments ---------- */

function Pastille({ statut }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${TON_STATUT[statut] || "bg-line text-sand-soft"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{statut || "Sans statut"}
    </span>
  );
}

const Carte = ({ className = "", children }) => <div className={`min-w-0 rounded-xl border border-line bg-card p-5 ${className}`}>{children}</div>;
const Titre = ({ children }) => <h2 className="mb-4 text-[15px] font-bold tracking-[-0.005em]">{children}</h2>;
const btn = "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/* ---------- Connexion ---------- */

function Connexion({ onConnecte, erreurInitiale }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [etape, setEtape] = useState("email");
  const [etat, setEtat] = useState({ attente: false, erreur: erreurInitiale || "" });

  const envoyer = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEtat({ attente: false, erreur: "Adresse e-mail incomplète." });
    setEtat({ attente: true, erreur: "" });
    try {
      await appel("envoyer-code", { email });
      setEtape("code");
      setEtat({ attente: false, erreur: "" });
    } catch (err) {
      setEtat({ attente: false, erreur: MESSAGES[err.code] || MESSAGES.feuille });
    }
  };

  const verifier = async (e) => {
    e.preventDefault();
    setEtat({ attente: true, erreur: "" });
    try {
      const r = await appel("verifier-code", { email, code });
      onConnecte(r.email);
    } catch (err) {
      if (err.code === "expire" || err.code === "essais") setEtape("email");
      setEtat({ attente: false, erreur: MESSAGES[err.code] || MESSAGES.code });
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Carte className="grid w-full max-w-[420px] gap-5 p-7">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-gold">Camayenne Plage</p>
          <h1 className="mt-1 text-[24px] leading-tight font-extrabold">Administration</h1>
        </div>
        {etape === "email" ? (
          <form onSubmit={envoyer} className="grid gap-4" noValidate>
            <label className="grid gap-2">
              <span className={labelCls}>Votre adresse e-mail</span>
              <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="prenom@exemple.com" autoFocus />
            </label>
            <button type="submit" disabled={etat.attente} className={`${btn} border-transparent bg-gold py-3 text-night hover:bg-gold-deep`}>
              {etat.attente ? "Envoi…" : "Recevoir un code"}<Icon name="mail" className="h-4 w-4" />
            </button>
            <p className="text-[13px] text-sand-soft">Seules les adresses de l’équipe reçoivent un code.</p>
          </form>
        ) : (
          <form onSubmit={verifier} className="grid gap-4" noValidate>
            <p className="text-[14px] text-sand-soft">Si <b className="text-sand">{email}</b> fait partie de l’équipe, un code à 6 chiffres vient d’y être envoyé. Il est valable 10 minutes.</p>
            <label className="grid gap-2">
              <span className={labelCls}>Code reçu</span>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${inputCls} text-center text-[22px] tracking-[0.4em]`} placeholder="••••••" autoFocus />
            </label>
            <button type="submit" disabled={etat.attente || code.length !== 6} className={`${btn} border-transparent bg-gold py-3 text-night hover:bg-gold-deep`}>
              {etat.attente ? "Vérification…" : "Se connecter"}<Icon name="arrow" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => { setEtape("email"); setCode(""); setEtat({ attente: false, erreur: "" }); }} className="cursor-pointer text-[13px] text-sand-soft underline hover:text-sand">Changer d’adresse ou renvoyer un code</button>
          </form>
        )}
        {etat.erreur && <p role="alert" className="rounded-lg border border-danger/60 bg-danger/10 px-3.5 py-2.5 text-[13.5px] text-danger">{etat.erreur}</p>}
      </Carte>
    </div>
  );
}

/* ---------- Tableau de bord ---------- */

function Indicateur({ valeur, libelle, argent }) {
  return (
    <Carte className="grid content-start gap-1.5">
      <span className={`leading-none font-extrabold tracking-[-0.02em] tabular-nums ${argent ? "text-[24px] text-palm" : "text-[32px]"}`}>{valeur}</span>
      <span className="text-[13px] text-sand-soft">{libelle}</span>
    </Carte>
  );
}

function GraphiqueMois({ mois }) {
  const max = Math.max(4, ...mois.map((m) => m.n));
  const pas = Math.ceil(max / 4);
  const haut = pas * 4;
  const H = 160, X0 = 34, L = 470;
  const larg = L / mois.length;
  return (
    <svg viewBox={`0 0 ${X0 + L + 6} 210`} className="h-auto w-full" role="img" aria-label={`Demandes par mois : ${mois.map((m) => `${m.libelle} ${m.n}`).join(", ")}`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 20 + H - (H * i) / 4;
        return (
          <g key={i}>
            <line x1={X0} x2={X0 + L} y1={y} y2={y} className="stroke-line" />
            <text x={X0 - 8} y={y + 4} textAnchor="end" className="fill-sand-soft text-[11px]">{pas * i}</text>
          </g>
        );
      })}
      {mois.map((m, i) => {
        const h = (H * m.n) / haut;
        const x = X0 + i * larg + larg * 0.17;
        const w = larg * 0.66;
        return (
          <g key={m.libelle}>
            <rect x={x} y={20 + H - h} width={w} height={Math.max(h, 0)} rx="3" className={m.enCours ? "fill-palm/55" : "fill-palm"} />
            <text x={x + w / 2} y={20 + H - h - 6} textAnchor="middle" className="fill-sand text-[12px] font-bold">{m.n}</text>
            <text x={x + w / 2} y={20 + H + 20} textAnchor="middle" className="fill-sand-soft text-[11px]">{m.libelle}{m.enCours ? " (en cours)" : ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

function VueTableau({ demandes, paiements }) {
  const calc = useMemo(() => {
    const debut = debutDuMois();
    const recueCeMois = (d) => new Date(d.recue) >= debut;
    const mois = [5, 4, 3, 2, 1, 0].map((k) => {
      const a = debutDuMois(-k), b = debutDuMois(-k + 1);
      return { libelle: MOIS[a.getUTCMonth()], enCours: k === 0, n: demandes.filter((d) => new Date(d.recue) >= a && new Date(d.recue) < b).length };
    });
    const depuis6 = debutDuMois(-5);
    const types = Object.entries(demandes.filter((d) => new Date(d.recue) >= depuis6 && d.type).reduce((acc, d) => ({ ...acc, [d.type]: (acc[d.type] || 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 6);
    const auj = aujourdhui();
    const dans30 = new Date(auj.getTime() + 30 * 864e5);
    const prochains = demandes.filter((d) => d.date && jour(d.date) >= auj && jour(d.date) <= dans30 && d.statut !== "Annulé")
      .sort((a, b) => jour(a.date) - jour(b.date));
    return {
      recues: demandes.filter(recueCeMois).length,
      attente: demandes.filter((d) => d.statut === "Nouvelle" || d.statut === "Contacté").length,
      devis: demandes.filter((d) => d.statut === "Devis envoyé").length,
      confirmes: demandes.filter((d) => d.statut === "Confirmé" || d.statut === "Acompte reçu").length,
      acomptes: paiements.filter((p) => p.date && new Date(p.date) >= debut).reduce((s, p) => s + p.montant, 0),
      mois, types, prochains,
    };
  }, [demandes, paiements]);

  const auj = new Date();
  const maxType = Math.max(1, ...calc.types.map((t) => t[1]));
  return (
    <div className="grid gap-5">
      <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-sand-soft">{MOIS_LONGS[auj.getMonth()]} {auj.getFullYear()} · au {auj.getDate()} {MOIS_LONGS[auj.getMonth()]}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Indicateur valeur={calc.recues} libelle="Demandes reçues ce mois" />
        <Indicateur valeur={calc.attente} libelle="En attente de réponse" />
        <Indicateur valeur={calc.devis} libelle="Devis envoyés, sans réponse" />
        <Indicateur valeur={calc.confirmes} libelle="Événements confirmés ou avec acompte" />
        <Indicateur valeur={gnf(calc.acomptes)} libelle="Acomptes encaissés ce mois" argent />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Carte>
          <Titre>Demandes par mois</Titre>
          <GraphiqueMois mois={calc.mois} />
          <h2 className="mt-6 mb-3 text-[15px] font-bold">Par type d’événement, sur 6 mois</h2>
          {calc.types.length ? (
            <div className="grid gap-2.5">
              {calc.types.map(([type, n]) => (
                <div key={type} className="grid grid-cols-[minmax(0,150px)_1fr_28px] items-center gap-3 text-[13.5px]">
                  <span className="truncate">{type}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full bg-palm" style={{ width: `${(100 * n) / maxType}%` }} /></span>
                  <span className="text-right font-bold tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[13.5px] text-sand-soft">Aucune demande sur les 6 derniers mois.</p>}
        </Carte>
        <Carte>
          <Titre>Prochains événements · 30 jours</Titre>
          {calc.prochains.length ? (
            <ul className="grid">
              {calc.prochains.map((d) => (
                <li key={d.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
                  <span className="leading-[1.05] font-extrabold tabular-nums">{fmtJour(d.date, { day: "2-digit" })}<small className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-sand-soft">{fmtJour(d.date, { month: "short" })}</small></span>
                  <span className="min-w-0">
                    <b className="block truncate font-bold">{d.nom} · {d.type}</b>
                    <span className="block truncate text-[12.5px] text-sand-soft">{[d.espaces, d.nb && `${d.nb} pers.`, d.duree].filter(Boolean).join(" · ")}</span>
                  </span>
                  <Pastille statut={d.statut} />
                </li>
              ))}
            </ul>
          ) : <p className="text-[13.5px] text-sand-soft">Aucun événement prévu dans les 30 prochains jours.</p>}
        </Carte>
      </div>
    </div>
  );
}

/* ---------- Demandes ---------- */

function CarteDemande({ d, onEnregistre }) {
  const [f, setF] = useState({ statut: d.statut, devis: d.devis === "" ? "" : String(d.devis), notes: d.notes || "" });
  const [etat, setEtat] = useState({ attente: false, message: "", erreur: "" });
  useEffect(() => { setF({ statut: d.statut, devis: d.devis === "" ? "" : String(d.devis), notes: d.notes || "" }); }, [d]);

  const modifie = f.statut !== d.statut || f.devis !== (d.devis === "" ? "" : String(d.devis)) || f.notes !== (d.notes || "");
  const envoiConfirmation = f.statut === "Confirmé" && d.statut !== "Confirmé" && !/Confirmation envoyée/.test(d.confirmation);

  const enregistrer = async () => {
    setEtat({ attente: true, message: "", erreur: "" });
    try {
      const r = await appel("modifier", { id: d.id, statut: f.statut, devis: f.devis.replace(/\D/g, ""), notes: f.notes });
      onEnregistre(r.demande);
      setEtat({ attente: false, erreur: "", message: r.emailEnvoye ? `Enregistré. E-mail de confirmation envoyé à ${d.email}.` : "Enregistré." });
    } catch (err) {
      setEtat({ attente: false, message: "", erreur: MESSAGES[err.code] || MESSAGES.feuille });
    }
  };

  const tel = chiffresTel(d.tel);
  const champ = "rounded-lg border border-line bg-night px-3 py-2 text-[14px] text-sand focus:border-gold focus:outline-none";
  return (
    <Carte className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] leading-tight font-bold">{d.nom}{d.org ? <span className="font-medium text-sand-soft"> · {d.org}</span> : null}</h3>
          <p className="mt-1 text-[12.5px] text-sand-soft">Reçue le {fmtRecue(d.recue)}</p>
        </div>
        <Pastille statut={d.statut} />
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-[13.5px] md:grid-cols-4">
        {[["Événement", d.type], ["Date souhaitée", fmtJour(d.date)], ["Participants", d.nb], ["Durée", d.duree], ["Espaces", d.espaces], ["Services", d.services]]
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-sand-soft">{k}</dt><dd className="break-words">{v}</dd></div>)}
      </dl>
      {d.message ? <p className="rounded-lg bg-night/60 px-3.5 py-2.5 text-[13.5px] whitespace-pre-wrap text-sand-soft">{d.message}</p> : null}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]">
        {d.tel ? <a href={`tel:+${tel}`} className="inline-flex items-center gap-1.5 text-sand no-underline hover:text-gold"><Icon name="phone" className="h-4 w-4" />{d.tel}</a> : null}
        {tel ? <a href={`https://wa.me/${tel}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sand no-underline hover:text-gold"><Icon name="whatsapp" className="h-4 w-4" />WhatsApp</a> : null}
        {d.email ? <a href={`mailto:${d.email}`} className="inline-flex items-center gap-1.5 break-all text-sand no-underline hover:text-gold"><Icon name="mail" className="h-4 w-4" />{d.email}</a> : null}
      </div>
      <div className="grid gap-3 border-t border-line pt-4 md:grid-cols-[180px_160px_1fr_auto] md:items-end">
        <label className="grid gap-1.5"><span className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-sand-soft">Statut</span>
          <select value={f.statut} onChange={(e) => setF((s) => ({ ...s, statut: e.target.value }))} className={champ}>{STATUTS.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label className="grid gap-1.5"><span className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-sand-soft">Devis (GNF)</span>
          <input inputMode="numeric" value={f.devis ? Number(f.devis.replace(/\D/g, "")).toLocaleString("fr-FR") : ""} onChange={(e) => setF((s) => ({ ...s, devis: e.target.value.replace(/\D/g, "") }))} className={`${champ} tabular-nums`} placeholder="Montant" />
        </label>
        <label className="grid gap-1.5"><span className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-sand-soft">Notes</span>
          <input value={f.notes} maxLength={500} onChange={(e) => setF((s) => ({ ...s, notes: e.target.value }))} className={champ} placeholder="Relancer jeudi, visite le 12…" />
        </label>
        <button type="button" onClick={enregistrer} disabled={!modifie || etat.attente} className={`${btn} border-transparent bg-gold text-night hover:bg-gold-deep`}>
          {etat.attente ? "Enregistrement…" : envoiConfirmation ? "Enregistrer et envoyer la confirmation" : "Enregistrer"}
        </button>
      </div>
      {envoiConfirmation && modifie ? <p className="text-[13px] text-[#f0c766]">Le client recevra un e-mail de confirmation à {d.email || "(adresse manquante)"}.</p> : null}
      {d.confirmation ? <p className="text-[12.5px] text-palm">{d.confirmation}</p> : null}
      {etat.message ? <p role="status" className="text-[13px] text-palm">{etat.message}</p> : null}
      {etat.erreur ? <p role="alert" className="text-[13px] text-danger">{etat.erreur}</p> : null}
    </Carte>
  );
}

function VueDemandes({ demandes, onEnregistre }) {
  const [filtre, setFiltre] = useState("Toutes");
  const [recherche, setRecherche] = useState("");
  const q = recherche.trim().toLowerCase();
  const liste = demandes
    .filter((d) => filtre === "Toutes" || (filtre === "À traiter" ? d.statut === "Nouvelle" || d.statut === "Contacté" : d.statut === filtre))
    .filter((d) => !q || [d.nom, d.org, d.email, d.tel, d.type].some((v) => String(v || "").toLowerCase().includes(q)));
  const nb = (s) => (s === "Toutes" ? demandes.length : s === "À traiter" ? demandes.filter((d) => d.statut === "Nouvelle" || d.statut === "Contacté").length : demandes.filter((d) => d.statut === s).length);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {["Toutes", "À traiter", ...STATUTS].map((s) => (
          <button key={s} type="button" onClick={() => setFiltre(s)} aria-pressed={filtre === s} className={`cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${filtre === s ? "border-gold bg-gold/10 text-gold" : "border-line text-sand-soft hover:text-sand"}`}>
            {s} <span className="tabular-nums opacity-70">{nb(s)}</span>
          </button>
        ))}
        <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un nom, un téléphone…" className="ml-auto w-full rounded-lg border border-line bg-night px-3 py-2 text-[14px] text-sand focus:border-gold focus:outline-none md:w-[280px]" />
      </div>
      {liste.length ? liste.map((d) => <CarteDemande key={d.id} d={d} onEnregistre={onEnregistre} />) : <Carte><p className="text-sand-soft">Aucune demande ne correspond.</p></Carte>}
    </div>
  );
}

/* ---------- Paiements ---------- */

function VuePaiements({ paiements }) {
  const debut = debutDuMois();
  const duMois = paiements.filter((p) => p.date && new Date(p.date) >= debut);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:max-w-[520px]">
        <Indicateur valeur={gnf(duMois.reduce((s, p) => s + p.montant, 0))} libelle={`Encaissé en ${MOIS_LONGS[new Date().getMonth()]}`} argent />
        <Indicateur valeur={duMois.length} libelle="Acomptes ce mois" />
      </div>
      <Carte className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] border-collapse text-[13.5px] tabular-nums">
          <thead><tr className="text-left text-[11.5px] tracking-[0.08em] uppercase text-sand-soft">{["Date", "Client", "Référence", "Montant", "Moyen", "Statut", "Pointé"].map((h) => <th key={h} className="border-b border-line px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {paiements.length ? paiements.map((p, i) => (
              <tr key={i} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 whitespace-nowrap">{fmtJour(p.date)}</td>
                <td className="px-4 py-3">{p.client}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.reference}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{gnf(p.montant)}</td>
                <td className="px-4 py-3">{p.moyen}</td>
                <td className="px-4 py-3">{p.statut}</td>
                <td className="px-4 py-3">{p.pointe ? <Icon name="check" className="h-4 w-4 text-palm" /> : <span className="text-sand-soft">—</span>}</td>
              </tr>
            )) : <tr><td colSpan={7} className="px-4 py-5 text-sand-soft">Aucun paiement enregistré.</td></tr>}
          </tbody>
        </table>
      </Carte>
      <p className="text-[13px] text-sand-soft">Les paiements se saisissent dans l’onglet Paiements de la feuille Google ; ils apparaissent ici à l’actualisation.</p>
    </div>
  );
}

/* ---------- Page ---------- */

const ONGLETS = [["tableau", "Tableau de bord"], ["demandes", "Demandes"], ["paiements", "Paiements"]];

export default function Admin() {
  useTitle("Administration · Camayenne Plage");
  const [etat, setEtat] = useState("chargement");
  const [email, setEmail] = useState("");
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState("tableau");
  const [maj, setMaj] = useState(null);

  // Page privée : jamais indexée par les moteurs de recherche.
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  const charger = useCallback(async () => {
    setErreur("");
    try {
      const r = await appel("donnees");
      setDonnees({ demandes: [...r.demandes].sort((a, b) => new Date(b.recue) - new Date(a.recue)), paiements: r.paiements });
      setEmail(r.email);
      setMaj(new Date());
      setEtat("pret");
    } catch (err) {
      if (err.status === 401) setEtat("connexion");
      else if (err.code === "non-configure") setEtat("non-configure");
      else { setErreur(MESSAGES[err.code] || MESSAGES.feuille); setEtat((e) => (e === "chargement" ? "erreur" : e)); }
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);
  // Actualisation quand on revient sur l'onglet du navigateur
  useEffect(() => {
    const f = () => { if (document.visibilityState === "visible" && etat === "pret") charger(); };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [charger, etat]);

  const deconnexion = async () => { await appel("deconnexion").catch(() => {}); setDonnees(null); setEtat("connexion"); };
  const remplacer = (d) => setDonnees((s) => ({ ...s, demandes: s.demandes.map((x) => (x.id === d.id ? d : x)) }));

  if (etat === "chargement") return <p className="grid min-h-screen place-items-center text-sand-soft">Chargement…</p>;
  if (etat === "connexion") return <Connexion onConnecte={() => { setEtat("chargement"); charger(); }} />;
  if (etat === "non-configure" || etat === "erreur") {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Carte className="grid max-w-[460px] gap-4">
          <h1 className="text-[20px] font-bold">Administration indisponible</h1>
          <p className="text-sand-soft">{etat === "non-configure" ? MESSAGES["non-configure"] : erreur}</p>
          <div className="flex gap-3"><button type="button" onClick={() => { setEtat("chargement"); charger(); }} className={`${btn} border-line text-sand`}>Réessayer</button><Link to="/" className={`${btn} border-line text-sand no-underline`}>Retour au site</Link></div>
        </Carte>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-night/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[15px] leading-tight font-extrabold">Camayenne Plage <span className="font-semibold text-sand-soft">· Administration</span></p>
            <p className="text-[12px] text-sand-soft">{email}{maj ? ` · à jour à ${maj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={charger} className={`${btn} border-line text-sand hover:border-sand/50`}>Actualiser</button>
            <button type="button" onClick={deconnexion} className={`${btn} border-line text-sand-soft hover:text-sand`}>Se déconnecter</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-4" role="tablist" aria-label="Sections">
          {ONGLETS.map(([id, libelle]) => (
            <button key={id} type="button" role="tab" aria-selected={onglet === id} onClick={() => setOnglet(id)} className={`cursor-pointer border-b-2 px-3.5 py-2.5 text-[14px] font-semibold whitespace-nowrap transition-colors ${onglet === id ? "border-gold text-gold" : "border-transparent text-sand-soft hover:text-sand"}`}>
              {libelle}{id === "demandes" ? <span className="ml-1.5 tabular-nums opacity-70">{donnees.demandes.filter((d) => d.statut === "Nouvelle").length || ""}</span> : null}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-6">
        {erreur ? <p role="alert" className="mb-4 rounded-lg border border-danger/60 bg-danger/10 px-3.5 py-2.5 text-[13.5px] text-danger">{erreur}</p> : null}
        {onglet === "tableau" && <VueTableau demandes={donnees.demandes} paiements={donnees.paiements} />}
        {onglet === "demandes" && <VueDemandes demandes={donnees.demandes} onEnregistre={remplacer} />}
        {onglet === "paiements" && <VuePaiements paiements={donnees.paiements} />}
      </main>
    </div>
  );
}
