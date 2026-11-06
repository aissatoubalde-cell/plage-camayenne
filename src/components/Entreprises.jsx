import { useState } from "react";
import { formules, offres } from "../data/content";
import { Item, Reveal, Stagger } from "./motion";
import { Button, Dots, Hl, Photo, SectionHead, Tag, Wrap, h3Cls } from "./ui";

function Formules() {
  const [active, setActive] = useState(0);
  const f = formules[active];
  return (
    <>
      <div role="tablist" aria-label="Formules" className="-mb-px flex flex-wrap border border-line">
        {formules.map((item, i) => (
          <button
            key={item.n}
            role="tab"
            type="button"
            id={`tab-${i}`}
            aria-selected={i === active}
            aria-controls="panel"
            onClick={() => setActive(i)}
            className="flex-[1_1_45%] cursor-pointer border-r border-b border-line px-3 py-3.5 text-[13px] leading-none font-semibold tracking-[0.04em] text-sand-soft last:border-r-0 aria-selected:bg-gold aria-selected:text-night md:flex-[1_1_auto] md:border-b-0"
          >
            {item.tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel" aria-labelledby={`tab-${active}`} aria-live="polite" className="grid gap-4 border border-line bg-card p-[clamp(22px,3vw,34px)]">
        <span className="text-[12.5px] font-semibold tracking-[0.18em] text-gold">{f.n.toUpperCase()}</span>
        <h3 className="text-[clamp(28px,3vw,38px)] leading-[1.15] font-extrabold tracking-[-0.02em]">{f.title}</h3>
        <p className="text-sand-soft">{f.use}</p>
        <Dots items={f.items} />
        <div className="flex flex-wrap gap-1.5">{f.spaces.map((s) => <Tag key={s}>{s}</Tag>)}</div>
      </div>
    </>
  );
}

export default function Entreprises() {
  return (
    <section id="entreprises" className="py-section">
      <Wrap>
        <SectionHead eyebrow="Entreprises & institutions" title={<>Travailler <Hl>face à la mer</Hl>.</>} lede="Organisation fluide, cadre motivant et résultats concrets : notre engagement pour vos événements professionnels." />
        <div className="grid items-start gap-gutter md:grid-cols-2">
          <Stagger className="min-w-0" step={0.06}>
            {offres.map((o) => (
              <Item key={o.title} className="group grid grid-cols-[84px_1fr] items-center gap-[18px] border-b border-line py-[18px] first:border-t sm:grid-cols-[110px_1fr]">
                <Photo name={o.photo} alt={o.alt} className="aspect-square" />
                <div className="grid min-w-0 gap-[5px]">
                  <h3 className={h3Cls}>{o.title}</h3>
                  <p className="text-[15px] text-sand-soft">{o.text}</p>
                </div>
              </Item>
            ))}
          </Stagger>
          <Reveal className="min-w-0" delay={0.15}>
            <Formules />
            <p className="mt-4 text-[14.5px] text-sand-soft">Chaque formule fait l’objet d’un devis personnalisé selon le nombre de participants, la durée, les espaces choisis et les prestations complémentaires.</p>
            <Button to="/#devis" className="mt-[18px]">Demander un devis</Button>
          </Reveal>
        </div>
      </Wrap>
    </section>
  );
}
