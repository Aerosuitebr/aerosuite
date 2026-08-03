/**
 * Logo quadrado para LinkedIn Page — logomark COLORIDO (navy + seta cyan + check dourado)
 * sobre gradiente azul Aero Suite. Não upscale além do raster nativo.
 *
 * Uso: node build-linkedin-page-logo.mjs [caminho/opcional-logomark.png]
 * Saída: static/aerosuite-linkedin-logo-1024.png, static/aerosuite-linkedin-logo-3000.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/node_modules/sharp'));

const dir = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(dir, '../../frontend/src/assets');
const outDir = path.join(dir, 'static');

const DEFAULT_SYMBOL = path.join(assets, 'Aero_suite_logo.png');
const BG_TOP = { r: 14, g: 165, b: 233 };
const BG_BOTTOM = { r: 2, g: 132, b: 199 };
const MARK_SCALE = 0.86;

function pickSymbolPath(argv) {
  const arg = argv.find((a) => a.endsWith('.png') || a.endsWith('.jpg'));
  if (arg && fs.existsSync(arg)) return path.resolve(arg);
  if (fs.existsSync(DEFAULT_SYMBOL)) return DEFAULT_SYMBOL;
  console.error('MISSING_SYMBOL', DEFAULT_SYMBOL);
  process.exit(2);
}

async function buildLinkedInLogo(size, outPath, symbolPath) {
  const meta = await sharp(symbolPath).metadata();
  const native = Math.min(meta.width ?? 512, meta.height ?? 512);
  const rx = Math.round(size * 0.1875);
  const markSize = Math.min(Math.round(size * MARK_SCALE), native);
  const pad = Math.round((size - markSize) / 2);

  const mark = await sharp(symbolPath)
    .resize(markSize, markSize, {
      fit: 'contain',
      kernel: sharp.kernel.lanczos3,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .sharpen({ sigma: 0.5, m1: 1, m2: 0.4, x1: 2, y2: 10 })
    .png()
    .toBuffer();

  const bgSvg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(${BG_TOP.r},${BG_TOP.g},${BG_TOP.b})"/>
      <stop offset="100%" stop-color="rgb(${BG_BOTTOM.r},${BG_BOTTOM.g},${BG_BOTTOM.b})"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
</svg>`;

  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  await sharp(bg)
    .composite([{ input: mark, top: pad, left: pad }])
    .png({ compressionLevel: 6, effort: 10 })
    .toFile(outPath);

  console.log('LINKEDIN_LOGO_OK', outPath, `${size}x${size}`, 'mark', `${markSize}px`, 'source', path.basename(symbolPath));
}

fs.mkdirSync(outDir, { recursive: true });
const symbolPath = pickSymbolPath(process.argv.slice(2));
await buildLinkedInLogo(1024, path.join(outDir, 'aerosuite-linkedin-logo-1024.png'), symbolPath);
await buildLinkedInLogo(3000, path.join(outDir, 'aerosuite-linkedin-logo-3000.png'), symbolPath);
