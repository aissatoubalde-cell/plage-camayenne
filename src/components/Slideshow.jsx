import { useEffect, useRef, useState } from "react";
import { Picture } from "./ui";

/**
 * Diaporama « glissement + zoom lent » : la photo suivante glisse depuis la droite (depuis la gauche quand on recule),
 * puis zoome très lentement tant qu'elle est affichée. Défile seul toutes les 5 s, flèches et points pour naviguer,
 * pause au survol. Mouvement réduit : pas de glissement ni de zoom, la photo change simplement.
 */
const GLISSEMENT = "transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none";
const ZOOM = "transition-transform duration-[6000ms] ease-linear motion-reduce:transition-none motion-reduce:scale-100";

export default function Slideshow({ photos, className = "" }) {
  const n = photos.length;
  const [etat, setEtat] = useState({ i: 0, prec: null, sens: 1 });
  const [paused, setPaused] = useState(false);
  const attente = useRef(null);

  // Le sens est posé d'abord (les photos en attente se rangent du bon côté, sans animation), puis la photo change.
  const aller = (cible, sens) => {
    if (cible === etat.i) return;
    clearTimeout(attente.current);
    setEtat((e) => ({ ...e, prec: null, sens }));
    attente.current = setTimeout(() => setEtat((e) => ({ i: cible, prec: e.i, sens })), 40);
  };
  const go = (d) => aller((etat.i + d + n) % n, d);
  useEffect(() => () => clearTimeout(attente.current), []);

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  });

  const position = (k) => {
    if (k === etat.i) return `z-20 translate-x-0 ${GLISSEMENT}`;
    if (k === etat.prec) return `z-10 ${etat.sens > 0 ? "-translate-x-full" : "translate-x-full"} ${GLISSEMENT}`;
    return `z-0 ${etat.sens > 0 ? "translate-x-full" : "-translate-x-full"}`;
  };

  const arrow = "absolute top-1/2 z-30 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-night/70 text-sand opacity-0 transition-opacity group-hover/slides:opacity-100 focus-visible:opacity-100 max-md:opacity-100";
  return (
    <div className={`group/slides relative overflow-hidden bg-card ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrousel">
      {photos.map(([name, alt], k) => (
        <Picture key={name} name={name} alt={alt} loading="lazy"
          className={`absolute inset-0 overflow-hidden ${position(k)}`}
          imgClass={`h-full w-full object-cover ${k === etat.i ? `scale-[1.08] ${ZOOM}` : k === etat.prec ? "scale-[1.08] motion-reduce:scale-100" : "scale-100"}`} />
      ))}
      <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className={`${arrow} left-1.5`}>‹</button>
      <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className={`${arrow} right-1.5`}>›</button>
      {/* Au-delà de 8 photos, les points ne tiennent pas dans la vignette sur tablette/ordinateur : compteur à la place. */}
      {n > 8 && <span className="absolute right-1.5 bottom-1.5 z-30 hidden rounded-full bg-night/70 px-2 py-0.5 text-[11px] font-semibold text-sand tabular-nums md:block lg:hidden">{etat.i + 1} / {n}</span>}
      <div className={`absolute inset-x-0 bottom-1.5 z-30 flex justify-center gap-1 ${n > 8 ? "md:hidden lg:flex" : ""}`}>
        {photos.map(([name], k) => (
          <button key={name} type="button" onClick={() => aller(k, k > etat.i ? 1 : -1)} aria-label={`Photo ${k + 1} sur ${n}`} aria-current={k === etat.i} className={`h-1.5 cursor-pointer rounded-full transition-all ${k === etat.i ? "w-3.5 bg-gold" : "w-1.5 bg-sand/60"}`} />
        ))}
      </div>
    </div>
  );
}
