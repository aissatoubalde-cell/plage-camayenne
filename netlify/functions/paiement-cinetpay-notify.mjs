// /api/paiement-cinetpay-notify : appelé par CinetPay quand le paiement change d’état. On revérifie toujours
// la transaction auprès de CinetPay avant de l’enregistrer (jamais confiance au contenu reçu).
import { checkCinetPayPayment, readTransactionId, recordPayment, settings, text } from "../lib/payments.mjs";


export default async (req) => {
  if (req.method === "GET") return text("ok");
  const s = settings().cinetpay;
  if (!s.enabled) return text("non configuré", 503);
  const id = await readTransactionId(req);
  if (!id) return text("transaction_id manquant", 400);
  try {
    const c = await checkCinetPayPayment(id);
    await recordPayment({ provider: "cinetpay", transactionId: id, status: c.status === "ACCEPTED" ? "paid" : c.status === "REFUSED" ? "failed" : "pending", amount: c.amount ?? 0, currency: c.currency ?? s.currency, method: c.method, reference: c.reference, customer: {} });
  } catch (e) {
    console.error("[cinetpay] vérification impossible", e);
    return text("erreur de vérification", 502);
  }
  return text("ok");
};
