// Vercel : /api/paiement-config — même code que netlify/functions/paiement-config.mjs
import handler from "../netlify/functions/paiement-config.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
