import { AnimatePresence, m } from "motion/react";
import { useMemo, useState } from "react";
import { site } from "../config";
import { durations, eventTypes, serviceOptions, spaceOptions } from "../data/content";
import CopyButton from "./CopyButton";
import { ease } from "./motion";
import { Icon } from "./ui/icons";

const fmtDate = (d) => { if (!d) return ""; const [y, mo, j] = d.split("-"); return `${j}/${mo}/${y}`; };
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const emailError = (v) => (v.trim() && !isEmail(v) ? "Adresse e-mail incomplète, ex. prenom@exemple.com" : "");
// Téléphone : chiffres, espaces, parenthèses, tirets et un « + » en tête seulement ; les lettres sont ignorées à la saisie.
const cleanTel = (v) => v.replace(/[^\d\s+().-]/g, "").replace(/(?!^)\+/g, "").slice(0, 20);

const field = "w-full rounded-xl border border-line bg-night px-4 py-3.5 text-base leading-snug font-medium text-sand placeholder:text-[#6F8783] transition-[border-color,box-shadow] focus:border-gold focus:ring-2 focus:ring-gold/25 focus:outline-none";
const label = "text-[11.5px] font-semibold tracking-[0.14em] uppercase text-sand-soft";
const chip = "inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-night px-4 py-2.5 text-sm font-medium text-sand-soft transition-colors select-none hover:border-sand/40 has-checked:border-gold has-checked:bg-gold/10 has-checked:text-gold";

function Field({ id, children, error, ...rest }) {
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className={label}>{rest.label}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}

function Select({ id, value, onChange, options }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={onChange} className={`${field} appearance-none pr-11`}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-sand-soft" />
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <fieldset className="grid gap-4 border-0 p-0">
      <legend className="mb-4 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-[12px] font-bold text-night tabular-nums">{n}</span>
        <span className="text-[17px] font-bold tracking-[-0.01em]">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Chips({ options, value, onChange, name }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <label key={o.value} className={chip}>
            <input type="checkbox" name={name} className="sr-only" checked={on} onChange={() => toggle(o.value)} />
            <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? "border-gold bg-gold text-night" : "border-sand-soft/50"}`}>{on && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}</span>
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

export default function DevisForm() {
  const hasKey = Boolean(site.web3formsKey);
  const [f, setF] = useState({ nom: "", org: "", email: "", tel: "", type: eventTypes[0], date: "", nb: "", duree: durations[1], espaces: [], services: [], msg: "" });
  const [status, setStatus] = useState({ kind: "idle" });
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const message = useMemo(() => {
    const L = ["Bonjour Camayenne Plage,", "", "Je souhaite un devis pour un événement :", `• Type : ${f.type}`];
    if (f.date) L.push(`• Date souhaitée : ${fmtDate(f.date)}`);
    if (f.nb.trim()) L.push(`• Participants : ${f.nb.trim()}`);
    L.push(`• Durée : ${f.duree}`);
    if (f.espaces.length) L.push(`• Espaces : ${f.espaces.join(", ")}`);
    if (f.services.length) L.push(`• Services : ${f.services.join(", ")}`);
    if (f.msg.trim()) L.push("", `Message : ${f.msg.trim()}`);
    L.push("", f.nom.trim() ? `${f.nom.trim()}${f.org.trim() ? ` (${f.org.trim()})` : ""}` : "(nom à compléter)");
    if (f.tel.trim()) L.push(`Tél. : ${f.tel.trim()}`);
    if (f.email.trim()) L.push(`E-mail : ${f.email.trim()}`);
    return L.join("\n");
  }, [f]);

  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(`Demande de devis – ${f.type}`)}&body=${encodeURIComponent(message)}`;

  const submit = async (e) => {
    e.preventDefault();
    const next = { email: emailError(f.email) };
    if (hasKey) {
      if (!f.nom.trim()) next.nom = "Indiquez votre nom pour que nous puissions vous répondre.";
      if (!f.email.trim()) next.email = "Indiquez votre e-mail pour recevoir le devis.";
    }
    setErrors(next);
    const firstBad = ["nom", "email"].find((k) => next[k]);
    if (firstBad) { document.getElementById(`q-${firstBad}`)?.focus(); return; }
    if (!hasKey) { window.location.href = mailto; return; }
    if (e.currentTarget.elements.botcheck.checked) return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: site.web3formsKey, subject: `Demande de devis – ${f.type}`, from_name: "Site Camayenne Plage", name: f.nom.trim(), email: f.email.trim(), phone: f.tel.trim(), organisation: f.org.trim(), message }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Envoi impossible");
      setStatus({ kind: "ok", text: "Demande envoyée. Notre équipe vous répond rapidement." });
    } catch {
      setStatus({ kind: "err", text: "L’envoi a échoué. Utilisez « Envoyer depuis ma messagerie » ou appelez-nous." });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative grid gap-8 overflow-hidden rounded-2xl bg-card p-5 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] md:p-8">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold/0 via-gold to-gold/0" />

      <Step n="1" title="Vos coordonnées">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="q-nom" label="Nom et prénom" error={errors.nom}><input id="q-nom" autoComplete="name" placeholder="Ex. Aïssatou Diallo" value={f.nom} onChange={(e) => { set("nom")(e); if (errors.nom && e.target.value.trim()) setErrors((er) => ({ ...er, nom: "" })); }} aria-invalid={Boolean(errors.nom)} aria-describedby={errors.nom ? "q-nom-err" : undefined} className={`${field} ${errors.nom ? "border-danger" : ""}`} /></Field>
          <Field id="q-org" label="Entreprise ou organisation"><input id="q-org" autoComplete="organization" placeholder="Facultatif" value={f.org} onChange={set("org")} className={field} /></Field>
          <Field id="q-email" label="E-mail" error={errors.email}><input id="q-email" type="email" inputMode="email" autoComplete="email" placeholder="Pour recevoir le devis" value={f.email} onChange={(e) => { const v = e.target.value; setF((s) => ({ ...s, email: v })); if (errors.email) setErrors((er) => ({ ...er, email: emailError(v) })); }} onBlur={() => setErrors((er) => ({ ...er, email: emailError(f.email) }))} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "q-email-err" : undefined} className={`${field} ${errors.email ? "border-danger" : ""}`} /></Field>
          <Field id="q-tel" label="Téléphone"><input id="q-tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="+224 6xx xxx xxx" maxLength={20} value={f.tel} onChange={(e) => setF((s) => ({ ...s, tel: cleanTel(e.target.value) }))} className={field} /></Field>
        </div>
      </Step>

      <Step n="2" title="Votre événement">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="q-type" label="Type d’événement"><Select id="q-type" value={f.type} onChange={set("type")} options={eventTypes} /></Field>
          <Field id="q-date" label="Date souhaitée">
            <div className="relative">
              <input id="q-date" type="date" value={f.date} onChange={set("date")} className={`${field} relative pr-11 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} />
              <Icon name="calendar" className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-sand-soft" />
            </div>
          </Field>
          <Field id="q-nb" label="Nombre de participants"><input id="q-nb" type="number" min={1} inputMode="numeric" placeholder="Ex. 50" value={f.nb} onChange={set("nb")} className={field} /></Field>
          <div className="grid min-w-0 gap-2">
            <span className={label}>Durée</span>
            <div role="radiogroup" aria-label="Durée" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-night p-1 sm:grid-cols-4">
              {durations.map((d) => (
                <label key={d} className="cursor-pointer rounded-lg px-2 py-2.5 text-center text-[13.5px] font-medium text-sand-soft transition-colors has-checked:bg-gold has-checked:text-night">
                  <input type="radio" name="duree" value={d} checked={f.duree === d} onChange={set("duree")} className="sr-only" />{d}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Step>

      <Step n="3" title="Espaces et services">
        <div className="grid gap-5">
          <div className="grid gap-2.5"><span className={label}>Espaces souhaités</span><Chips name="espaces" options={spaceOptions} value={f.espaces} onChange={(v) => setF((s) => ({ ...s, espaces: v }))} /></div>
          <div className="grid gap-2.5"><span className={label}>Services souhaités</span><Chips name="services" options={serviceOptions} value={f.services} onChange={(v) => setF((s) => ({ ...s, services: v }))} /></div>
        </div>
      </Step>

      <Step n="4" title="Votre message">
        <Field id="q-msg" label="Précisions"><textarea id="q-msg" rows={4} placeholder="Vos attentes, votre budget, vos horaires…" value={f.msg} onChange={set("msg")} className={`${field} resize-y`} /></Field>
        <button type="button" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview} className="inline-flex w-fit cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-sand-soft hover:text-sand">
          <Icon name="chevron" className={`h-4 w-4 transition-transform ${showPreview ? "rotate-180" : ""}`} />{showPreview ? "Masquer l’aperçu de la demande" : "Voir l’aperçu de la demande"}
        </button>
        <AnimatePresence initial={false}>
          {showPreview && (
            <m.div key="preview" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
              <pre aria-live="polite" className="max-h-[240px] overflow-auto rounded-xl border border-dashed border-sand/25 bg-night p-4 font-sans text-sm whitespace-pre-wrap text-sand-soft">{message}</pre>
            </m.div>
          )}
        </AnimatePresence>
      </Step>

      {/* Piège à robots Web3Forms, invisible pour les visiteurs */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" /></div>

      {(status.kind === "ok" || status.kind === "err") && (
        <p role={status.kind === "err" ? "alert" : "status"} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${status.kind === "ok" ? "border-palm/60 bg-palm/10 text-palm" : "border-danger/60 bg-danger/10 text-danger"}`}>
          <Icon name={status.kind === "ok" ? "check" : "arrow"} className="h-4 w-4" />{status.text}
        </p>
      )}

      <div className="grid gap-3.5">
        {/* Un seul bouton d’envoi dans les deux modes : la vérification des champs se fait avant d’envoyer ou d’ouvrir la messagerie. */}
        <button type="submit" disabled={status.kind === "sending"} className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gold px-6 py-[18px] text-[15px] leading-none font-semibold text-night transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-55">
          {status.kind === "sending" ? "Envoi…" : hasKey ? "Envoyer ma demande" : "Envoyer ma demande par e-mail"}<Icon name="send" className="h-4 w-4" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13.5px] text-sand-soft">
          {hasKey && <a href={mailto} className="inline-flex items-center gap-1.5 no-underline hover:text-sand"><Icon name="mail" className="h-4 w-4" />Envoyer depuis ma messagerie</a>}
          <CopyButton text={message} label="Copier la demande" className="inline-flex cursor-pointer items-center gap-1.5 hover:text-sand" />
          <a href={`tel:${site.phoneE164}`} className="inline-flex items-center gap-1.5 no-underline hover:text-sand"><Icon name="phone" className="h-4 w-4" />{site.phone}</a>
        </div>
        <p className="text-center text-[12.5px] text-sand-soft/80">
          {hasKey ? `Votre demande part directement à notre équipe (${site.email}).` : `Le bouton ouvre votre messagerie avec l’e-mail déjà rédigé, adressé à ${site.email}.`} Réponse sous 48 h ouvrées.
        </p>
      </div>
    </form>
  );
}
