import { mapDirectionsUrl, mapEmbedUrl, site } from "../config";
import CopyButton from "./CopyButton";
import { Reveal } from "./motion";
import DevisForm from "./DevisForm";
import { Button, Eyebrow, H2, Hl, SectionHead, Wrap } from "./ui";

const facts = [
  ["Adresse", `${site.address}. Accès depuis les principaux quartiers de la ville.`],
  ["Parking", "Parking privé sur place."],
  ["Sécurité", "Site sécurisé, agents présents."],
];

function Fact({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 md:grid-cols-[130px_1fr] md:gap-3.5">
      <b className="pt-0.5 text-[12.5px] font-semibold tracking-[0.14em] uppercase text-gold">{label}</b>
      <span className="text-sand">{children}</span>
    </div>
  );
}

export default function Infos() {
  return (
    <section id="infos" className="bg-night-2 py-section">
      <Wrap className="grid items-start gap-gutter md:grid-cols-[1fr_1.25fr]">
        <div className="min-w-0">
          <SectionHead eyebrow="Infos pratiques" title={<>Nous <Hl>trouver</Hl>.</>} />
          <Reveal className="border-t border-line" amount={0.1}>
            {facts.map(([k, v]) => <Fact key={k} label={k}>{v}</Fact>)}
            <Fact label="Téléphone">
              <span className="flex flex-wrap items-center gap-2.5"><a href={`tel:${site.phoneE164}`} className="no-underline">{site.phone}</a><CopyButton text={site.phone} /></span>
            </Fact>
            <Fact label="E-mail">
              <span className="flex flex-wrap items-center gap-2.5"><a href={`mailto:${site.email}`} className="no-underline [overflow-wrap:anywhere]">{site.email}</a><CopyButton text={site.email} /></span>
            </Fact>
            <Fact label="Réseaux">Camayenne Plage sur Facebook, Instagram et TikTok.</Fact>
            <Fact label="Visite">Visite du site sur rendez-vous avant toute réservation.</Fact>
          </Reveal>
          {/* Carte : ajustez mapQuery dans src/config.js si le repère n’est pas exactement sur la plage */}
          <Reveal className="mt-7 aspect-[4/3] overflow-hidden border border-line bg-card" amount={0.1}>
            <iframe src={mapEmbedUrl} title="Carte : Camayenne Plage à Conakry" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="block h-full w-full border-0" />
          </Reveal>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <Button href={mapDirectionsUrl} variant="line" target="_blank" rel="noopener noreferrer" className="px-[18px] py-[13px]">Itinéraire sur Google Maps ↗</Button>
          </div>
        </div>
        <div id="devis" className="min-w-0">
          <div className="mb-[22px] grid gap-[18px]">
            <Eyebrow>Demande de devis</Eyebrow>
            <H2 className="text-[clamp(30px,3.8vw,46px)]">Parlez-nous <Hl>de votre projet</Hl>.</H2>
            <p className="text-[13.5px] text-sand-soft">Remplissez le formulaire : votre demande est envoyée à notre équipe, qui vous répond avec un devis personnalisé.</p>
          </div>
          <Reveal amount={0.05}><DevisForm /></Reveal>
        </div>
      </Wrap>
    </section>
  );
}
