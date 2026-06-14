// Generates the PWA / favicon icon set from a single authored SVG — an ocean
// gradient with the Anchor mark (the lucide "anchor" glyph) in white, matching
// the app's brand. Run with: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
mkdirSync(publicDir, { recursive: true })

// The lucide "anchor" glyph (24×24), drawn white. `frac` controls how much of
// the canvas the mark occupies (smaller for maskable, to respect the safe zone).
function svg(size, frac) {
  const scale = (frac * size) / 24
  const offset = (size - 24 * scale) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ed8e9"/>
      <stop offset="1" stop-color="#2fa6ca"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})"
     fill="none" stroke="#ffffff" stroke-width="1.9"
     stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="5" r="3"/>
    <line x1="12" y1="22" x2="12" y2="8"/>
    <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
  </g>
</svg>`
}

const targets = [
  { file: 'pwa-192x192.png', size: 192, frac: 0.56 },
  { file: 'pwa-512x512.png', size: 512, frac: 0.56 },
  { file: 'maskable-512x512.png', size: 512, frac: 0.46 },
  { file: 'apple-touch-icon-180x180.png', size: 180, frac: 0.56 },
]

for (const t of targets) {
  await sharp(Buffer.from(svg(t.size, t.frac)))
    .png()
    .toFile(path.join(publicDir, t.file))
  console.log('wrote', t.file)
}

// A crisp, scalable favicon.
writeFileSync(path.join(publicDir, 'favicon.svg'), svg(32, 0.62))
console.log('wrote favicon.svg')
