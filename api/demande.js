// Vercel : /api/demande — même code que netlify/functions/demande.mjs
import handler from "../netlify/functions/demande.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
