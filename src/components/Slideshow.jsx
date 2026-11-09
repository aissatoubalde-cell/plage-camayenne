import { useEffect, useState } from "react";
import { Picture } from "./ui";

/** Diaporama en fondu : défile seul toutes les 4 s (sauf mouvement réduit), flèches et points pour naviguer. */
export default function Slideshow({ photos, className = "" }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = photos.length;
  const go = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (paused || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 4000);
    return () => clearInterval(t);
  }, [paused, n]);

  const arrow = "absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-night/70 text-sand opacity-0 transition-opacity group-hover/slides:opacity-100 focus-visible:opacity-100 max-md:opacity-100";
  return (
    <div className={`group/slides relative overflow-hidden bg-card ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrousel">
      {photos.map(([name, alt], k) => (
        <Picture key={name} name={name} alt={alt} loading="lazy" className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`} imgClass="h-full w-full object-cover" />
      ))}
      <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className={`${arrow} left-1.5`}>‹</button>
      <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className={`${arrow} right-1.5`}>›</button>
      {/* Au-delà de 8 photos, les points ne tiennent pas dans la vignette sur tablette/ordinateur : compteur à la place. */}
      {n > 8 && <span className="absolute right-1.5 bottom-1.5 z-10 hidden rounded-full bg-night/70 px-2 py-0.5 text-[11px] font-semibold text-sand tabular-nums md:block lg:hidden">{i + 1} / {n}</span>}
      <div className={`absolute inset-x-0 bottom-1.5 z-10 flex justify-center gap-1 ${n > 8 ? "md:hidden lg:flex" : ""}`}>
        {photos.map(([name], k) => (
          <button key={name} type="button" onClick={() => setI(k)} aria-label={`Photo ${k + 1} sur ${n}`} aria-current={k === i} className={`h-1.5 cursor-pointer rounded-full transition-all ${k === i ? "w-3.5 bg-gold" : "w-1.5 bg-sand/60"}`} />
        ))}
      </div>
    </div>
  );
}
