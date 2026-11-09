import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { galerie, galleryFilters } from "../data/content";
import { ease } from "./motion";
import { Picture, SectionHead, Wrap } from "./ui";

// Bande déroulante : 4 s par photo ; la liste est répétée jusqu’à 8 photos minimum pour remplir la largeur.
const SEC_PER_PHOTO = 4;
const MIN_BAND = 8;

const navBtn = "absolute h-12 w-12 cursor-pointer rounded-[2px] border border-line bg-transparent text-xl leading-none font-semibold text-sand";

export default function Galerie() {
  const [filter, setFilter] = useState("all");
  const [current, setCurrent] = useState(null);
  const lastFocus = useRef(null);
  const closeBtn = useRef(null);
  const shown = useMemo(() => (filter === "all" ? galerie : galerie.filter((g) => g.cat === filter)), [filter]);
  const isOpen = current !== null;
  const reduce = useReducedMotion(); // mouvement réduit : rangée fixe que l’on fait défiler soi-même
  const [held, setHeld] = useState(false); // doigt posé sur la bande (mobile) : pause
  // Une copie complète, répétée si la catégorie a peu de photos ; le rendu la double pour boucler sans à-coup.
  const band = useMemo(() => { let seq = []; while (seq.length < MIN_BAND) seq = seq.concat(shown); return seq; }, [shown]);

  const close = useCallback(() => { setCurrent(null); lastFocus.current?.focus(); }, []);
  const step = useCallback((d) => setCurrent((c) => (c === null ? c : (c + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (!isOpen) return;
    closeBtn.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close, step]);

  const item = isOpen ? shown[current] : null;

  return (
    <section id="galerie" className="py-section">
      <Wrap>
        <SectionHead eyebrow="Galerie" title="Camayenne Plage *en images*." />
        <div role="group" aria-label="Filtrer la galerie" className="mb-5 flex flex-wrap gap-2">
          {galleryFilters.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className="cursor-pointer rounded-[2px] border border-line px-4 py-3 text-[13px] leading-none font-semibold tracking-[0.06em] uppercase text-sand-soft aria-pressed:border-sand aria-pressed:bg-sand aria-pressed:text-night">
              {f.label}
            </button>
          ))}
        </div>
        {/* Bande déroulante filtrée : défile seule, se fige au survol, au focus clavier ou sous le doigt ; fondu au changement de filtre. */}
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerCancel={() => setHeld(false)}
            className={`group/bande relative -mx-4 px-4 ${reduce ? "overflow-x-auto" : "overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"}`}>
            <ul className={`m-0 flex w-max list-none gap-3 p-0 py-2 ${reduce ? "" : "animate-defile group-hover/bande:[animation-play-state:paused] group-focus-within/bande:[animation-play-state:paused]"}`}
              style={reduce ? undefined : { animationDuration: `${band.length * SEC_PER_PHOTO}s`, animationPlayState: held ? "paused" : undefined }}>
              {(reduce ? shown : band.concat(band)).map((g, k) => {
                const dup = k >= shown.length; // répétitions : hors du parcours clavier et des lecteurs d’écran
                return (
                  <li key={`${g.photo}-${k}`} className="flex-none" aria-hidden={dup || undefined}>
                    <button type="button" tabIndex={dup ? -1 : 0} aria-label={`Agrandir : ${g.caption}`} onClick={(e) => { lastFocus.current = e.currentTarget; setCurrent(shown.indexOf(g)); }}
                      className="group relative block aspect-[4/3] w-[min(300px,66vw)] cursor-zoom-in overflow-hidden rounded-2xl border-0 bg-card p-0 shadow-[0_14px_30px_-14px_rgba(0,0,0,.6)]">
                      <Picture name={g.photo} alt={g.caption} imgClass="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-night/85 to-night/0 px-3 pt-7 pb-2.5 text-left text-[12.5px] font-semibold text-sand">{g.caption}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </m.div>
        </AnimatePresence>
      </Wrap>

      <AnimatePresence>
      {item && (
        <m.div key="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-label="Photo agrandie" onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-[100] grid place-items-center bg-[#030E11]/95 px-4 py-[60px]">
          <button ref={closeBtn} type="button" aria-label="Fermer" onClick={close} className={`${navBtn} top-3.5 right-3.5`}>✕</button>
          <button type="button" aria-label="Photo précédente" onClick={() => step(-1)} className={`${navBtn} top-1/2 left-3.5`}>←</button>
          <m.figure initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.28, ease }} className="grid max-w-[min(92vw,900px)] justify-items-center gap-3">
            <Picture name={item.photo} alt={item.caption} loading="eager" width={item.photo === "hero" ? 960 : 414} height={item.photo === "hero" ? 540 : 414} imgClass="h-auto max-h-[76vh] w-auto max-w-full" />
            <figcaption className="text-sm tracking-[0.06em] text-sand-soft">{item.caption} · {current + 1} / {shown.length}</figcaption>
          </m.figure>
          <button type="button" aria-label="Photo suivante" onClick={() => step(1)} className={`${navBtn} top-1/2 right-3.5`}>→</button>
        </m.div>
      )}
      </AnimatePresence>
    </section>
  );
}
