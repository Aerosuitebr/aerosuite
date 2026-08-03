/**
 * Gera PNGs do favicon Aero Suite a partir do app (frontend/src/favicon.svg).
 * Uso: node build-site-icon-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require(path.join(dir, '../../frontend/node_modules/sharp'));
const svgPath = path.join(dir, '../../frontend/src/favicon.svg');
const outDir = path.join(dir, 'static');
const out512 = path.join(outDir, 'aerosuite-site-icon-512.png');
const out32 = path.join(outDir, 'aerosuite-site-icon-32.png');

if (!fs.existsSync(svgPath)) {
  console.error('MISSING_SVG', svgPath);
  process.exit(2);
}

await sharp(svgPath).resize(512, 512).png().toFile(out512);
await sharp(svgPath).resize(32, 32).png().toFile(out32);

console.log('ICON_ASSETS_OK', { out512, out32 });
