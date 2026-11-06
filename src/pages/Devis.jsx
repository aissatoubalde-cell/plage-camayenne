import DevisForm from "../components/DevisForm";
import { Reveal } from "../components/motion";
import { Eyebrow as AnimatedEyebrow, SplitWords } from "../components/text";
import { Button, Wrap } from "../components/ui";
import { Icon } from "../components/ui/icons";
import { site, whatsappLink } from "../config";
import { faq } from "../data/content";
import { useTitle } from "../hooks";

const steps = [
  ["Décrivez votre événement", "Type, date, nombre de participants, espaces et services souhaités : deux minutes suffisent."],
  ["Nous vous répondons sous 48 h", "Notre équipe vous rappelle ou vous écrit avec une première proposition."],
  ["Visite et devis personnalisé", "Vous découvrez les espaces sur place, puis vous recevez votre devis détaillé."],
  ["Validation et acompte", "Vous confirmez, réglez l’acompte en ligne ou sur place, et votre date est bloquée."],
];

export default function Devis() {
  useTitle("Demander un devis · Camayenne Plage");
  const questions = faq.filter((q) => ["Quels sont vos tarifs ?", "Peut-on privatiser le site ?", "Peut-on visiter avant de réserver ?"].includes(q.q));

  return (
    <main>
      <section className="py-section">
        <Wrap className="grid items-start gap-gutter lg:grid-cols-[0.9fr_1.3fr]">
          <div className="min-w-0">
            <div className="mb-8 grid gap-[18px]">
              <AnimatedEyebrow inView={false}>Demande de devis</AnimatedEyebrow>
              <SplitWords as="h1" inView={false} delay={0.2} text="Parlez-nous *de votre projet*." className="text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em]" />
              <p className="max-w-[48ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft">Séminaire, team building, anniversaire ou réception : décrivez votre événement, nous nous occupons du reste.</p>
            </div>

            <Reveal amount={0.1}>
              <ol className="border-t border-line">
                {steps.map(([t, d], i) => (
                  <li key={t} className="grid grid-cols-[44px_1fr] gap-3 border-b border-line py-4 text-[15px] text-sand-soft">
                    <span className="font-bold text-gold tabular-nums">0{i + 1}</span>
                    <div><b className="mb-0.5 block text-sand">{t}</b>{d}</div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal amount={0.1} className="mt-6 grid gap-4 rounded-2xl bg-card p-6 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)]">
              <b className="text-[17px] font-bold tracking-[-0.01em]">Vous préférez en parler de vive voix ?</b>
              <div className="flex flex-wrap gap-2.5">
                <Button href={whatsappLink("Bonjour Camayenne Plage, je souhaite un devis pour un événement.")} target="_blank" rel="noopener noreferrer" variant="line" className="rounded-full px-5 py-3.5"><Icon name="whatsapp" className="h-4 w-4 text-gold" />WhatsApp</Button>
                <Button href={`tel:${site.phoneE164}`} variant="line" className="rounded-full px-5 py-3.5"><Icon name="phone" className="h-4 w-4 text-gold" />{site.phone}</Button>
              </div>
              <p className="text-[13.5px] text-sand-soft">Du lundi au dimanche. Visite du site sur rendez-vous.</p>
            </Reveal>

            <Reveal amount={0.1} className="mt-6 hidden lg:block">
              <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gold">Bon à savoir</span>
              <ul className="mt-3 grid gap-3">
                {questions.map((q) => (
                  <li key={q.q} className="text-[14.5px] text-sand-soft"><b className="block text-sand">{q.q}</b>{q.a}</li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal amount={0.05} delay={0.1} className="min-w-0"><DevisForm /></Reveal>
        </Wrap>
      </section>
    </main>
  );
}
