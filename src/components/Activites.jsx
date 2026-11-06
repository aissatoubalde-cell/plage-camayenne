import { activites } from "../data/content";
import { Item, Stagger } from "./motion";
import { Photo, SectionHead, Wrap, h3Cls } from "./ui";

export default function Activites() {
  return (
    <section id="activites" className="bg-night-2 py-section">
      <Wrap>
        <SectionHead eyebrow="Loisirs" title="Jouer, bouger, *se régaler*." lede="Une journée à la plage pour toute la famille, avec des équipes présentes sur le site." />
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activites.map((a) => (
            <Item key={a.title} className="group grid min-w-0 content-start gap-3.5 overflow-hidden rounded-2xl bg-card pb-6 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_-16px_rgba(0,0,0,.7)]">
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
