import { espaces } from "../data/content";
import { Reveal } from "./motion";
import { Photo, SectionHead, Wrap } from "./ui";

export default function Espaces() {
  return (
    <section id="espaces" className="py-section">
      <Wrap>
        <SectionHead eyebrow="Espaces de location" title="Sept espaces, *un seul site*." lede="Chaque espace se loue seul ou se combine avec d’autres, à la demi-journée, à la journée ou en soirée." />
        <div className="border-t border-line">
          {espaces.map((e, i) => (
            <Reveal as="article" key={e.n} delay={Math.min(i, 3) * 0.08} amount={0.3} className="group grid grid-cols-[36px_1fr] items-center gap-x-3.5 gap-y-1.5 border-b border-line py-[22px] md:grid-cols-[44px_120px_1fr] md:gap-6 lg:grid-cols-[64px_168px_1fr_1.1fr]">
              <span className="row-start-1 self-start text-lg font-bold text-gold tabular-nums md:self-center md:text-2xl">{e.n}</span>
              <Photo name={e.photo} alt={e.alt} className="col-start-2 aspect-video md:aspect-[3/2]" />
              <h3 className="col-start-2 text-[clamp(20px,2.2vw,26px)] leading-[1.15] font-bold tracking-[-0.01em] md:col-start-3">{e.title}</h3>
              <p className="col-start-2 max-w-[44ch] text-[15.5px] text-sand-soft md:col-start-3 lg:col-start-4 lg:justify-self-end lg:text-right">{e.text}</p>
            </Reveal>
          ))}
        </div>
        <Reveal as="p" className="mt-[18px] text-[14.5px] text-sand-soft">Tarifs sur devis, selon la durée, le nombre de participants et les prestations choisies.</Reveal>
      </Wrap>
    </section>
  );
}
