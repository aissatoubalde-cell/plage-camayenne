// Vercel : /api/paiement-silylink — même code que netlify/functions/paiement-silylink.mjs
import handler from "../netlify/functions/paiement-silylink.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
