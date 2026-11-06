import { Link } from "react-router-dom";
import { asset } from "../assets";
import { site, whatsappLink } from "../config";
import { SplitWords } from "./text";
import { Button, Wrap } from "./ui";
import { Icon } from "./ui/icons";

const links = [
  ["Mot du DG", "/#mot-du-dg"], ["Espaces de location", "/#espaces"], ["Espace privé", "/#prive"], ["Activités", "/#activites"],
  ["Entreprises", "/#entreprises"], ["Galerie", "/#galerie"], ["Infos pratiques", "/#infos"], ["Demander un devis", "/devis"], ["Payer un acompte", "/paiement"],
];

const Heading = ({ children }) => <h4 className="mb-4 text-xs font-semibold tracking-[0.18em] uppercase text-gold">{children}</h4>;
const rowCls = "flex items-start gap-3 text-sand-soft no-underline transition-colors hover:text-sand";

export default function Footer() {
  const socials = [["facebook", site.social.facebook, "Facebook"], ["instagram", site.social.instagram, "Instagram"], ["tiktok", site.social.tiktok, "TikTok"]].filter(([, url]) => url);

  return (
    <footer className="border-t border-line pt-[clamp(48px,6vw,80px)] pb-7">
      <Wrap>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_1fr_1.1fr] lg:gap-12">
          {/* Marque */}
          <div className="grid content-start gap-5">
            <Link to="/#accueil" className="flex items-center gap-3 no-underline">
              <picture className="contents">
                <source type="image/webp" srcSet={asset("img/logo.webp")} />
                <img src={asset("img/logo.jpg")} alt="Logo Camayenne Plage" width="46" height="46" className="h-[46px] w-[46px] rounded-full bg-white object-contain" />
              </picture>
              <b className="text-lg leading-none font-extrabold tracking-[-0.01em]">
                Camayenne Plage
                <small className="mt-1 block text-[11px] font-medium tracking-[0.14em] uppercase text-sand-soft">Loisirs &amp; événements</small>
              </b>
            </Link>
            <SplitWords as="p" text="Votre événement, *notre engagement*." amount={0.4} className="max-w-[16ch] text-[clamp(24px,2.6vw,34px)] leading-[1.05] font-extrabold tracking-[-0.025em]" />
            <p className="max-w-[40ch] text-[15px] text-sand-soft">Complexe de loisirs et d’événementiel en bord de mer, à Conakry. Plage, aire de jeux, séminaires, team building et réceptions face à l’océan.</p>
            {socials.length > 0 && (
              <div className="flex gap-2">
                {socials.map(([name, url, label]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-[2px] border border-line text-sand-soft transition-colors hover:border-gold hover:text-gold">
                    <Icon name={name} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Le site */}
          <nav aria-label="Pied de page">
            <Heading>Le site</Heading>
            <ul className="grid gap-2.5">
              {links.map(([label, to]) => (
                <li key={to}><Link to={to} className="text-[15px] text-sand-soft no-underline transition-colors hover:text-sand">{label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <Heading>Contact</Heading>
            <ul className="grid gap-3.5 text-[15px]">
              <li><a href={`tel:${site.phoneE164}`} className={rowCls}><Icon name="phone" className="mt-[3px] h-[18px] w-[18px] text-gold" />{site.phone}</a></li>
              <li><a href={whatsappLink("Bonjour Camayenne Plage, je souhaite des informations pour un événement.")} target="_blank" rel="noopener noreferrer" className={rowCls}><Icon name="whatsapp" className="mt-[3px] h-[18px] w-[18px] text-gold" />Écrire sur WhatsApp</a></li>
              <li><a href={`mailto:${site.email}`} className={`${rowCls} [overflow-wrap:anywhere]`}><Icon name="mail" className="mt-[3px] h-[18px] w-[18px] text-gold" />{site.email}</a></li>
              <li className={rowCls}><Icon name="pin" className="mt-[3px] h-[18px] w-[18px] text-gold" /><span>{site.address}<br />Parking privé · Site sécurisé</span></li>
            </ul>
          </div>

          {/* Réserver */}
          <div className="grid content-start gap-4 rounded-2xl bg-card p-6 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)]">
            <Heading>Réserver</Heading>
            <p className="-mt-2 text-[15px] text-sand-soft">Un séminaire, un anniversaire, une réception ? Parlez-nous de votre projet, nous vous répondons avec un devis personnalisé.</p>
            <div className="grid gap-2.5">
              <Button to="/devis" className="w-full px-5 py-[15px]">Demander un devis</Button>
              <Button to="/paiement" variant="line" className="w-full px-5 py-[15px]">Payer un acompte</Button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-5 text-[12.5px] text-sand-soft">
          <span>© {new Date().getFullYear()} Camayenne Plage · Tous droits réservés</span>
          <span>Prestations soumises à disponibilité et aux conditions convenues.</span>
        </div>
      </Wrap>
    </footer>
  );
}
