// POST /api/paiement-silylink-notify : notification de Sily Link (paiement confirmé, échoué ou annulé).
// La signature est contrôlée, mais l'état est toujours revérifié auprès de Sily Link avant d'enregistrer :
// le contenu reçu ne suffit jamais à marquer un paiement comme payé.
import { text } from "../lib/payments.mjs";
import { reglages, verifierEtEnregistrer, webhookAuthentique } from "../lib/silylink.mjs";

export default async (req) => {
  if (req.method !== "POST") return text("ok");
  if (!reglages().enabled) return text("non configuré", 503);
  const brut = await req.text();
  let d = {};
  try { d = JSON.parse(brut); } catch { return text("corps invalide", 400); }
  if (!webhookAuthentique(req.headers, brut)) console.warn("[silylink] notification non signée ou signature différente : revérification auprès de Sily Link");
  const orderId = typeof d.order_id === "string" ? d.order_id : d.transaction?.order_id;
  const operationId = typeof d.operation_id === "string" ? d.operation_id : "";
  if (!orderId && !operationId) return text("référence manquante", 400);
  try {
    const v = await verifierEtEnregistrer({ orderId, operationId });
    if (v.status === "unknown") return text("session inconnue", 404);
  } catch (e) {
    console.error("[silylink] vérification impossible", e);
    return text("erreur de vérification", 502); // Sily Link réessaiera
  }
  return text("ok");
};
