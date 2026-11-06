import { useState } from "react";
import { site } from "../config";
import { Picture, Wrap } from "./ui";

/* Le lecteur Facebook n’est chargé qu’au clic : la page reste légère, aucun script tiers ne part avant. */
export default function Video() {
  const [playing, setPlaying] = useState(false);
  const embed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(site.facebookVideo)}&show_text=false&autoplay=true`;

  return (
    <section id="video" className="pb-[clamp(56px,8vw,96px)]">
      <Wrap>
        <div className="group relative aspect-video overflow-hidden border border-line bg-card">
          {playing ? (
            <iframe src={embed} title="Vidéo de présentation de Camayenne Plage" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 h-full w-full border-0 bg-black" />
          ) : (
            <>
              <Picture name="g1" alt="" imgClass="h-full w-full object-cover opacity-55 transition-[opacity,transform] duration-[600ms] group-hover:scale-[1.03] group-hover:opacity-70" />
              <button type="button" onClick={() => setPlaying(true)} aria-label="Lire la vidéo" className="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0">
                <span aria-hidden="true" className="absolute top-1/2 left-1/2 grid aspect-square w-[clamp(72px,9vw,104px)] -translate-1/2 place-items-center rounded-full bg-gold before:ml-1.5 before:border-y-[16px] before:border-l-[26px] before:border-y-transparent before:border-l-night before:content-['']" />
              </button>
              <span className="pointer-events-none absolute right-0 bottom-0 left-0 flex flex-wrap justify-between gap-2 bg-linear-to-b from-night/0 to-night/90 px-[22px] py-[18px] font-semibold">
                Vivez Camayenne Plage en vidéo
                <a href={site.facebookVideo} target="_blank" rel="noopener noreferrer" className="pointer-events-auto text-[13px] tracking-[0.14em] uppercase text-gold no-underline">Regarder sur Facebook ↗</a>
              </span>
            </>
          )}
        </div>
      </Wrap>
    </section>
  );
}
