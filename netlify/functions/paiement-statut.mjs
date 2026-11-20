// GET /api/paiement-statut?provider=cinetpay|silylink&id=… : état réel d’un paiement, pour la page de confirmation.
// Pour Sily Link, un paiement confirmé est aussi enregistré ici (filet de sécurité si la notification n’est pas arrivée).
import { checkCinetPayPayment, json, settings } from "../lib/payments.mjs";
import { reglages, verifierEtEnregistrer } from "../lib/silylink.mjs";


export default async (req) => {
  const u = new URL(req.url);
  const provider = u.searchParams.get("provider"), id = (u.searchParams.get("id") || "").slice(0, 120);
  const s = settings();
  try {
    if (provider === "cinetpay" && id && s.cinetpay.enabled) {
      const c = await checkCinetPayPayment(id);
      return json({ status: c.status, currency: s.cinetpay.currency });
    }
    if (provider === "silylink" && /^CAM-[A-Z0-9-]{4,40}$/.test(id) && reglages().enabled) {
      const v = await verifierEtEnregistrer({ orderId: id });
      return json({ status: v.status, amount: v.status === "paid" ? v.amount : undefined, currency: "GNF" });
    }
  } catch (e) {
    console.error("[paiement] vérification impossible", e);
  }
  return json({ status: "unknown" });
};
