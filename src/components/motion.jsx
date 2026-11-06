import { m, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/* Briques d’animation (Motion). Les animations respectent le réglage « réduire les animations » du visiteur
   grâce à <MotionConfig reducedMotion="user"> dans App.jsx. */

export const ease = [0.22, 1, 0.36, 1];

/** Apparition en fondu + léger glissement vers le haut. `custom` = délai en secondes. */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease, delay } }),
};

/** Conteneur qui enchaîne ses enfants (variants fadeUp) les uns après les autres. */
export const stagger = (delayChildren = 0, staggerChildren = 0.08) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

/** Élément qui apparaît quand il entre à l’écran (une seule fois). */
export function Reveal({ as = "div", delay = 0, amount = 0.2, children, ...rest }) {
  const Tag = m[as];
  return (
    <Tag variants={fadeUp} custom={delay} initial="hidden" whileInView="show" viewport={{ once: true, amount }} {...rest}>
      {children}
    </Tag>
  );
}

/** Conteneur dont les enfants `<Item>` apparaissent en cascade à l’entrée à l’écran. */
export function Stagger({ as = "div", delay = 0, step = 0.08, amount = 0.15, children, ...rest }) {
  const Tag = m[as];
  return (
    <Tag variants={stagger(delay, step)} initial="hidden" whileInView="show" viewport={{ once: true, amount }} {...rest}>
      {children}
    </Tag>
  );
}

export function Item({ as = "div", children, ...rest }) {
  const Tag = m[as];
  return <Tag variants={fadeUp} {...rest}>{children}</Tag>;
}

/** Compteur qui défile jusqu’à sa valeur quand il devient visible (requestAnimationFrame, sans dépendance). */
export function Counter({ value, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const n = Number(value);
  const start = n > 100 ? n - 60 : 0;
  const [shown, setShown] = useState(reduced ? n : start);

  useEffect(() => {
    if (!inView || reduced) return;
    const duration = 1400;
    let raf, t0;
    const tick = (t) => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (n - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, n, start]);

  return <b ref={ref} className={className}>{shown}</b>;
}
