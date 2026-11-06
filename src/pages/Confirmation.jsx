import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { site, whatsappLink } from "../config";
import { Button, Callout, Eyebrow, Wrap } from "../components/ui";
import { useTitle } from "../hooks";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const T = {
  loading: { eyebrow: "Paiement", title: "Vérification de votre paiement…", body: "Un instant, nous interrogeons le prestataire de paiement.", tone: "" },
  paid: { eyebrow: "Paiement reçu", title: "Merci, votre acompte est enregistré.", body: "Un reçu vous est envoyé par e-mail. Notre équipe vous confirme la réservation très rapidement.", tone: "ok" },
  pending: { eyebrow: "Paiement en cours", title: "Nous attendons la confirmation.", body: "Si vous avez validé le paiement sur votre téléphone, la confirmation arrive dans quelques instants. Vous pouvez recharger cette page.", tone: "" },
  failed: { eyebrow: "Paiement non abouti", title: "Le paiement n’a pas été accepté.", body: "Aucun montant n’a été débité. Vous pouvez réessayer ou nous contacter pour régler autrement.", tone: "err" },
  unknown: { eyebrow: "Paiement", title: "Merci pour votre règlement.", body: "Nous vérifions votre paiement et revenons vers vous par e-mail ou par téléphone.", tone: "" },
};

export default function Confirmation() {
  useTitle("Confirmation de paiement · Camayenne Plage");
  const [params] = useSearchParams();
  const provider = params.get("provider"), id = params.get("session_id") || params.get("transaction_id");
  const [r, setR] = useState({ status: "loading" });

  useEffect(() => {
    if (!provider || !id) { setR({ status: "unknown" }); return; }
    fetch(`${site.paymentApi}/paiement-statut?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { status: "unknown" }))
      .then(setR)
      .catch(() => setR({ status: "unknown" }));
  }, [provider, id]);

  const t = T[r.status] || T.unknown;
  return (
    <main>
      <section className="py-section">
        <Wrap className="max-w-[760px]">
          <Callout tone={t.tone}>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.02em]">{t.title}</h1>
            <p className="text-sand-soft">{t.body}</p>
            {r.amount ? <p>Montant : <b className="tabular-nums">{fmt(r.amount)} {r.currency}</b></p> : null}
            {id && <p className="text-[13.5px] text-sand-soft">Référence de transaction : {id}</p>}
            <div className="flex flex-wrap gap-2.5">
              {r.status === "failed" ? <Button to="/paiement">Réessayer</Button> : <Button to="/">Retour au site</Button>}
              <Button href={whatsappLink(`Bonjour, je viens d’effectuer un paiement (référence ${id || "inconnue"}).`)} variant="line" target="_blank" rel="noopener noreferrer">Nous écrire sur WhatsApp</Button>
            </div>
            <p className="text-[13.5px] text-sand-soft">Une question ? {site.phone} · {site.email}</p>
          </Callout>
        </Wrap>
      </section>
    </main>
  );
}
