/**
 * Sincroniza URL do logo colorido (aerosuite-logo-media.json) nos arquivos locais do site.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const mediaJson = path.join(dir, 'aerosuite-logo-media.json');

if (!fs.existsSync(mediaJson)) {
  console.error('MISSING', mediaJson);
  process.exit(2);
}

const { hero, logoLight } = JSON.parse(fs.readFileSync(mediaJson, 'utf8'));
if (!hero) {
  console.error('MISSING hero url in', mediaJson);
  process.exit(3);
}

const lcpLogo = logoLight || hero;

const OLD =
  /https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\\s]*(hero-logo-transparent-v2|hero-logo-transparent|Pictureandletter|aerosuite-logo-light|aero-colorido-logo)[^"'\\s]*/g;

function patchFile(rel, transform) {
  const file = path.join(dir, rel);
  if (!fs.existsSync(file)) return { file: rel, skipped: true };
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    return { file: rel, updated: true };
  }
  return { file: rel, updated: false };
}

const patches = [
  patchFile('aerosuite-site-config.mjs', (s) =>
    s.replace(
      /logo: 'https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^']+'/,
      `logo: '${hero}'`,
    ),
  ),
  patchFile('plugins/aerosuite-performance/aerosuite-performance.php', (s) =>
    s.replace(/const AS_PERF_LOGO = '[^']+';/, `const AS_PERF_LOGO = '${lcpLogo}';`),
  ),
  patchFile('plugins/aerosuite-perf/aerosuite-perf.php', (s) =>
    s.replace(/const AS_PERF_LOGO = '[^']+';/, `const AS_PERF_LOGO = '${lcpLogo}';`),
  ),
  patchFile('build-hero-tight.mjs', (s) =>
    s.replace(
      /screenshots\/web\/hero-logo-transparent\.png/,
      '../../frontend/src/assets/Aero_Colorido.png',
    ),
  ),
];

const staticDir = path.join(dir, 'static');
fs.mkdirSync(staticDir, { recursive: true });
fs.copyFileSync(
  path.join(dir, '..', '..', 'frontend', 'src', 'assets', 'Aero_Colorido.png'),
  path.join(staticDir, 'aero-colorido-logo.png'),
);

console.log(JSON.stringify({ hero, logoLight: lcpLogo, patches, static: 'static/aero-colorido-logo.png' }, null, 2));
