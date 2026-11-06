// Champs de carte Stripe affichés dans notre formulaire : Apple Pay / Google Pay, numéro de carte, expiration, code de sécurité.
// La saisie se fait dans des cadres sécurisés de Stripe : les données de carte ne transitent jamais par notre site.
import { Component, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const ZERO_DECIMAL = new Set(["gnf", "xof", "xaf", "jpy"]);
const cache = new Map();
const stripeFor = (key) => {
  if (!cache.has(key)) cache.set(key, loadStripe(key, { locale: "fr" }));
  return cache.get(key);
};

const appearance = {
  theme: "night",
  variables: { colorPrimary: "#f2a33a", colorBackground: "#06181c", colorText: "#f4ecdf", colorTextSecondary: "#a8bcb8", colorDanger: "#e06b5c", fontFamily: "\"Helvetica Neue\", Arial, sans-serif", borderRadius: "2px", spacingUnit: "4px" },
  rules: { ".Input": { border: "1px solid rgba(244,236,223,.13)", padding: "14px" }, ".Label": { textTransform: "uppercase", letterSpacing: ".14em", fontSize: "12px", fontWeight: "700" } },
};

/** Expose au parent, via onReady, la fonction pay({ getClientSecret, billing, returnUrl }). */
function Inner({ onReady }) {
  const stripe = useStripe();
  const elements = useElements();
  useEffect(() => {
    if (!stripe || !elements) return;
    onReady(async ({ getClientSecret, billing, returnUrl }) => {
      const { error: invalid } = await elements.submit();
      if (invalid) throw new Error(invalid.message || "Vérifiez les informations de votre carte.");
      const clientSecret = await getClientSecret();
      const { error } = await stripe.confirmPayment({
        elements, clientSecret,
        confirmParams: { return_url: returnUrl, payment_method_data: { billing_details: billing } },
      });
      // Sans erreur, le navigateur part vers returnUrl (après 3-D Secure si la banque le demande).
      if (error) throw new Error(error.message || "Le paiement n’a pas abouti.");
    });
  }, [stripe, elements, onReady]);
  return <PaymentElement options={{ layout: { type: "accordion", defaultCollapsed: false, radios: "always", spacedAccordionItems: false }, fields: { billingDetails: { name: "never" } }, wallets: { link: "never" } }} />;
}

// Si Stripe ne peut pas s’afficher (clé invalide, réseau…), on garde le reste de la page utilisable.
class Guard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { console.error("[stripe] champs de carte indisponibles", e); }
  render() {
    return this.state.failed
      ? <p className="border border-danger px-3.5 py-3 text-sm text-danger">Le paiement par carte est momentanément indisponible. Choisissez Orange Money ou contactez-nous.</p>
      : this.props.children;
  }
}

export default function CardFields(props) {
  return <Guard><Fields {...props} /></Guard>;
}

function Fields({ publishableKey, amount, currency, onReady }) {
  const cur = currency.toLowerCase();
  const minor = Math.max(1, ZERO_DECIMAL.has(cur) ? Math.round(amount) : Math.round(amount * 100));
  return (
    <Elements stripe={stripeFor(publishableKey)} options={{ mode: "payment", amount: minor, currency: cur, locale: "fr", appearance }}>
      <Inner onReady={onReady} />
    </Elements>
  );
}
