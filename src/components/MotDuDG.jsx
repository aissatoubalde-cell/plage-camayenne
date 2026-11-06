import { Eyebrow, Hl, Wrap } from "./ui";

export default function MotDuDG() {
  return (
    <section id="mot-du-dg" className="bg-night-2 py-section">
      <Wrap className="grid items-start gap-[clamp(32px,6vw,80px)] lg:grid-cols-[1.25fr_1fr]">
        <div className="grid min-w-0 gap-[22px] [&>p]:max-w-[62ch] [&>p]:text-sand-soft">
          <Eyebrow>Mot du Directeur Général</Eyebrow>
          <h2 className="text-[clamp(30px,4vw,48px)] leading-[1.02] font-extrabold tracking-[-0.025em]">Bienvenue à <Hl>Camayenne Plage</Hl>.</h2>
          <p>Pendant longtemps, Conakry a manqué d’espaces de loisirs ouverts, sûrs et adaptés aux familles. Camayenne Plage est née de la volonté de l’État guinéen de répondre à ce besoin. Ce site du littoral de Dixinn a été réhabilité et aménagé sous l’impulsion du Président de la République, S.E.M Mamadi DOUMBOUYA, puis rendu aux populations le 1<sup>er</sup> janvier 2023. Il traduit une conviction : le bien-être des citoyens fait partie intégrante de l’action publique, à commencer par celui des enfants et des jeunes.</p>
          <p>Les enfants sont au cœur de notre projet. Notre aire de jeux sécurisée a été pensée pour eux. Ils peuvent s’y amuser librement, en plein air, sous le regard serein de leurs parents. Autour d’eux, les terrains de beach-soccer, de beach-volley et de basket, l’espace fitness, le jardin ombragé et la restauration permettent à toutes les générations de se retrouver.</p>
          <p>Camayenne Plage accueille aussi vos événements professionnels, culturels et familiaux. Entreprises, institutions, associations et familles y trouvent un cadre ouvert sur la mer, propice aux rencontres et au partage.</p>
          <p>Gérer un espace public est une responsabilité. Nous nous engageons à en garantir la propreté, la sécurité et la qualité d’accueil, et à améliorer sans cesse nos infrastructures et nos services. Ce bien commun appartient à tous. Nous comptons sur chaque visiteur pour en prendre soin et le préserver pour les générations futures.</p>
          <p>Aux côtés du parc urbain de Conakry et du lac de Gbassicolo, Camayenne Plage contribue à l’image d’une Guinée moderne, accueillante et fière de son identité.</p>
          <p>Je remercie les autorités pour leur confiance, nos partenaires pour leur accompagnement et nos visiteurs pour leur fidélité. Toute notre équipe se réjouit de vous accueillir.</p>
          <p><strong className="text-sand">Bienvenue chez vous, à Camayenne Plage.</strong></p>
          <div className="grid gap-0.5 border-l-2 border-gold pl-[18px]">
            <small className="text-xs text-sand-soft">Le Directeur Général</small>
            <em className="text-[13.5px] text-gold not-italic">Camayenne Plage</em>
            <b className="text-xl font-bold">Mamadou Oury Diallo</b>
          </div>
        </div>
        {/* Quand la photo du DG est disponible : remplacer « DG » par <img src="/img/photos/dg.jpg" alt="…" className="h-full w-full object-cover" /> */}
        <div aria-label="Photo du Directeur Général" className="grid aspect-[4/5] w-full max-w-[320px] place-items-center overflow-hidden border border-line bg-card text-[110px] font-extrabold tracking-[-0.04em] text-gold lg:sticky lg:top-[110px] lg:max-w-[440px] lg:justify-self-end">DG</div>
      </Wrap>
    </section>
  );
}
