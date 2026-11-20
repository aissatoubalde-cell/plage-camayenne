import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { site, whatsappLink } from "../config";
import { Button, Field, Status, Wrap, inputCls, labelCls } from "../components/ui";
import CopyButton from "../components/CopyButton";
import { useTitle } from "../hooks";
import { Eyebrow as AnimatedEyebrow, SplitWords } from "../components/text";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const MIN_GNF = 50000;
const methodCls = "grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-[2px] border border-line bg-night p-3.5 has-checked:border-gold has-disabled:cursor-not-allowed has-disabled:opacity-50";

const steps = [
  ["Devis validé", "Vous avez reçu votre devis et confirmé la réservation avec notre équipe."],
  ["Acompte", "Vous réglez le montant indiqué sur le devis, par Mobile Money, depuis votre téléphone."],
  ["Confirmation", "Notre équipe vérifie le paiement et vous confirme la réservation."],
];


export default function Paiement() {
  useTitle("Payer un acompte · Camayenne Plage");
  const [params] = useSearchParams();
  const [conf, setConf] = useState(undefined); // undefined = chargement, {} = indisponible
  const [method, setMethod] = useState("om"); // sily = en ligne (Sily Link), om = Orange Money (CinetPay ou transfert manuel). La carte bancaire n'est plus proposée.
  const [f, setF] = useState({ name: "", email: "", phone: "", reference: "", amount: "", transaction: "" });
  const [state, setState] = useState({ kind: params.get("annule") ? "cancel" : "idle" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    fetch(`${site.paymentApi}/paiement-config`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setConf(c || {}))
      .catch(() => setConf({}));
  }, []);

  const amount = Number(f.amount);
  // Paiement en ligne Sily Link (Orange Money, MTN MoMo) : proposé en premier dès que les clés sont dans Vercel.
  const sily = Boolean(conf?.silylink);
  const choix = method === "sily" && !sily ? "om" : method;
  const enLigne = choix === "sily";
  // Sans clés CinetPay, Orange Money reste actif en mode manuel : transfert vers notre numéro puis confirmation WhatsApp.
  const manual = choix === "om" && conf && !conf.cinetpay;
  useEffect(() => {
    if (sily) setMethod((m) => (m === "om" ? "sily" : m));
  }, [sily]);

  const manualMsg = [
    "Bonjour, je règle l’acompte de ma réservation par Orange Money.",
    `• Nom : ${f.name}`,
    f.reference && `• Référence du devis : ${f.reference}`,
    `• Montant : ${fmt(amount)} GNF`,
    f.phone && `• Numéro Orange Money utilisé : ${f.phone}`,
    f.transaction && `• N° de transaction : ${f.transaction}`,
    `• E-mail : ${f.email}`,
    "Je joins la capture du SMS de confirmation.",
  ].filter(Boolean).join("\n");

  const submit = async (e) => {
    e.preventDefault();
    if (manual) {
      // Le paiement déclaré est enregistré pour l'équipe (page /admin, à vérifier) ; WhatsApp reste possible en plus.
      setState({ kind: "sending" });
      try {
        const res = await fetch("/api/paiement-declare", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...f, amount }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) return setState({ kind: "manual-ok" });
        if (json.erreur === "doublon") return setState({ kind: "err", text: "Ce numéro de transaction a déjà été déclaré. Si c’est une erreur, contactez-nous sur WhatsApp." });
        if (json.erreur === "transaction") return setState({ kind: "err", text: "Vérifiez le numéro de transaction : il figure dans le SMS de confirmation Orange Money." });
        throw new Error();
      } catch {
        // Enregistrement impossible : on garde l'ancien parcours, confirmation par WhatsApp.
        window.open(whatsappLink(manualMsg), "_blank", "noopener");
        return setState({ kind: "manual-sent" });
      }
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch(`${site.paymentApi}/${enLigne ? "paiement-silylink" : "paiement-cinetpay"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, amount, channel: "mobile" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Paiement indisponible pour le moment.");
      if (!json.url) throw new Error("Paiement indisponible pour le moment.");
      window.location.assign(json.url); // page de paiement Sily Link ou CinetPay, puis retour sur /confirmation
    } catch (err) {
      setState({ kind: "err", text: err.message });
    }
  };

  return (
    <main>
      <section className="py-section">
        <Wrap className="grid items-start gap-gutter md:grid-cols-[1fr_1.25fr]">
          <div className="min-w-0">
            <div className="mb-[clamp(36px,5vw,60px)] grid gap-[18px]">
              <AnimatedEyebrow inView={false}>Paiement en ligne</AnimatedEyebrow>
              <SplitWords as="h1" inView={false} delay={0.2} text="Payer *un acompte*." className="text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em]" />
              <p className="max-w-[58ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft">Votre devis est validé ? Réglez l’acompte en quelques minutes, par Mobile Money depuis votre téléphone, et votre date est bloquée.</p>
            </div>
            <ol className="border-t border-line">
              {steps.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[44px_1fr] gap-3 border-b border-line py-4 text-sand-soft">
                  <span className="font-bold text-gold tabular-nums">0{i + 1}</span>
                  <div><b className="mb-0.5 block text-sand">{t}</b>{d}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="min-w-0">
            {state.kind === "cancel" && <Status kind="err" className="mb-3.5">Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.</Status>}
            {conf === undefined && <p className="text-sand-soft">Chargement…</p>}
            {conf && (
              <form onSubmit={submit} className="grid gap-[18px] border border-line bg-card p-[clamp(22px,3vw,34px)]">
                <fieldset className="grid gap-[9px] border-0 p-0">
                  <legend className={`${labelCls} mb-[9px]`}>Moyen de paiement</legend>
                  <div className={`grid gap-2.5 ${sily ? "md:grid-cols-2" : ""}`}>
                    {sily && (
                      <label className={methodCls}>
                        <input type="radio" name="method" value="sily" checked={enLigne} onChange={() => setMethod("sily")} className="row-span-2 accent-gold" />
                        <b className="text-[15px]">Orange Money ou MTN · en ligne</b>
                        <small className="text-[13px] text-sand-soft">Paiement sécurisé via Sily Link, validé sur votre téléphone</small>
                      </label>
                    )}
                    <label className={methodCls}>
                      <input type="radio" name="method" value="om" checked={choix === "om"} onChange={() => setMethod("om")} className="row-span-2 accent-gold" />
                      <b className="text-[15px]">{sily ? "Transfert Orange Money" : "Orange Money"}</b>
                      <small className="text-[13px] text-sand-soft">{conf.cinetpay ? "Paiement sécurisé via CinetPay" : "Transfert, puis n° de transaction du SMS"}</small>
                    </label>
                  </div>
                </fieldset>

                {enLigne && (
                  <div className="grid gap-2 border border-gold/40 bg-night p-4 text-[14px] text-sand-soft">
                    <b className="text-sand">Comment payer en ligne</b>
                    <ol className="grid list-decimal gap-1 pl-5">
                      <li>Remplissez le formulaire ci-dessous avec le montant indiqué sur votre devis, puis cliquez sur « Payer ».</li>
                      <li>Sur la page sécurisée Sily Link, choisissez Orange Money ou MTN Mobile Money.</li>
                      <li>Validez le paiement sur votre téléphone avec votre code secret. Le paiement nous parvient directement et votre réservation est confirmée.</li>
                    </ol>
                  </div>
                )}

                <div className="grid gap-3.5 md:grid-cols-2">
                  <Field id="p-nom" label="Nom et prénom"><input id="p-nom" autoComplete="name" required minLength={2} value={f.name} onChange={set("name")} className={inputCls} /></Field>
                  <Field id="p-email" label="E-mail" hint="Votre reçu y est envoyé."><input id="p-email" type="email" autoComplete="email" required value={f.email} onChange={set("email")} className={inputCls} /></Field>
                </div>
                <div className="grid gap-3.5 md:grid-cols-2">
                  <Field id="p-tel" label="Téléphone"><input id="p-tel" type="tel" inputMode="tel" autoComplete="tel" required={manual || enLigne} placeholder={enLigne ? "Numéro Orange Money ou MTN" : "Numéro Orange Money"} value={f.phone} onChange={set("phone")} className={inputCls} /></Field>
                  <Field id="p-ref" label="Référence du devis"><input id="p-ref" placeholder="Indiquée sur votre devis" value={f.reference} onChange={set("reference")} className={inputCls} /></Field>
                </div>
                <Field id="p-montant" label="Montant de l’acompte (GNF)" hint={`Montant indiqué sur votre devis validé (minimum ${fmt(MIN_GNF)} GNF).`}>
                  <input id="p-montant" type="number" inputMode="numeric" required min={MIN_GNF} step={1} placeholder={`Ex. ${fmt(500000)}`} value={f.amount} onChange={set("amount")} className={`${inputCls} tabular-nums`} />
                </Field>

                {manual && (
                  <Field id="p-transaction" label="N° de transaction Orange Money" hint="Il figure dans le SMS de confirmation Orange Money reçu après l’envoi.">
                    <input id="p-transaction" required autoComplete="off" spellCheck={false} placeholder="Ex. CI251110.1234.A12345" value={f.transaction} onChange={(e) => setF((s) => ({ ...s, transaction: e.target.value.replace(/\s+/g, "") }))} className={`${inputCls} tracking-[0.04em]`} />
                  </Field>
                )}

                {manual && (
                  <div className="grid gap-2 border border-gold/40 bg-night p-4 text-[14px] text-sand-soft">
                    <b className="text-sand">Comment payer par Orange Money</b>
                    <ol className="grid list-decimal gap-1 pl-5">
                      <li>Envoyez le montant de l’acompte depuis votre application ou le menu Orange Money au numéro :</li>
                    </ol>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[20px] font-extrabold tracking-[0.02em] text-gold tabular-nums">{site.orangeMoney}</span>
                      <CopyButton text={site.orangeMoney.replace(/\s/g, "")} />
                    </div>
                    <ol start={2} className="grid list-decimal gap-1 pl-5">
                      <li>Remplissez ce formulaire avec le numéro de transaction du SMS, puis cliquez sur « Envoyer ma confirmation ».</li>
                      <li>Notre équipe vérifie le paiement et vous confirme la réservation.</li>
                    </ol>
                  </div>
                )}
                {state.kind === "manual-ok" && (
                  <Status kind="ok">
                    Merci ! Votre paiement est bien enregistré : notre équipe le vérifie et vous confirme la réservation.{" "}
                    <a href={whatsappLink(manualMsg)} target="_blank" rel="noopener noreferrer" className="font-semibold text-sand underline">Envoyer aussi la capture du SMS sur WhatsApp</a> (facultatif).
                  </Status>
                )}
                {state.kind === "manual-sent" && <Status kind="ok">Merci ! Envoyez le message WhatsApp qui vient de s’ouvrir avec la capture du SMS Orange Money. Notre équipe vous confirme la réservation.</Status>}
                {state.kind === "err" && <Status kind="err">{state.text}</Status>}
                <div className="flex flex-wrap gap-2.5">
                  <Button type="submit" disabled={state.kind === "sending" || state.kind === "manual-ok"}>{manual ? (state.kind === "sending" ? "Envoi…" : "Envoyer ma confirmation") : state.kind === "sending" ? "Paiement en cours…" : `Payer ${amount > 0 ? `${fmt(amount)} GNF` : "l’acompte"}`}</Button>
                </div>
                {enLigne && <p className="text-[13.5px] text-sand-soft">Vous êtes redirigé vers la page de paiement sécurisée de Sily Link, où vous validez le paiement sur votre téléphone. Votre code secret n’est jamais saisi sur notre site.{conf.silylinkTest ? " (Mode test : aucun débit réel.)" : ""}</p>}
                {!manual && !enLigne && <p className="text-[13.5px] text-sand-soft">Vous êtes redirigé vers la page de paiement sécurisée de CinetPay, où vous validez le paiement sur votre téléphone. Aucune donnée bancaire ne transite par notre site.</p>}
              </form>
            )}
          </div>
        </Wrap>
      </section>
    </main>
  );
}
