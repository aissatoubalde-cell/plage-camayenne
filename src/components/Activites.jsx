import { activites } from "../data/content";
import { Item, Stagger } from "./motion";
import { Hl, Photo, SectionHead, Wrap, h3Cls } from "./ui";

export default function Activites() {
  return (
    <section id="activites" className="bg-night-2 py-section">
      <Wrap>
        <SectionHead eyebrow="Loisirs" title={<>Jouer, bouger, <Hl>se régaler</Hl>.</>} lede="Une journée à la plage pour toute la famille, avec des équipes présentes sur le site." />
        <Stagger className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {activites.map((a) => (
            <Item key={a.title} className="group grid min-w-0 content-start gap-3.5 bg-night pb-[22px]">
              <Photo name={a.photo} alt={a.alt} position={a.position} className="aspect-square" />
              <h3 className={`${h3Cls} px-5`}>{a.title}</h3>
              <p className="px-5 text-[15px] text-sand-soft">{a.text}</p>
            </Item>
          ))}
        </Stagger>
      </Wrap>
    </section>
  );
}
