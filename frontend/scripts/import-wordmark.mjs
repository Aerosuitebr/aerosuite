/**
 * Importa wordmark horizontal Aero Suite.
 *
 * Branco (footer, fundo escuro):
 *   node scripts/import-wordmark.mjs --light [imagem.png]
 *
 * Escuro (home, fundo claro) — quando existir:
 *   node scripts/import-wordmark.mjs --dark [imagem.png]
 */
import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const assetsDir = join(root, 'src', 'assets');

const DEFAULT_LIGHT =
  'D:/Desenvolvimento/imagens/Gemini_Generated_Image_889qoc889qoc889q.png';
const DEFAULT_DARK =
  'D:/Desenvolvimento/imagens/Gemini_Generated_Image_9yck389yck389yck.png';

const OUT_W = 1600;
const OUT_H = 400;
const PADDING_RATIO = 0.1;

function parseArgs(argv) {
  const light = argv.includes('--light') || !argv.includes('--dark');
  const paths = argv.filter((a) => !a.startsWith('--'));
  const srcPath = paths[0] || (light ? DEFAULT_LIGHT : DEFAULT_DARK);
  return { light, srcPath };
}

async function removeBackgroundWhiteWordmark(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    const isNeutral = spread < 32;
    const isCheckerGray = lum >= 95 && lum <= 225 && isNeutral;
    const isDarkCanvas = lum < 64;
    if (isCheckerGray || isDarkCanvas) {
      data[o + 3] = 0;
      continue;
    }
    if (lum > 175) {
      data[o] = 255;
      data[o + 1] = 255;
      data[o + 2] = 255;
      data[o + 3] = 255;
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

/** Xadrez/branco/preto — preserva texto navy #0f172a. */
async function removeBackgroundDarkWordmark(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    const isNeutral = spread < 32;
    const isCheckerGray = lum >= 95 && lum <= 225 && isNeutral;
    const isLightBg = lum > 175 && isNeutral;
    const isBlackCanvas = lum < 40 && isNeutral;
    if (isCheckerGray || isLightBg || isBlackCanvas) {
      data[o + 3] = 0;
      continue;
    }
    if (lum < 95 && spread < 45) {
      data[o] = 15;
      data[o + 1] = 23;
      data[o + 2] = 42;
      data[o + 3] = 255;
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function extractWordmark(inputPath, light) {
  const meta = await sharp(inputPath).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const cropW = Math.round(w * 0.88);
  const cropH = Math.round(h * 0.55);
  const left = Math.round((w - cropW) / 2);
  const top = Math.round((h - cropH) / 2);

  const cropped = await sharp(inputPath)
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();

  const keyed = light
    ? await removeBackgroundWhiteWordmark(cropped)
    : await removeBackgroundDarkWordmark(cropped);
  return sharp(keyed).trim({ threshold: 8 }).png().toBuffer();
}

async function prepareHorizontalWordmark(inputPath, light) {
  const trimmed = await extractWordmark(inputPath, light);
  const padW = Math.round(OUT_W * PADDING_RATIO);
  const padH = Math.round(OUT_H * PADDING_RATIO);
  const innerW = OUT_W - padW * 2;
  const innerH = OUT_H - padH * 2;

  const mark = await sharp(trimmed)
    .resize(innerW, innerH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: OUT_W,
      height: OUT_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function main() {
  const { light, srcPath } = parseArgs(process.argv.slice(2));
  console.log(light ? 'mode: wordmark light (footer)' : 'mode: wordmark dark (home)');
  console.log('source:', srcPath);

  const buf = await prepareHorizontalWordmark(srcPath, light);
  const file = light ? 'LOGO_LETRA_LIGHT.png' : 'LOGO_LETRA.png';
  const out = join(assetsDir, file);
  await sharp(buf).toFile(out);
  console.log('wrote', out);

  if (light) {
    await sharp(buf).resize(800, 200).png().toFile(join(assetsDir, 'LOGO_LETRA_LIGHT@0.5x.png'));
    console.log('wrote', join(assetsDir, 'LOGO_LETRA_LIGHT@0.5x.png'));
  }

  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
