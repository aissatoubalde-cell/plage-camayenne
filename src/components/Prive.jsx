import { privateItems } from "../data/content";
import { Reveal } from "./motion";
import { ScrollEyebrow, ScrollWords } from "./text";
import { Button, Dots, Photo, Wrap } from "./ui";

export default function Prive() {
  return (
    <section id="prive" className="bg-night-2 py-section">
      <Wrap className="group grid items-center gap-gutter md:grid-cols-[1fr_1.1fr]">
        <Reveal><Photo name="prive" alt="Dîner décoré sous chapiteau" className="aspect-[4/3]" /></Reveal>
        <Reveal delay={0.15} className="grid min-w-0 gap-5">
          <ScrollEyebrow>Espace privé · Événements privés</ScrollEyebrow>
          <ScrollWords as="h2" text="Vos grands moments, *au bord de l’eau*." className="text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em]" />
          <ScrollWords as="p" mode="dim" text="Anniversaires, dîners privés, célébrations familiales, réceptions sur invitation. Nous vous accompagnons dans la préparation." className="max-w-[58ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft" />
          <Dots items={privateItems} />
          <div><Button to="/#devis">Préparer mon événement</Button></div>
        </Reveal>
      </Wrap>
    </section>
  );
}
