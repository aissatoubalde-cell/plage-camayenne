import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { faq } from "../data/content";
import { ease, Reveal } from "./motion";
import { SectionHead, Wrap } from "./ui";

export default function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="py-section">
      <Wrap>
        <SectionHead eyebrow="Questions fréquentes" title="Bon *à savoir*." />
        <Reveal amount={0.1} className="max-w-[900px] border-t border-line">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-line">
                <h3 className="m-0">
                  <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="relative w-full cursor-pointer py-[22px] pr-11 text-left text-[clamp(17px,1.8vw,20px)] leading-[1.15] font-bold tracking-[-0.01em] text-sand">
                    {item.q}
                    <m.svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease }} className="absolute top-[calc(50%-12px)] right-1.5 h-6 w-6 text-gold">
                      <path d="m6 9 6 6 6-6" />
                    </m.svg>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div key="answer" id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                      <p className="max-w-[68ch] pb-[22px] text-sand-soft">{item.a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </Wrap>
    </section>
  );
}
