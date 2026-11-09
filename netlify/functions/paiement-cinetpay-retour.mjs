// /api/paiement-cinetpay-retour : retour du client après la page CinetPay (succès ou échec) → page de confirmation,
// qui interroge ensuite /api/paiement-statut pour afficher l’état réel.
import { readTransactionId, siteUrl } from "../lib/payments.mjs";


export default async (req) => {
  const id = await readTransactionId(req);
  const url = new URL("/confirmation", siteUrl(req));
  url.searchParams.set("provider", "cinetpay");
  if (id) url.searchParams.set("transaction_id", id);
  return Response.redirect(url.toString(), 303);
};
