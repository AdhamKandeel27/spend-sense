/**
 * Renders the app icons (three fanned paint chips on the deck green) into
 * public/icons. Run after changing the mark:  pnpm tsx scripts/generate-icons.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const out = path.join(process.cwd(), "public", "icons");

/** `pad` shrinks the mark for maskable icons, whose edges may be cropped. */
function mark(pad: number) {
  const s = 512;
  const inner = s * (1 - pad * 2);
  const k = inner / 26;
  const o = s * pad;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#1f5a50"/>
  <g transform="translate(${o + k * 1.5} ${o}) scale(${k})">
    <g transform="rotate(-18 4 22)"><rect x="4" y="4" width="8" height="18" fill="#3B5A8E"/></g>
    <g transform="rotate(-6 9 22)"><rect x="9" y="4" width="8" height="18" fill="#D69A2D"/></g>
    <rect x="14" y="4" width="8" height="18" fill="#B04A3A"/>
    <circle cx="18" cy="19" r="1.6" fill="#1f5a50"/>
  </g>
</svg>`);
}

async function main() {
  await fs.mkdir(out, { recursive: true });
  const any = mark(0.14);
  const maskable = mark(0.24);
  await sharp(any).resize(192).png().toFile(path.join(out, "icon-192.png"));
  await sharp(any).resize(512).png().toFile(path.join(out, "icon-512.png"));
  await sharp(maskable).resize(512).png().toFile(path.join(out, "icon-maskable-512.png"));
  await sharp(any).resize(180).png().toFile(path.join(out, "apple-touch-icon.png"));
  await sharp(any).resize(32).png().toFile(path.join(out, "favicon-32.png"));
  console.log("Icons written to public/icons");
}

main();
