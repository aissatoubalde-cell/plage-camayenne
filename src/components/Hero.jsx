import { m } from "motion/react";
import { heroCats, stats } from "../data/content";
import { Counter, fadeUp, stagger } from "./motion";
import { Button, Eyebrow, Hl, Wrap } from "./ui";

export default function Hero() {
  return (
    <section id="accueil" className="relative overflow-hidden">
      <picture className="contents">
        <source type="image/webp" srcSet="/img/photos/hero-640.webp 640w, /img/photos/hero.webp 960w" sizes="100vw" />
        <img
          src="/img/photos/hero.jpg"
          srcSet="/img/photos/hero-640.jpg 640w, /img/photos/hero.jpg 960w"
          sizes="100vw"
          width="960"
          height="540"
          alt="Vue aérienne de Camayenne Plage"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.42]"
        />
      </picture>
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-night/35 via-night/55 via-55% to-night" />
      <Wrap className="relative z-10">
        {/* Entrée en cascade au chargement de la page */}
        <m.div variants={stagger(0.15, 0.12)} initial="hidden" animate="show" className="grid gap-7 pt-[clamp(72px,11vw,140px)] pb-[clamp(48px,6vw,72px)]">
          <m.div variants={fadeUp}><Eyebrow>Plage · Loisirs · Événements · Conakry</Eyebrow></m.div>
          <m.h1 variants={fadeUp} className="text-[clamp(52px,9vw,112px)] leading-[0.96] font-extrabold tracking-[-0.035em]">
            Camayenne Plage, <Hl>entre mer</Hl> et nature.
          </m.h1>
          <m.div variants={fadeUp} className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <p className="max-w-[46ch] text-[clamp(17px,1.7vw,19px)] text-sand-soft">
              Un complexe de loisirs et d’événementiel en bord de mer. Venez vous détendre en famille, ou organisez votre séminaire, votre team building ou votre réception face à l’océan.
            </p>
            <div className="flex flex-wrap gap-y-4">
              {stats.map((s, i) => (
                <div key={s.label} className={`flex-[1_1_40%] px-[18px] text-center md:flex-none lg:px-[26px] ${i === 0 ? "border-l-0 pl-0" : "border-l border-line"} ${i === 2 ? "border-l-0 pl-0 md:border-l md:pl-[18px] lg:pl-[26px]" : ""}`}>
                  <Counter value={s.value} className="block text-[clamp(34px,4vw,48px)] leading-none font-bold tracking-[-0.02em] tabular-nums" />
                  <span className="text-[11px] tracking-[0.16em] uppercase text-sand-soft">{s.label}</span>
                </div>
              ))}
            </div>
          </m.div>
          <m.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Button to="/#devis">Organiser un événement</Button>
            <Button to="/#video" variant="line">▶ Voir la vidéo</Button>
          </m.div>
          <m.div variants={fadeUp} className="mt-5 flex flex-wrap items-center gap-x-[22px] gap-y-2.5 border-t border-line pt-[22px] text-[12.5px] font-semibold tracking-[0.16em] uppercase text-sand-soft">
            {heroCats.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-[22px]">
                {i > 0 && <i aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-gold" />}
                {c}
              </span>
            ))}
          </m.div>
        </m.div>
      </Wrap>
    </section>
  );
}
