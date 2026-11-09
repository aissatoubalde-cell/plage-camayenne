// GET /api/paiement-statut?provider=cinetpay&id=… : état réel d’un paiement, pour la page de confirmation.
import { checkCinetPayPayment, json, settings } from "../lib/payments.mjs";


export default async (req) => {
  const u = new URL(req.url);
  const provider = u.searchParams.get("provider"), id = (u.searchParams.get("id") || "").slice(0, 120);
  const s = settings();
  try {
    if (provider === "cinetpay" && id && s.cinetpay.enabled) {
      const c = await checkCinetPayPayment(id);
      return json({ status: c.status, currency: s.cinetpay.currency });
    }
  } catch (e) {
    console.error("[paiement] vérification impossible", e);
  }
  return json({ status: "unknown" });
};
