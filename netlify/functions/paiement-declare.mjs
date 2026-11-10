// POST /api/paiement-declare : acompte Orange Money déclaré par le client sur la page Paiement, en mode manuel
// (tant que CinetPay n'est pas configuré). Le paiement arrive dans /admin → Paiements, statut « En attente »,
// avec le numéro de transaction du SMS Orange Money ; l'équipe le vérifie puis le passe à « Confirmé ».
import { declarerPaiement, urlBase } from "../lib/demandes.mjs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export default async (request) => {
  if (request.method !== "POST") return json({ erreur: "methode" }, 405);
  if (!urlBase()) return json({ erreur: "non-configure" }, 503);
  let d;
  try {
    d = await request.json();
  } catch {
    return json({ erreur: "requete" }, 400);
  }
  try {
    const r = await declarerPaiement(d);
    if (r.erreur) return json(r, r.erreur === "limite" ? 429 : r.erreur === "doublon" ? 409 : 400);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ erreur: "base" }, 500);
  }
};
