// Génère les versions WebP des photos, les tailles mobiles du hero et les icônes, à partir des JPG de public/img.
// Usage : npm run images   (après `npm install`)
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "img");
const photos = path.join(root, "photos");

for (const f of await readdir(photos)) {
  if (!f.endsWith(".jpg") || /-\d+\.jpg$/.test(f)) continue;
  const base = f.slice(0, -4);
  const src = path.join(photos, f);
  await sharp(src).webp({ quality: 80 }).toFile(path.join(photos, `${base}.webp`));
  if (base === "hero") {
    await sharp(src).resize({ width: 640 }).jpeg({ quality: 78 }).toFile(path.join(photos, "hero-640.jpg"));
    await sharp(src).resize({ width: 640 }).webp({ quality: 78 }).toFile(path.join(photos, "hero-640.webp"));
  }
}
const logo = path.join(root, "logo.jpg");
await sharp(logo).resize({ width: 160 }).webp({ quality: 85 }).toFile(path.join(root, "logo.webp"));
await sharp(logo).resize({ width: 180, height: 180, fit: "contain", background: "#ffffff" }).png().toFile(path.join(root, "apple-touch-icon.png"));
await sharp(logo).resize({ width: 64, height: 64, fit: "contain", background: "#ffffff" }).png().toFile(path.join(root, "favicon-64.png"));
console.log("Images WebP, hero mobile et icônes générés dans public/img.");
