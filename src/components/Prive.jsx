import { privateItems } from "../data/content";
import { Reveal } from "./motion";
import { Button, Dots, Eyebrow, H2, Hl, Photo, Wrap } from "./ui";

export default function Prive() {
  return (
    <section id="prive" className="bg-night-2 py-section">
      <Wrap className="group grid items-center gap-gutter md:grid-cols-[1fr_1.1fr]">
        <Reveal><Photo name="prive" alt="Dîner décoré sous chapiteau" className="aspect-[4/3]" /></Reveal>
        <Reveal delay={0.15} className="grid min-w-0 gap-5">
          <Eyebrow>Espace privé · Événements privés</Eyebrow>
          <H2>Vos grands moments, <Hl>au bord de l’eau</Hl>.</H2>
          <p className="max-w-[58ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft">Anniversaires, dîners privés, célébrations familiales, réceptions sur invitation. Nous vous accompagnons dans la préparation.</p>
          <Dots items={privateItems} />
          <div><Button to="/#devis">Préparer mon événement</Button></div>
        </Reveal>
      </Wrap>
    </section>
  );
}
