import Activites from "../components/Activites";
import Entreprises from "../components/Entreprises";
import Espaces from "../components/Espaces";
import Faq from "../components/Faq";
import Galerie from "../components/Galerie";
import Hero from "../components/Hero";
import Infos from "../components/Infos";
import MotDuDG from "../components/MotDuDG";
import Prive from "../components/Prive";
import Video from "../components/Video";
import { useTitle } from "../hooks";

export default function Home() {
  useTitle("Camayenne Plage – Plage, loisirs et événements à Conakry");
  return (
    <main>
      <Hero /><Video /><MotDuDG /><Espaces /><Activites /><Entreprises /><Prive /><Galerie /><Infos /><Faq />
    </main>
  );
}
