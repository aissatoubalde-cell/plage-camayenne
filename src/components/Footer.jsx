import { Link } from "react-router-dom";
import { site } from "../config";
import { Wrap } from "./ui";

const links = [
  ["Mot du DG", "/#mot-du-dg"], ["Espaces de location", "/#espaces"], ["Espace privé", "/#prive"], ["Activités", "/#activites"],
  ["Entreprises", "/#entreprises"], ["Demander un devis", "/#devis"], ["Payer un acompte", "/paiement"],
];

export default function Footer() {
  return (
    <footer className="border-t border-line pt-14 pb-[30px]">
      <Wrap>
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr] [&>div]:grid [&>div]:min-w-0 [&>div]:content-start [&>div]:gap-[9px] [&>div]:text-sand-soft">
          <div>
            <span className="font-script text-[32px] leading-[1.1] text-gold">Votre événement, notre engagement.</span>
            <p>Camayenne Plage, complexe de loisirs et d’événementiel en bord de mer à Conakry.</p>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold tracking-[0.18em] uppercase text-gold">Contact</h4>
            <a href={`tel:${site.phoneE164}`} className="no-underline hover:text-sand">{site.phone}</a>
            <a href={`mailto:${site.email}`} className="no-underline [overflow-wrap:anywhere] hover:text-sand">{site.email}</a>
            <span>{site.address}</span>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold tracking-[0.18em] uppercase text-gold">Le site</h4>
            {links.map(([label, to]) => <Link key={to} to={to} className="no-underline hover:text-sand">{label}</Link>)}
          </div>
        </div>
        <div className="mt-9 flex flex-wrap justify-between gap-2 border-t border-line pt-5 text-[12.5px] text-sand-soft">
          <span>© {new Date().getFullYear()} Camayenne Plage</span>
          <span>Prestations soumises à disponibilité et aux conditions convenues.</span>
        </div>
      </Wrap>
    </footer>
  );
}
