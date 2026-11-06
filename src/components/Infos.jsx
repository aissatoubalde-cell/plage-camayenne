import { mapDirectionsUrl, mapEmbedUrl, site, whatsappLink } from "../config";
import CopyButton from "./CopyButton";
import { Reveal } from "./motion";
import { ScrollEyebrow, ScrollWords } from "./text";
import { Button, Wrap } from "./ui";
import { Icon } from "./ui/icons";

const ctaSteps = [
  ["send", "Décrivez votre événement", "Formulaire en deux minutes, ou un message WhatsApp."],
  ["clock", "Réponse sous 48 h", "Une première proposition, puis une visite du site."],
  ["check", "Devis et acompte", "Vous validez, réglez l’acompte en ligne et votre date est bloquée."],
];

const facts = [
  ["car", "Parking privé"],
  ["shield", "Site sécurisé, agents présents"],
  ["eye", "Visite sur rendez-vous avant réservation"],
];

function ContactRow({ icon, label, children, action }) {
  return (
    <li className="flex items-start gap-4 py-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-night text-gold"><Icon name={icon} className="h-5 w-5" /></span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-[11.5px] font-semibold tracking-[0.14em] uppercase text-sand-soft">{label}</span>
        <span className="text-[15.5px] text-sand [overflow-wrap:anywhere]">{children}</span>
      </div>
      {action}
    </li>
  );
}

export default function Infos() {
  const socials = [["facebook", site.social.facebook, "Facebook"], ["instagram", site.social.instagram, "Instagram"], ["tiktok", site.social.tiktok, "TikTok"]].filter(([, url]) => url);

  return (
    <section id="infos" className="bg-night-2 py-section">
      <Wrap className="grid items-start gap-gutter lg:grid-cols-[1fr_1.25fr]">
        {/* ---- Nous trouver ---- */}
        <div className="min-w-0">
          <Reveal className="mb-8 grid gap-[18px]">
            <ScrollEyebrow>Infos pratiques</ScrollEyebrow>
            <ScrollWords as="h2" text="Nous *trouver*." className="text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em]" />
            <ScrollWords as="p" mode="dim" text="Sur le littoral de Dixinn, à quelques minutes des principaux quartiers de Conakry." className="max-w-[48ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft" />
          </Reveal>

          <Reveal className="rounded-2xl bg-card p-5 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] md:p-6" amount={0.1}>
            <ul className="divide-y divide-line">
              <ContactRow icon="pin" label="Adresse">{site.address}</ContactRow>
              <ContactRow icon="phone" label="Téléphone" action={<CopyButton text={site.phone} />}>
                <a href={`tel:${site.phoneE164}`} className="no-underline hover:text-gold">{site.phone}</a>
              </ContactRow>
              <ContactRow icon="whatsapp" label="WhatsApp">
                <a href={whatsappLink("Bonjour Camayenne Plage, je souhaite des informations pour un événement.")} target="_blank" rel="noopener noreferrer" className="no-underline hover:text-gold">Écrire à l’équipe</a>
              </ContactRow>
              <ContactRow icon="mail" label="E-mail" action={<CopyButton text={site.email} />}>
                <a href={`mailto:${site.email}`} className="no-underline hover:text-gold">{site.email}</a>
              </ContactRow>
            </ul>
            <ul className="mt-5 flex flex-wrap gap-2">
              {facts.map(([icon, text]) => (
                <li key={text} className="inline-flex items-center gap-2 rounded-full border border-line bg-night px-3.5 py-2 text-[13.5px] text-sand-soft"><Icon name={icon} className="h-4 w-4 text-gold" />{text}</li>
              ))}
              {socials.map(([name, url, label]) => (
                <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-night text-sand-soft transition-colors hover:border-gold hover:text-gold"><Icon name={name} className="h-4 w-4" /></a></li>
              ))}
            </ul>
          </Reveal>

          {/* Carte : ajustez mapQuery dans src/config.js si le repère n’est pas exactement sur la plage */}
          <Reveal className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl bg-card shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)]" amount={0.1}>
            <iframe src={mapEmbedUrl} title="Carte : Camayenne Plage à Conakry" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="block h-full w-full border-0" />
            <Button href={mapDirectionsUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 left-4 rounded-full px-[18px] py-[13px] shadow-[0_8px_24px_rgba(0,0,0,.35)]">
              <Icon name="navigation" className="h-4 w-4" />Itinéraire
            </Button>
          </Reveal>
        </div>

        {/* ---- Appel à la demande de devis (formulaire complet sur /devis) ---- */}
        <div id="devis" className="min-w-0 scroll-mt-24">
          <Reveal className="mb-8 grid gap-[18px]">
            <ScrollEyebrow>Votre projet</ScrollEyebrow>
            <ScrollWords as="h2" text="Parlez-nous *de votre projet*." className="text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em]" />
            <ScrollWords as="p" mode="dim" text="Séminaire, team building, anniversaire ou réception : décrivez votre événement en deux minutes, nous vous répondons avec un devis personnalisé sous 48 h." className="max-w-[52ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft" />
          </Reveal>
          <Reveal amount={0.1} className="relative grid gap-6 overflow-hidden rounded-2xl bg-card p-6 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] md:p-8">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold/0 via-gold to-gold/0" />
            <ul className="grid gap-4 sm:grid-cols-3">
              {ctaSteps.map(([icon, t, d]) => (
                <li key={t} className="grid gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-night text-gold"><Icon name={icon} className="h-5 w-5" /></span>
                  <b className="text-[15px]">{t}</b>
                  <span className="text-[13.5px] text-sand-soft">{d}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-3">
              <Button to="/devis" className="w-full rounded-xl py-[18px]">Demander un devis<Icon name="arrow" className="h-4 w-4" /></Button>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13.5px] text-sand-soft">
                <a href={whatsappLink("Bonjour Camayenne Plage, je souhaite un devis pour un événement.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 no-underline hover:text-sand"><Icon name="whatsapp" className="h-4 w-4" />Écrire sur WhatsApp</a>
                <a href={`tel:${site.phoneE164}`} className="inline-flex items-center gap-1.5 no-underline hover:text-sand"><Icon name="phone" className="h-4 w-4" />{site.phone}</a>
              </div>
            </div>
          </Reveal>
        </div>
      </Wrap>
    </section>
  );
}
