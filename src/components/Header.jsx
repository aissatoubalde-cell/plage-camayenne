import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { site } from "../config";
import { navItems } from "../data/content";
import { Button, Eyebrow, Wrap } from "./ui";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(106);
  const headerRef = useRef(null);
  const close = () => setOpen(false);
  // Le menu commence sous l’en-tête, quelle que soit la hauteur du bandeau d’annonce.
  const toggle = () => { setMenuTop((headerRef.current?.getBoundingClientRect().bottom ?? 74) + 32); setOpen((o) => !o); };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const bar = "block h-0.5 w-5 bg-sand transition-[transform,opacity] duration-250";

  return (
    <>
      <div className="border-b border-line text-center text-[11.5px] tracking-[0.16em] uppercase text-sand-soft">
        <Wrap className="py-2.5">Camayenne, Conakry · Parking privé · Site sécurisé · {site.phone}</Wrap>
      </div>
      <header ref={headerRef} className="sticky top-0 z-50 border-b border-line bg-night/90 backdrop-blur-[8px]">
        <Wrap className="flex h-[74px] items-center gap-[18px]">
          <Link to="/#accueil" onClick={close} className="flex items-center gap-3 no-underline">
            <picture className="contents">
              <source type="image/webp" srcSet="/img/logo.webp" />
              <img src="/img/logo.jpg" alt="Logo Camayenne Plage" width="46" height="46" className="h-[46px] w-[46px] rounded-full bg-white object-contain" />
            </picture>
            <b className="text-lg leading-none font-extrabold tracking-[-0.01em]">
              Camayenne Plage
              <small className="mt-1 block text-[11px] font-medium tracking-[0.14em] uppercase text-sand-soft">Loisirs &amp; événements</small>
            </b>
          </Link>
          <div className="ml-auto hidden md:block">
            <Button to="/#devis" onClick={close} className="px-[18px] py-[13px]">Demander un devis</Button>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="ml-auto grid h-[46px] w-[46px] cursor-pointer place-content-center gap-1.5 rounded-[2px] border border-line md:ml-0"
          >
            <i className={`${bar} ${open ? "translate-y-2 rotate-45" : ""}`} />
            <i className={`${bar} ${open ? "opacity-0" : ""}`} />
            <i className={`${bar} ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </Wrap>
      </header>

      {open && (
        <div id="menu" className="fixed inset-0 z-40 overflow-auto bg-night" style={{ paddingTop: menuTop }}>
          <Wrap className="grid gap-10 pb-10 md:grid-cols-[1.4fr_1fr]">
            <nav aria-label="Navigation principale" className="grid border-t border-line">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={close}
                  className="grid grid-cols-[56px_1fr] items-baseline gap-3 border-b border-line py-4 text-[clamp(24px,3.4vw,40px)] leading-[1.1] font-bold tracking-[-0.02em] no-underline hover:text-gold"
                >
                  <span className="text-[15px] font-semibold tracking-normal text-gold">{item.n}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <aside className="grid content-start gap-3.5 text-sand-soft">
              <Eyebrow>Contact</Eyebrow>
              <p><b className="text-sand">{site.phone}</b></p>
              <p className="[overflow-wrap:anywhere]">{site.email}</p>
              <p>{site.address}</p>
            </aside>
          </Wrap>
        </div>
      )}
    </>
  );
}
