// Vercel : /api/paiement-stripe-webhook — même code que netlify/functions/paiement-stripe-webhook.mjs
import handler from "../netlify/functions/paiement-stripe-webhook.mjs";
import { fromNetlify } from "../netlify/lib/node-adapter.mjs";

export const config = { api: { bodyParser: false } };
export default fromNetlify(handler);
