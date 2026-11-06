// Vercel : /api/paiement-cinetpay — même code que netlify/functions/paiement-cinetpay.mjs
import handler from "../netlify/functions/paiement-cinetpay.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
