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
  ["Acompte", "Vous réglez le montant indiqué sur le devis, par Orange Money ou carte bancaire."],
  ["Confirmation", "Notre équipe vérifie le paiement et vous confirme la réservation."],
];

// Pays proposés pour le paiement par carte (la banque exige la ville et le pays du titulaire) : code ISO à deux lettres.
const countries = [
  ["GN", "Guinée"], ["SN", "Sénégal"], ["CI", "Côte d’Ivoire"], ["ML", "Mali"], ["SL", "Sierra Leone"], ["LR", "Libéria"], ["GW", "Guinée-Bissau"],
  ["GM", "Gambie"], ["MR", "Mauritanie"], ["BF", "Burkina Faso"], ["NE", "Niger"], ["TG", "Togo"], ["BJ", "Bénin"], ["GH", "Ghana"], ["NG", "Nigéria"],
  ["CM", "Cameroun"], ["GA", "Gabon"], ["CG", "Congo"], ["CD", "RD Congo"], ["MA", "Maroc"], ["DZ", "Algérie"], ["TN", "Tunisie"], ["EG", "Égypte"],
  ["FR", "France"], ["BE", "Belgique"], ["CH", "Suisse"], ["DE", "Allemagne"], ["ES", "Espagne"], ["IT", "Italie"], ["PT", "Portugal"], ["GB", "Royaume-Uni"],
  ["CA", "Canada"], ["US", "États-Unis"], ["BR", "Brésil"], ["TR", "Turquie"], ["AE", "Émirats arabes unis"], ["SA", "Arabie saoudite"], ["CN", "Chine"], ["IN", "Inde"],
];

export default function Paiement() {
  useTitle("Payer un acompte · Camayenne Plage");
  const [params] = useSearchParams();
  const [conf, setConf] = useState(undefined); // undefined = chargement, {} = indisponible
  const [method, setMethod] = useState("om"); // om = Orange Money, card = carte bancaire (tous deux via CinetPay)
  const [f, setF] = useState({ name: "", email: "", phone: "", reference: "", amount: "", city: "", country: "GN" });
  const [state, setState] = useState({ kind: params.get("annule") ? "cancel" : "idle" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    fetch(`${site.paymentApi}/paiement-config`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setConf(c || {}))
      .catch(() => setConf({}));
  }, []);

  const amount = Number(f.amount);
  const card = method === "card";
  // Sans clés CinetPay, Orange Money reste actif en mode manuel : transfert vers notre numéro puis confirmation WhatsApp.
  const manual = method === "om" && conf && !conf.cinetpay;

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
      const res = await fetch(`${site.paymentApi}/paiement-cinetpay`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, amount, channel: card ? "card" : "mobile" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Paiement indisponible pour le moment.");
      if (!json.url) throw new Error("Paiement indisponible pour le moment.");
      window.location.assign(json.url); // page de paiement CinetPay, puis retour sur /confirmation
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
                      <input type="radio" name="method" value="om" checked={method === "om"} onChange={() => setMethod("om")} className="row-span-2 accent-gold" />
                      <b className="text-[15px]">Orange Money</b>
                      <small className="text-[13px] text-sand-soft">{conf.cinetpay ? "Paiement sécurisé via CinetPay" : "Transfert puis confirmation WhatsApp"}</small>
                    </label>
                    <label className={methodCls}>
                      <input type="radio" name="method" value="card" checked={card} disabled={!conf.card} onChange={() => setMethod("card")} className="row-span-2 accent-gold" />
                      <b className="text-[15px]">Carte bancaire</b>
                      <small className="text-[13px] text-sand-soft">{conf.card ? "Visa, Mastercard · paiement sécurisé" : "Bientôt disponible"}</small>
                    </label>
                  </div>
                </fieldset>

                <div className="grid gap-3.5 md:grid-cols-2">
                  <Field id="p-nom" label="Nom et prénom"><input id="p-nom" autoComplete="name" required minLength={2} value={f.name} onChange={set("name")} className={inputCls} /></Field>
                  <Field id="p-email" label="E-mail" hint="Votre reçu y est envoyé."><input id="p-email" type="email" autoComplete="email" required value={f.email} onChange={set("email")} className={inputCls} /></Field>
                </div>
                <div className="grid gap-3.5 md:grid-cols-2">
                  <Field id="p-tel" label="Téléphone"><input id="p-tel" type="tel" inputMode="tel" autoComplete="tel" required={card} placeholder={card ? "Votre numéro" : "Numéro Orange Money"} value={f.phone} onChange={set("phone")} className={inputCls} /></Field>
                  <Field id="p-ref" label="Référence du devis"><input id="p-ref" placeholder="Indiquée sur votre devis" value={f.reference} onChange={set("reference")} className={inputCls} /></Field>
                </div>
                {card && (
                  <div className="grid gap-3.5 md:grid-cols-2">
                    <Field id="p-ville" label="Ville" hint="Demandée par votre banque pour sécuriser le paiement."><input id="p-ville" autoComplete="address-level2" required minLength={2} placeholder="Ex. Conakry" value={f.city} onChange={set("city")} className={inputCls} /></Field>
                    <Field id="p-pays" label="Pays">
                      <select id="p-pays" autoComplete="country" required value={f.country} onChange={set("country")} className={`${inputCls} [color-scheme:dark]`}>
                        {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                      </select>
                    </Field>
                  </div>
                )}
                <Field id="p-montant" label="Montant de l’acompte (GNF)" hint={`Montant indiqué sur votre devis validé (minimum ${fmt(MIN_GNF)} GNF).`}>
                  <input id="p-montant" type="number" inputMode="numeric" required min={MIN_GNF} step={5} placeholder={`Ex. ${fmt(500000)}`} value={f.amount} onChange={set("amount")} className={`${inputCls} tabular-nums`} />
                </Field>

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
                  <Button type="submit" disabled={state.kind === "sending"}>{manual ? "Confirmer sur WhatsApp" : state.kind === "sending" ? "Paiement en cours…" : `Payer ${amount > 0 ? `${fmt(amount)} GNF` : "l’acompte"}`}</Button>
                </div>
                {!manual && <p className="text-[13.5px] text-sand-soft">Vous êtes redirigé vers la page de paiement sécurisée de CinetPay{card ? ", où vous saisissez votre carte" : ""}. Aucune donnée bancaire ne transite par notre site. Un reçu vous est envoyé par e-mail.</p>}
              </form>
            )}
          </div>
        </Wrap>
      </section>
    </main>
  );
}
