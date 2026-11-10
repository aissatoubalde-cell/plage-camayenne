// POST /api/demande : enregistre une demande de devis envoyée par le formulaire du site (src/components/DevisForm.jsx).
// L'e-mail à l'équipe part toujours par Web3Forms, côté navigateur ; ici, on garde la demande pour la page /admin.
import { ajouterDemande, urlBase } from "../lib/demandes.mjs";

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
  if (d.botcheck) return json({ ok: true }); // piège à robots du formulaire
  try {
    const r = await ajouterDemande(d);
    if (r.erreur) return json(r, r.erreur === "limite" ? 429 : 400);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ erreur: "base" }, 500);
  }
};
