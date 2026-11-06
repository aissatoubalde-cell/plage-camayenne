import { faq } from "../data/content";
import { Hl, SectionHead, Wrap } from "./ui";

export default function Faq() {
  return (
    <section id="faq" className="py-section">
      <Wrap>
        <SectionHead eyebrow="Questions fréquentes" title={<>Bon <Hl>à savoir</Hl>.</>} />
        <div className="max-w-[900px] border-t border-line">
          {faq.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="relative cursor-pointer list-none py-[22px] pr-11 text-[clamp(17px,1.8vw,20px)] font-bold tracking-[-0.01em] after:absolute after:top-4 after:right-1.5 after:text-[28px] after:leading-none after:font-normal after:text-gold after:content-['+'] group-open:after:content-['–']">
                {item.q}
              </summary>
              <p className="max-w-[68ch] pb-[22px] text-sand-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
