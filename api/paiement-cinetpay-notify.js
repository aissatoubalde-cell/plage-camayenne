// Vercel : /api/paiement-cinetpay-notify — même code que netlify/functions/paiement-cinetpay-notify.mjs
import handler from "../netlify/functions/paiement-cinetpay-notify.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export default fromNetlify(handler);
