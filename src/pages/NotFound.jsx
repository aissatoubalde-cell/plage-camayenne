import { Button, Callout, Eyebrow, Wrap } from "../components/ui";
import { useTitle } from "../hooks";

export default function NotFound() {
  useTitle("Page introuvable · Camayenne Plage");
  return (
    <main>
      <section className="py-section">
        <Wrap className="max-w-[760px]">
          <Callout>
            <Eyebrow>Erreur 404</Eyebrow>
            <h1 className="text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.02em]">Cette page n’existe pas.</h1>
            <p className="text-sand-soft">Le lien est peut-être erroné ou la page a été déplacée.</p>
            <div><Button to="/">Retour à l’accueil</Button></div>
          </Callout>
        </Wrap>
      </section>
    </main>
  );
}
