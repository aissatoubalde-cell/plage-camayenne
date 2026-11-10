import { useState } from "react";
import { Picture, Wrap } from "./ui";

/* La vidéo (hébergée avec le site) n’est chargée qu’au clic : la page reste légère tant qu’on ne la lance pas. */
export default function Video() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="video" className="pb-[clamp(56px,8vw,96px)]">
      <Wrap>
        <div className="group relative aspect-video overflow-hidden border border-line bg-card">
          {playing ? (
            <video src="/video/camayenne.mp4" poster="/img/photos/video-cover.jpg" autoPlay controls playsInline preload="auto" aria-label="Vidéo de présentation de Camayenne Plage" className="absolute inset-0 h-full w-full bg-black object-contain" />
          ) : (
            <>
              <Picture name="video-cover" alt="" imgClass="h-full w-full object-cover opacity-70 transition-[opacity,transform] duration-[600ms] group-hover:scale-[1.03] group-hover:opacity-85" />
              <button type="button" onClick={() => setPlaying(true)} aria-label="Lire la vidéo" className="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0">
                <span aria-hidden="true" className="absolute top-1/2 left-1/2 grid aspect-square w-[clamp(72px,9vw,104px)] -translate-1/2 place-items-center rounded-full bg-gold before:ml-1.5 before:border-y-[16px] before:border-l-[26px] before:border-y-transparent before:border-l-night before:content-['']" />
              </button>
              <span className="pointer-events-none absolute right-0 bottom-0 left-0 bg-linear-to-b from-night/0 to-night/90 px-[22px] py-[18px] font-semibold">
                Vivez Camayenne Plage en vidéo
              </span>
            </>
          )}
        </div>
      </Wrap>
    </section>
  );
}
