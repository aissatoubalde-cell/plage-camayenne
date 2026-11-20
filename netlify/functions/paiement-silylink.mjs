// POST /api/paiement-silylink : démarre un paiement en ligne Sily Link (Orange Money, MTN MoMo) à partir du
// formulaire de la page Paiement, et renvoie l'adresse de la page de paiement sécurisée.
import { amountBounds, json, normalizePhone, readJson, siteUrl } from "../lib/payments.mjs";
import { commencerPaiementEnLigne, estEmail, noterOperation, texte, urlBase } from "../lib/demandes.mjs";
import { creerSession, reglages } from "../lib/silylink.mjs";

const reference = () => `CAM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  if (!reglages().enabled || !urlBase()) return json({ error: "Le paiement en ligne n’est pas encore activé." }, 503);
  const b = (await readJson(req)) || {};
  const p = {
    name: texte(b.name, 80), email: texte(b.email, 120), phone: normalizePhone(texte(b.phone, 30)),
    reference: texte(b.reference, 40), amount: Number(b.amount),
  };
  const { min, max } = amountBounds();
  if (p.name.length < 2) return json({ error: "Indiquez votre nom." }, 400);
  if (!estEmail(p.email)) return json({ error: "Indiquez un e-mail valide." }, 400);
  if (!p.phone) return json({ error: "Indiquez votre numéro de téléphone." }, 400);
  if (!Number.isInteger(p.amount) || p.amount < min || p.amount > max) return json({ error: "Vérifiez le montant de l’acompte." }, 400);
  p.orderId = reference();
  try {
    const debut = await commencerPaiementEnLigne({ ...p, prestataire: "silylink" });
    if (debut.erreur) return json({ error: "Trop de paiements en cours. Réessayez dans quelques minutes." }, 429);
    const { url, operationId } = await creerSession(p, siteUrl(req));
    if (operationId) await noterOperation(p.orderId, operationId).catch(() => {});
    return json({ url, reference: p.orderId });
  } catch (e) {
    console.error("[silylink] création impossible", e);
    return json({ error: "Impossible de démarrer le paiement pour le moment. Réessayez ou payez par transfert Orange Money." }, 502);
  }
};
