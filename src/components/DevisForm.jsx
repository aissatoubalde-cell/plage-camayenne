import { useMemo, useState } from "react";
import { site } from "../config";
import { durations, eventTypes, serviceOptions, spaceOptions } from "../data/content";
import CopyButton from "./CopyButton";
import { Button, Field, Status, inputCls, labelCls } from "./ui";

const fmtDate = (d) => { if (!d) return ""; const [y, m, j] = d.split("-"); return `${j}/${m}/${y}`; };
const checkCls = "inline-flex cursor-pointer items-center gap-2 rounded-[2px] border border-line bg-night px-3 py-[9px] text-sm font-medium has-checked:border-gold has-checked:text-gold";

function Checks({ legend, options, value, onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className="grid gap-[9px] border-0 p-0">
      <legend className={`${labelCls} mb-[9px]`}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className={checkCls}>
            <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} className="accent-gold" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function DevisForm() {
  const hasKey = Boolean(site.web3formsKey);
  const [f, setF] = useState({ nom: "", org: "", email: "", tel: "", type: eventTypes[0], date: "", nb: "", duree: durations[0], espaces: [], services: [], msg: "" });
  const [status, setStatus] = useState({ kind: "idle" });
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
    if (!hasKey) { window.location.href = mailto; return; }
    if (e.currentTarget.elements.botcheck.checked) return;
    if (!f.nom.trim() || !f.email.trim()) { setStatus({ kind: "err", text: "Indiquez votre nom et votre e-mail pour que nous puissions vous répondre." }); return; }
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
      setStatus({ kind: "err", text: "L’envoi a échoué. Utilisez le bouton « Envoyer par e-mail » ou appelez-nous." });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-[18px] border border-line bg-card p-[clamp(22px,3vw,34px)]">
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field id="q-nom" label="Nom et prénom"><input id="q-nom" autoComplete="name" placeholder="Ex. Aïssatou Diallo" value={f.nom} onChange={set("nom")} className={inputCls} /></Field>
        <Field id="q-org" label="Entreprise"><input id="q-org" autoComplete="organization" placeholder="Facultatif" value={f.org} onChange={set("org")} className={inputCls} /></Field>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field id="q-email" label="E-mail"><input id="q-email" type="email" autoComplete="email" placeholder="Pour recevoir le devis" value={f.email} onChange={set("email")} className={inputCls} /></Field>
        <Field id="q-tel" label="Téléphone"><input id="q-tel" type="tel" autoComplete="tel" placeholder="Ex. +224 6xx xxx xxx" value={f.tel} onChange={set("tel")} className={inputCls} /></Field>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field id="q-type" label="Type d’événement"><select id="q-type" value={f.type} onChange={set("type")} className={inputCls}>{eventTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field id="q-date" label="Date souhaitée"><input id="q-date" type="date" value={f.date} onChange={set("date")} className={inputCls} /></Field>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field id="q-nb" label="Participants"><input id="q-nb" type="number" min={1} inputMode="numeric" placeholder="Ex. 50" value={f.nb} onChange={set("nb")} className={inputCls} /></Field>
        <Field id="q-duree" label="Durée"><select id="q-duree" value={f.duree} onChange={set("duree")} className={inputCls}>{durations.map((d) => <option key={d}>{d}</option>)}</select></Field>
      </div>
      <Checks legend="Espaces souhaités" options={spaceOptions} value={f.espaces} onChange={(v) => setF((s) => ({ ...s, espaces: v }))} />
      <Checks legend="Services souhaités" options={serviceOptions} value={f.services} onChange={(v) => setF((s) => ({ ...s, services: v }))} />
      <Field id="q-msg" label="Votre message"><textarea id="q-msg" rows={3} placeholder="Précisez vos attentes, votre budget, vos horaires…" value={f.msg} onChange={set("msg")} className={inputCls} /></Field>
      <div className="grid gap-[7px]">
        <span className={labelCls}>Aperçu du message</span>
        <div aria-live="polite" className="max-h-[220px] overflow-auto border border-dashed border-sand/25 bg-night p-3.5 text-sm whitespace-pre-wrap text-sand-soft">{message}</div>
      </div>
      {/* Piège à robots Web3Forms, invisible pour les visiteurs */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" /></div>
      {(status.kind === "ok" || status.kind === "err") && <Status kind={status.kind}>{status.text}</Status>}
      <div className="flex flex-wrap gap-2.5">
        {hasKey && <Button type="submit" disabled={status.kind === "sending"} onClick={undefined}>{status.kind === "sending" ? "Envoi…" : "Envoyer la demande"}</Button>}
        <Button href={mailto} variant={hasKey ? "line" : "gold"}>Envoyer par e-mail</Button>
        <CopyButton text={message} label="Copier la demande" className="inline-flex cursor-pointer items-center justify-center rounded-[2px] border border-sand/40 px-6 py-[18px] text-[15px] leading-none font-semibold text-sand hover:border-sand" />
      </div>
      <p className="text-[13.5px] text-sand-soft">
        {hasKey ? `Votre demande part directement à notre équipe (${site.email}). Vous pouvez aussi l’envoyer depuis votre messagerie ou la copier.` : `Le bouton ouvre votre messagerie avec l’e-mail déjà rédigé, adressé à ${site.email}. Vous pouvez aussi copier la demande.`}
      </p>
    </form>
  );
}
