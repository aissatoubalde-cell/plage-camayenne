// Vercel : /api/paiement-cinetpay-retour — même code que netlify/functions/paiement-cinetpay-retour.mjs
import handler from "../netlify/functions/paiement-cinetpay-retour.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
