// POST /api/paiement-cinetpay : crée la transaction Orange Money / MTN et renvoie l’URL de paiement CinetPay.
import { createCinetPayPayment, json, parsePaymentInput, readJson, settings, siteUrl } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  const s = settings().cinetpay;
  if (!s.enabled) return json({ error: "Le paiement par Mobile Money n’est pas encore activé." }, 503);
  const parsed = parsePaymentInput(await readJson(req), s.currency);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const base = siteUrl(req);
  try {
    const { url } = await createCinetPayPayment(parsed.data, { notifyUrl: `${base}/api/paiement-cinetpay-notify`, returnUrl: `${base}/api/paiement-cinetpay-retour` });
    return json({ url });
  } catch (e) {
    console.error("[cinetpay] création impossible", e);
    return json({ error: "Impossible de démarrer le paiement pour le moment. Réessayez ou contactez-nous." }, 502);
  }
};
