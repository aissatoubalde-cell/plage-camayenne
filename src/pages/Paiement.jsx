import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { site, whatsappLink } from "../config";
import { Button, Field, Status, Wrap, inputCls, labelCls } from "../components/ui";
import CopyButton from "../components/CopyButton";
import { useTitle } from "../hooks";
import { Eyebrow as AnimatedEyebrow, SplitWords } from "../components/text";

const CardFields = lazy(() => import("../components/CardFields"));

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const MIN_GNF = 50000;
const methodCls = "grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-[2px] border border-line bg-night p-3.5 has-checked:border-gold has-disabled:cursor-not-allowed has-disabled:opacity-50";

const steps = [
  ["Devis validé", "Vous avez reçu votre devis et confirmé la réservation avec notre équipe."],
  ["Acompte", "Vous réglez le montant indiqué sur le devis, par Orange Money ou carte bancaire."],
  ["Confirmation", "Notre équipe vérifie le paiement et vous confirme la réservation."],
];

export default function Paiement() {
  useTitle("Payer un acompte · Camayenne Plage");
  const [params] = useSearchParams();
  const [conf, setConf] = useState(undefined); // undefined = chargement, null = indisponible
  const [method, setMethod] = useState("cinetpay");
  const [f, setF] = useState({ name: "", email: "", phone: "", reference: "", amount: "" });
  const [state, setState] = useState({ kind: params.get("annule") ? "cancel" : "idle" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    fetch(`${site.paymentApi}/paiement-config`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setConf(c || {}))
      .catch(() => setConf({}));
  }, []);

  const currency = method === "stripe" ? (conf?.currency || "GNF") : "GNF";
  const min = currency === "GNF" ? MIN_GNF : 10;
  const amount = Number(f.amount);
  // Sans CinetPay, Orange Money reste actif en mode manuel : transfert vers notre numéro puis confirmation WhatsApp.
  const manual = method === "cinetpay" && conf && !conf.cinetpay;
  // Carte : avec la clé publiable Stripe, les champs de carte s’affichent dans le formulaire au lieu d’une redirection.
  const embeddedCard = method === "stripe" && Boolean(conf?.stripeKey);
  const payRef = useRef(null);
  const onCardReady = useCallback((pay) => { payRef.current = pay; }, []);
  const api = (body) => fetch(`${site.paymentApi}/paiement-${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(async (res) => { const json = await res.json().catch(() => ({})); if (!res.ok) throw new Error(json.error || "Paiement indisponible pour le moment."); return json; });

  const submit = async (e) => {
    e.preventDefault();
    if (manual) {
      const msg = [
        "Bonjour, je règle l’acompte de ma réservation par Orange Money.",
        `• Nom : ${f.name}`,
        f.reference && `• Référence du devis : ${f.reference}`,
        `• Montant : ${fmt(amount)} GNF`,
        f.phone && `• Numéro Orange Money utilisé : ${f.phone}`,
        `• E-mail : ${f.email}`,
        "Je joins la capture du SMS de confirmation.",
      ].filter(Boolean).join("\n");
      window.open(whatsappLink(msg), "_blank", "noopener");
      setState({ kind: "manual-sent" });
      return;
    }
    setState({ kind: "sending" });
    try {
      if (embeddedCard) {
        if (!payRef.current) throw new Error("Le formulaire de carte est encore en chargement. Réessayez dans un instant.");
        await payRef.current({
          getClientSecret: async () => { const j = await api({ ...f, amount, intent: true }); if (!j.clientSecret) throw new Error("Paiement indisponible pour le moment."); return j.clientSecret; },
          billing: { name: f.name, email: f.email },
          returnUrl: `${window.location.origin}/confirmation?provider=stripe`,
        });
        return; // Stripe redirige vers la page de confirmation
      }
      const json = await api({ ...f, amount });
      if (!json.url) throw new Error("Paiement indisponible pour le moment.");
      window.location.assign(json.url);
    } catch (err) {
      setState({ kind: "err", text: err.message });
    }
  };

  const emailField = <Field id="p-email" label="E-mail" hint={embeddedCard ? "Votre reçu y est envoyé." : undefined}><input id="p-email" type="email" autoComplete="email" required value={f.email} onChange={set("email")} className={inputCls} /></Field>;
  const refField = <Field id="p-ref" label="Référence du devis"><input id="p-ref" placeholder="Indiquée sur votre devis" value={f.reference} onChange={set("reference")} className={inputCls} /></Field>;
  const amountField = (
    <Field id="p-montant" label={`Montant de l’acompte (${currency})`} hint={`Montant indiqué sur votre devis validé${currency === "GNF" ? ` (minimum ${fmt(MIN_GNF)} GNF)` : ""}.`}>
      <input id="p-montant" type="number" inputMode="numeric" required min={min} step={1} placeholder={currency === "GNF" ? `Ex. ${fmt(500000)}` : "Ex. 150"} value={f.amount} onChange={set("amount")} className={`${inputCls} tabular-nums`} />
    </Field>
  );

  return (
    <main>
      <section className="py-section">
        <Wrap className="grid items-start gap-gutter md:grid-cols-[1fr_1.25fr]">
          <div className="min-w-0">
            <div className="mb-[clamp(36px,5vw,60px)] grid gap-[18px]">
              <AnimatedEyebrow inView={false}>Paiement en ligne</AnimatedEyebrow>
              <SplitWords as="h1" inView={false} delay={0.2} text="Payer *un acompte*." className="text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em]" />
              <p className="max-w-[58ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft">Votre devis est validé ? Réglez l’acompte en quelques minutes, par Orange Money ou par carte, et votre date est bloquée.</p>
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
                  <div className="grid gap-2.5 md:grid-cols-2">
                    <label className={methodCls}>
                      <input type="radio" name="method" value="cinetpay" checked={method === "cinetpay"} onChange={() => setMethod("cinetpay")} className="row-span-2 accent-gold" />
                      <b className="text-[15px]">Orange Money</b>
                      <small className="text-[13px] text-sand-soft">{conf.cinetpay ? "Paiement sécurisé via CinetPay" : "Transfert puis confirmation WhatsApp"}</small>
                    </label>
                    <label className={methodCls}>
                      <input type="radio" name="method" value="stripe" checked={method === "stripe"} disabled={!conf.stripe} onChange={() => setMethod("stripe")} className="row-span-2 accent-gold" />
                      <b className="text-[15px]">Carte bancaire</b>
                      <small className="text-[13px] text-sand-soft">{conf.stripe ? "Visa, Mastercard, via Stripe" : "Bientôt disponible"}</small>
                    </label>
                  </div>
                </fieldset>
                {embeddedCard ? (
                  <>
                    <div className="grid gap-3.5 md:grid-cols-2">
                      {amountField}
                      {refField}
                    </div>
                    {emailField}
                    <div className="grid gap-3 border-t border-line pt-[18px]">
                      <div className="grid gap-0.5">
                        <b className="flex items-center gap-2 text-[17px]"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current text-gold"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" /></svg>Paiement sécurisé</b>
                        <small className="text-[13px] text-sand-soft">Informations protégées et chiffrées par Stripe.</small>
                      </div>
                      <Suspense fallback={<p className="text-sand-soft">Chargement des champs de carte…</p>}>
                        <CardFields publishableKey={conf.stripeKey} amount={amount >= min ? amount : min} currency={currency} onReady={onCardReady} />
                      </Suspense>
                      <Field id="p-nom" label="Nom du titulaire de la carte"><input id="p-nom" autoComplete="cc-name" required minLength={2} placeholder="Tel qu’inscrit sur la carte" value={f.name} onChange={set("name")} className={inputCls} /></Field>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-3.5 md:grid-cols-2">
                      <Field id="p-nom" label="Nom et prénom"><input id="p-nom" autoComplete="name" required minLength={2} value={f.name} onChange={set("name")} className={inputCls} /></Field>
                      {emailField}
                    </div>
                    <div className="grid gap-3.5 md:grid-cols-2">
                      <Field id="p-tel" label="Téléphone"><input id="p-tel" type="tel" autoComplete="tel" placeholder={method === "cinetpay" ? "Numéro Orange Money" : "Votre numéro"} value={f.phone} onChange={set("phone")} className={inputCls} /></Field>
                      {refField}
                    </div>
                    {amountField}
                  </>
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
                      <li>Remplissez ce formulaire puis cliquez sur « Confirmer sur WhatsApp ».</li>
                      <li>Joignez la capture du SMS de confirmation : notre équipe valide votre réservation.</li>
                    </ol>
                  </div>
                )}
                {state.kind === "manual-sent" && <Status kind="ok">Merci ! Envoyez le message WhatsApp qui vient de s’ouvrir avec la capture du SMS Orange Money. Notre équipe vous confirme la réservation.</Status>}
                {state.kind === "err" && <Status kind="err">{state.text}</Status>}
                <div className="flex flex-wrap gap-2.5">
                  <Button type="submit" disabled={state.kind === "sending"}>{manual ? "Confirmer sur WhatsApp" : state.kind === "sending" ? "Paiement en cours…" : `Payer ${amount > 0 ? `${fmt(amount)} ${currency}` : "l’acompte"}`}</Button>
                </div>
                {!manual && !embeddedCard && <p className="text-[13.5px] text-sand-soft">Vous êtes redirigé vers la page de paiement sécurisée du prestataire. Aucune donnée bancaire ne transite par notre site. Un reçu vous est envoyé par e-mail.</p>}
              </form>
            )}
          </div>
        </Wrap>
      </section>
    </main>
  );
}
