// Formulaire de carte Stripe (numéro, titulaire, expiration, CVC, Apple Pay / Google Pay) affiché dans notre page.
// Les données de carte sont saisies dans un cadre sécurisé de Stripe : elles ne transitent jamais par notre site.
import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

const cache = new Map();
const stripeFor = (key) => {
  if (!cache.has(key)) cache.set(key, loadStripe(key, { locale: "fr" }));
  return cache.get(key);
};

export default function CardCheckout({ publishableKey, clientSecret }) {
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);
  return (
    <div className="overflow-hidden rounded-[2px] bg-white">
      <EmbeddedCheckoutProvider key={clientSecret} stripe={stripeFor(publishableKey)} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
