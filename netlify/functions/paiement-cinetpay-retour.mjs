// /api/paiement-cinetpay-retour : retour du client après la page CinetPay (GET ou POST) → page de confirmation.
import { readTransactionId, siteUrl } from "../lib/payments.mjs";


export default async (req) => {
  const fromQuery = new URL(req.url).searchParams.get("transaction_id");
  const id = req.method === "POST" ? (await readTransactionId(req)) ?? fromQuery : fromQuery;
  const url = new URL("/confirmation", siteUrl(req));
  url.searchParams.set("provider", "cinetpay");
  if (id) url.searchParams.set("transaction_id", id);
  return Response.redirect(url.toString(), 303);
};
