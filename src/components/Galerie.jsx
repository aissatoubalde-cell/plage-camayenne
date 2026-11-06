import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { galerie, galleryFilters } from "../data/content";
import { Hl, Picture, SectionHead, Wrap } from "./ui";

const navBtn = "absolute h-12 w-12 cursor-pointer rounded-[2px] border border-line bg-transparent text-xl leading-none font-semibold text-sand";

export default function Galerie() {
  const [filter, setFilter] = useState("all");
  const [current, setCurrent] = useState(null);
  const lastFocus = useRef(null);
  const closeBtn = useRef(null);
  const shown = useMemo(() => (filter === "all" ? galerie : galerie.filter((g) => g.cat === filter)), [filter]);
  const isOpen = current !== null;

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
        <SectionHead eyebrow="Galerie" title={<>Camayenne Plage <Hl>en images</Hl>.</>} />
        <div role="group" aria-label="Filtrer la galerie" className="mb-5 flex flex-wrap gap-2">
          {galleryFilters.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className="cursor-pointer rounded-[2px] border border-line px-4 py-3 text-[13px] leading-none font-semibold tracking-[0.06em] uppercase text-sand-soft aria-pressed:border-sand aria-pressed:bg-sand aria-pressed:text-night">
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {shown.map((g, i) => (
            <button key={g.photo} type="button" aria-label={`Agrandir : ${g.caption}`} onClick={(e) => { lastFocus.current = e.currentTarget; setCurrent(i); }} className="group aspect-square cursor-zoom-in overflow-hidden border-0 bg-card p-0">
              <Picture name={g.photo} alt={g.caption} imgClass="h-full w-full object-cover opacity-90 transition-[transform,opacity] duration-500 group-hover:scale-105 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </Wrap>

      {item && (
        <div role="dialog" aria-modal="true" aria-label="Photo agrandie" onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-[100] grid place-items-center bg-[#030E11]/95 px-4 py-[60px]">
          <button ref={closeBtn} type="button" aria-label="Fermer" onClick={close} className={`${navBtn} top-3.5 right-3.5`}>✕</button>
          <button type="button" aria-label="Photo précédente" onClick={() => step(-1)} className={`${navBtn} top-1/2 left-3.5`}>←</button>
          <figure className="grid max-w-[min(92vw,900px)] justify-items-center gap-3">
            <Picture name={item.photo} alt={item.caption} loading="eager" width={item.photo === "hero" ? 960 : 414} height={item.photo === "hero" ? 540 : 414} imgClass="h-auto max-h-[76vh] w-auto max-w-full" />
            <figcaption className="text-sm tracking-[0.06em] text-sand-soft">{item.caption} · {current + 1} / {shown.length}</figcaption>
          </figure>
          <button type="button" aria-label="Photo suivante" onClick={() => step(1)} className={`${navBtn} top-1/2 right-3.5`}>→</button>
        </div>
      )}
    </section>
  );
}
