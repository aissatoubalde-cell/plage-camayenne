// Vercel : /api/paiement-silylink-notify — même code que netlify/functions/paiement-silylink-notify.mjs
import handler from "../netlify/functions/paiement-silylink-notify.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
