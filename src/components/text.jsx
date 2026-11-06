import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ease } from "./motion";

/* Animations de texte. Dans `text`, la partie entre astérisques est affichée en or : "Sept espaces, *un seul site*." */

const parse = (text) => {
  const out = [];
  text.split(/(\*[^*]+\*)/).forEach((seg) => {
    if (!seg) return;
    const hl = seg.startsWith("*") && seg.endsWith("*");
    (hl ? seg.slice(1, -1) : seg).split(/(\s+)/).forEach((w) => {
      if (w) out.push({ w, hl, space: /^\s+$/.test(w) });
    });
  });
  return out;
};
const plain = (text) => text.replace(/\*/g, "");

const word = { hidden: { y: "110%", opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.75, ease } } };
const letter = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } };

/** Titre dont chaque mot glisse vers le haut. `inView` : au défilement (défaut) ou dès le chargement. */
export function SplitWords({ text, as = "span", className = "", delay = 0, step = 0.07, inView = true, amount = 0.5 }) {
  const Root = m[as];
  const trigger = inView ? { whileInView: "show", viewport: { once: true, amount } } : { animate: "show" };
  return (
    <Root className={className} initial="hidden" {...trigger} variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }} aria-label={plain(text)}>
      {parse(text).map((x, i) =>
        x.space ? (
          " "
        ) : (
          <span key={i} aria-hidden="true" className="-mb-[0.12em] -mt-[0.12em] inline-block overflow-hidden pt-[0.12em] pb-[0.12em] align-bottom">
            <m.span variants={word} className={`inline-block ${x.hl ? "text-gold" : ""}`}>{x.w}</m.span>
          </span>
        ),
      )}
    </Root>
  );
}

/** Texte qui s’écrit lettre par lettre (signature, accroche). */
export function SplitChars({ text, as = "span", className = "", delay = 0, step = 0.035, amount = 0.6 }) {
  const Root = m[as];
  return (
    <Root className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount }} variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }} aria-label={text}>
      {[...text].map((c, i) => (
        <m.span key={i} aria-hidden="true" variants={letter} className="inline-block whitespace-pre">{c}</m.span>
      ))}
    </Root>
  );
}

/** Sur-titre doré : fondu avec resserrement des lettres. */
export function Eyebrow({ children, className = "", inView = true, delay = 0 }) {
  const trigger = inView ? { whileInView: { opacity: 1, letterSpacing: "0.18em" }, viewport: { once: true, amount: 0.8 } } : { animate: { opacity: 1, letterSpacing: "0.18em" } };
  return (
    <m.p initial={{ opacity: 0, letterSpacing: "0.34em" }} {...trigger} transition={{ duration: 0.9, ease, delay }} className={`text-[12.5px] font-semibold uppercase text-gold ${className}`}>
      {children}
    </m.p>
  );
}

/* ---------- Animations liées au défilement : la progression suit la position de l’élément à l’écran ---------- */

function ScrollWord({ i, n, progress, mode, hl, reduced, children }) {
  const start = (i / Math.max(n, 1)) * 0.75;
  const end = Math.min(1, start + 0.25);
  const opacity = useTransform(progress, [start, end], mode === "dim" ? [0.16, 1] : [0, 1]);
  const y = useTransform(progress, [start, end], ["105%", "0%"]);
  const color = hl ? "text-gold" : "";
  if (reduced) return <span className={color}>{children}</span>;
  if (mode === "dim") return <m.span style={{ opacity }} className={`inline-block ${color}`}>{children}</m.span>;
  return (
    <span className="-mb-[0.12em] -mt-[0.12em] inline-block overflow-hidden pt-[0.12em] pb-[0.12em] align-bottom">
      <m.span style={{ opacity, y }} className={`inline-block ${color}`}>{children}</m.span>
    </span>
  );
}

/**
 * Texte révélé mot par mot au rythme du défilement. `mode` : "slide" (titres, les mots montent) ou
 * "dim" (paragraphes, les mots s’éclaircissent). `offset` : positions de l’élément dans la fenêtre
 * entre lesquelles l’animation va de 0 à 100 %.
 */
export function ScrollWords({ text, as = "span", className = "", mode = "slide", offset = ["start 92%", "start 45%"] }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const words = parse(text);
  const n = words.filter((w) => !w.space).length;
  let k = 0;
  const Tag = as;
  return (
    <Tag ref={ref} className={className} aria-label={plain(text)}>
      {words.map((x, i) =>
        x.space ? (
          " "
        ) : (
          <span key={i} aria-hidden="true" className="contents">
            <ScrollWord i={k++} n={n} progress={scrollYProgress} mode={mode} hl={x.hl} reduced={reduced}>{x.w}</ScrollWord>
          </span>
        ),
      )}
    </Tag>
  );
}

/** Sur-titre doré lié au défilement : fondu et resserrement des lettres. */
export function ScrollEyebrow({ children, className = "" }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "start 60%"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ["0.34em", "0.18em"]);
  return (
    <m.p ref={ref} style={reduced ? { letterSpacing: "0.18em" } : { opacity, letterSpacing }} className={`text-[12.5px] font-semibold uppercase text-gold ${className}`}>
      {children}
    </m.p>
  );
}
