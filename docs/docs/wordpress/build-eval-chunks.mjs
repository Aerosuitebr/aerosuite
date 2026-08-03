import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..', '..');
const outDir = path.join(dir, 'eval-chunks');
fs.mkdirSync(outDir, { recursive: true });

const textAssets = {
  css: fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8'),
  js: fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8'),
  showcase: fs.readFileSync(path.join(dir, 'snippets/showcase-modules.html'), 'utf8'),
  cta: fs.readFileSync(path.join(dir, 'snippets/cta-band.html'), 'utf8'),
};

const binAssets = {
  logo: {
    name: 'aerosuite-pictureandletter.png',
    mime: 'image/png',
    b64: fs.readFileSync(path.join(root, 'frontend/src/assets/Pictureandletter.png')).toString('base64'),
  },
  mark: {
    name: 'aerosuite-logo-aero.png',
    mime: 'image/png',
    b64: fs.readFileSync(path.join(root, 'frontend/src/assets/LOGO_AERO.png')).toString('base64'),
  },
  bg: {
    name: 'aerosuite-bg-deco.svg',
    mime: 'image/svg+xml',
    b64: fs.readFileSync(path.join(root, 'frontend/src/assets/aero-suite-bg-deco.svg')).toString('base64'),
  },
};

function chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) chunks.push(str.slice(i, i + size));
  return chunks;
}

const manifest = { text: Object.keys(textAssets), bin: {} };

fs.writeFileSync(path.join(outDir, 'text.json'), JSON.stringify(textAssets));

for (const [key, val] of Object.entries(binAssets)) {
  const chunks = chunkString(val.b64, 48000);
  manifest.bin[key] = { name: val.name, mime: val.mime, parts: chunks.length };
  chunks.forEach((c, i) => {
    fs.writeFileSync(path.join(outDir, `${key}-${i}.json`), JSON.stringify(c));
  });
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Chunks in', outDir, manifest);
