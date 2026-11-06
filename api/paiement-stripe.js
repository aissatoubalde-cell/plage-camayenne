// Vercel : /api/paiement-stripe — même code que netlify/functions/paiement-stripe.mjs
import handler from "../netlify/functions/paiement-stripe.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
