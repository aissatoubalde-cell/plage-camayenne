// Vercel : /api/admin — même code que netlify/functions/admin.mjs
import handler from "../netlify/functions/admin.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
