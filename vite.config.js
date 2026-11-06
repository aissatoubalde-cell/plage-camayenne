import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * En développement (npm run dev) et en aperçu (npm run preview), sert les fonctions de netlify/functions
 * sur /api/<nom>, exactement comme Netlify en production. Relancez le serveur après avoir modifié une fonction.
 */
function netlifyFunctions(mode) {
  const root = process.cwd();
  const env = loadEnv(mode, root, "");
  for (const [k, v] of Object.entries(env)) if (!(k in process.env)) process.env[k] = v;
  const cache = new Map();
  const handle = async (req, res, next) => {
    const m = req.url.match(/^\/api\/([a-z0-9-]+)(\?|$)/);
    if (!m) return next();
    const file = path.join(root, "netlify", "functions", `${m[1]}.mjs`);
    if (!existsSync(file)) return next();
    try {
      if (!cache.has(file)) cache.set(file, await import(pathToFileURL(file).href));
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const request = new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
      const response = await cache.get(file).default(request, {});
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.statusCode = 500;
      res.end("Erreur de la fonction " + m[1]);
    }
  };
  return {
    name: "netlify-functions",
    configureServer(s) { s.middlewares.use(handle); },
    configurePreviewServer(s) { s.middlewares.use(handle); },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), netlifyFunctions(mode)],
  server: { port: 5173 },
  preview: { port: 4173 },
}));
