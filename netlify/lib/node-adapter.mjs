// Adaptateur Vercel : rend les fonctions Netlify (Request → Response) utilisables dans api/ de Vercel,
// que Vercel appelle la fonction avec la signature web (request) ou la signature Node (req, res).
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    // Vercel a déjà lu le corps (helpers Node) : on le restitue tel quel.
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === "string") return Buffer.from(req.body);
    return Buffer.from(JSON.stringify(req.body));
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export function fromNetlify(handler) {
  return async (req, res) => {
    if (typeof req?.headers?.get === "function" && !res) return handler(req, {}); // signature web
    try {
      const proto = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
      const url = new URL(req.url, `${proto}://${host}`);
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers[k] = v;
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
      const response = await handler(new Request(url, { method: req.method, headers, body }), {});
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.statusCode = 500;
      res.end("Erreur interne");
    }
  };
}
