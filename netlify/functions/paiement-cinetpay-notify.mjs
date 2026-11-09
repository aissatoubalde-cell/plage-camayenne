// /api/paiement-cinetpay-notify : appelé par CinetPay quand le paiement atteint un état final. On revérifie toujours
// la transaction auprès de CinetPay avant de l’enregistrer (jamais confiance au contenu reçu).
import { checkCinetPayPayment, readTransactionId, recordPayment, settings, text } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method === "GET") return text("ok");
  const s = settings().cinetpay;
  if (!s.enabled) return text("non configuré", 503);
  const u = new URL(req.url);
  const id = await readTransactionId(req);
  if (!id) return text("identifiant de transaction manquant", 400);
  try {
    const c = await checkCinetPayPayment(id);
    if (c.status === "unknown") return text("transaction inconnue", 404);
    await recordPayment({ provider: "cinetpay", transactionId: c.merchantId || u.searchParams.get("ref") || id, cinetpayId: c.cinetpayId, status: c.status, amount: Number(u.searchParams.get("amount")) || 0, currency: s.currency, customer: c.user });
  } catch (e) {
    console.error("[cinetpay] vérification impossible", e);
    return text("erreur de vérification", 502);
  }
  return text("ok");
};
