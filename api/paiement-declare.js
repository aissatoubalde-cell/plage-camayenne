// Vercel : /api/paiement-declare — même code que netlify/functions/paiement-declare.mjs
import handler from "../netlify/functions/paiement-declare.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
