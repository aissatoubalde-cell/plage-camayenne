// POST /api/paiement-cinetpay : crée la transaction CinetPay (Orange Money ; carte si activée) et renvoie l’URL de paiement.
import { createCinetPayPayment, json, parsePaymentInput, readJson, settings, siteUrl } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  if (!settings().cinetpay.enabled) return json({ error: "Le paiement en ligne n’est pas encore activé." }, 503);
  const parsed = parsePaymentInput(await readJson(req));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  try {
    const { url } = await createCinetPayPayment(parsed.data, { base: siteUrl(req) });
    return json({ url });
  } catch (e) {
    console.error("[cinetpay] création impossible", e);
    return json({ error: "Impossible de démarrer le paiement pour le moment. Réessayez ou contactez-nous." }, 502);
  }
};
