/**
 * Verifica lógica contain para Aero_Claro.png (sem dependências nativas).
 * Executar: node scripts/verify-hero-contain.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetPath = join(__dirname, '../src/assets/Aero_Claro.png');
const W = 600;
const H = 250;
const TARGET_RATIO = W / H;

function pngDimensions(buffer) {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('not a PNG');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

const buffer = readFileSync(assetPath);
const { width, height } = pngDimensions(buffer);
const ratio = width / height;
const useContain = ratio < TARGET_RATIO;

if (!useContain) {
  console.error('FAIL: Aero_Claro deveria usar contain fit');
  process.exit(1);
}

const fitScale = Math.min(W / width, H / height);
const drawW = width * fitScale;
const drawH = height * fitScale;
const dx = (W - drawW) / 2;
const dy = (H - drawH) / 2;

if (drawH < H * 0.95) {
  console.error(`FAIL: altura desenhada ${drawH.toFixed(1)}px — wordmark pode ser cortado`);
  process.exit(1);
}

if (dy > 2) {
  console.error(`FAIL: margem vertical superior ${dy.toFixed(1)}px — arte não encaixada na altura`);
  process.exit(1);
}

console.log(`OK: Aero_Claro ${width}x${height} (ratio ${ratio.toFixed(2)})`);
console.log(`OK: contain → ${drawW.toFixed(0)}x${drawH.toFixed(0)} px centrado, dy=${dy.toFixed(1)}`);
console.log('OK: wordmark inferior preservado (altura total usada)');
