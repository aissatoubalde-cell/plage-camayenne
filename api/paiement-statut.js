// Vercel : /api/paiement-statut — même code que netlify/functions/paiement-statut.mjs
import handler from "../netlify/functions/paiement-statut.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
