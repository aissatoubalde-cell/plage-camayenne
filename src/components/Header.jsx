import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { asset } from "../assets";
import { site } from "../config";
import { navDesktop, navDiscover, navOrganize } from "../data/content";
import { ease, fadeUp, stagger } from "./motion";
import { Button, Wrap } from "./ui";
import { Icon } from "./ui/icons";

const sectionIds = navDesktop.map((n) => n.id);

/** Section de l’accueil actuellement à l’écran (pour souligner le lien correspondant). */
function useActiveSection(enabled) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!enabled) { setActive(null); return; }
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
        else if (window.scrollY < 300) setActive(null);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.05, 0.2, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
  return active;
}

function Brand({ onClick }) {
  return (
    <Link to="/#accueil" onClick={onClick} className="flex items-center gap-3 no-underline">
      <picture className="contents">
        <source type="image/webp" srcSet={asset("img/logo.webp")} />
        <img src={asset("img/logo.jpg")} alt="Logo Camayenne Plage" width="46" height="46" className="h-[46px] w-[46px] rounded-full bg-white object-contain" />
      </picture>
      <b className="text-lg leading-none font-extrabold tracking-[-0.01em] whitespace-nowrap">
        Camayenne Plage
        <small className="mt-1 block text-[11px] font-medium tracking-[0.14em] uppercase text-sand-soft">Loisirs &amp; événements</small>
      </b>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const active = useActiveSection(location.pathname === "/");
  const close = () => setOpen(false);

  // Fermeture à chaque changement d’adresse (clic sur un lien du panneau)
  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className="border-b border-line text-center text-[11.5px] tracking-[0.16em] uppercase text-sand-soft">
        <Wrap className="py-2.5">Camayenne, Conakry · Parking privé · Site sécurisé · {site.phone}</Wrap>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-night/90 backdrop-blur-[8px]">
        {/* En-tête plus large que le contenu : le logo et les actions sont repoussés vers les bords */}
        <div className="mx-auto flex h-[78px] max-w-[1360px] items-center gap-6 px-5 lg:gap-8 xl:gap-10">
          <Brand onClick={close} />

          {/* Ordinateur : liens visibles */}
          <nav aria-label="Navigation principale" className="hidden flex-1 items-center justify-center gap-5 lg:ml-8 lg:flex xl:ml-14 xl:gap-9">
            {navDesktop.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                aria-current={active === item.id ? "true" : undefined}
                className={`relative py-2 text-[14.5px] font-semibold whitespace-nowrap no-underline transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gold after:transition-transform after:duration-300 after:content-[''] hover:text-sand ${active === item.id ? "text-sand after:scale-x-100" : "text-sand-soft after:scale-x-0"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-5 lg:flex">
            <Link to="/paiement" className="hidden items-center gap-2 text-[14px] font-semibold whitespace-nowrap text-sand-soft no-underline transition-colors hover:text-sand xl:inline-flex">
              <Icon name="card" className="h-4 w-4" />Payer un acompte
            </Link>
            <Link
              to="/devis"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gold py-3 pr-3.5 pl-4 text-[14px] xl:pr-4 xl:pl-5 xl:text-[14.5px] font-bold whitespace-nowrap text-night no-underline shadow-[0_10px_26px_-10px_rgba(108,198,234,.75)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-gold-deep hover:shadow-[0_14px_30px_-10px_rgba(108,198,234,.85)]"
            >
              Demander un devis
              <span className="grid h-6 w-6 place-items-center rounded-full bg-night/15 transition-transform group-hover:translate-x-0.5"><Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2.4} /></span>
            </Link>
          </div>

          {/* Mobile et tablette : bouton du panneau */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Ouvrir le menu"
            className="ml-auto grid h-[46px] w-[46px] cursor-pointer place-content-center gap-1.5 rounded-[2px] border border-line lg:hidden"
          >
            <i className="block h-0.5 w-5 bg-sand" /><i className="block h-0.5 w-5 bg-sand" /><i className="block h-0.5 w-5 bg-sand" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <m.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={close} className="fixed inset-0 z-[60] bg-black/60 lg:hidden" />
            <m.aside
              key="drawer"
              id="menu-mobile"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[86vw] max-w-[400px] flex-col overflow-y-auto bg-night shadow-[-20px_0_60px_rgba(0,0,0,.5)] lg:hidden"
            >
              <div className="flex h-[74px] shrink-0 items-center justify-between border-b border-line px-5">
                <Brand onClick={close} />
                <button type="button" onClick={close} aria-label="Fermer le menu" className="grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-[2px] border border-line text-sand"><Icon name="x" className="h-5 w-5" /></button>
              </div>

              <m.div variants={stagger(0.1, 0.04)} initial="hidden" animate="show" className="grid gap-7 px-5 pt-6 pb-8">
                <m.nav variants={fadeUp} aria-label="Découvrir" className="grid gap-2">
                  <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gold">Découvrir</span>
                  <ul className="divide-y divide-line">
                    {navDiscover.map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} onClick={close} className="flex items-center justify-between py-3.5 text-[19px] font-bold tracking-[-0.01em] text-sand no-underline hover:text-gold">
                          {item.label}<Icon name="arrow" className="h-4 w-4 text-sand-soft" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </m.nav>

                <m.nav variants={fadeUp} aria-label="Organiser un événement" className="grid gap-2">
                  <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gold">Organiser un événement</span>
                  <ul className="grid gap-2">
                    {navOrganize.map((item) => (
                      <li key={item.to}>
                        <Link to={item.to} onClick={close} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-[15.5px] font-semibold text-sand no-underline hover:text-gold">
                          <Icon name={item.icon} className="h-5 w-5 text-gold" />{item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </m.nav>

                <m.div variants={fadeUp} className="grid gap-2.5">
                  <Button to="/devis" onClick={close} className="w-full">Demander un devis</Button>
                  <Button to="/paiement" onClick={close} variant="line" className="w-full">Payer un acompte</Button>
                </m.div>

              </m.div>
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
