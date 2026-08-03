/**
 * Importa logomark Aero Suite.
 *
 * Colorido (login, favicon, LOGO_AERO):
 *   node scripts/import-logomark.mjs [imagem.png]
 *
 * Branco (sidebar escura, logo_side):
 *   node scripts/import-logomark.mjs --white [imagem.png]
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');
const assetsDir = join(srcDir, 'assets');

const DEFAULT_COLOR =
  'D:/Desenvolvimento/imagens/Gemini_Generated_Image_txhriftxhriftxhr.png';
const DEFAULT_WHITE =
  'D:/Desenvolvimento/imagens/Gemini_Generated_Image_3tktfs3tktfs3tkt.png';

const BG_TOP = { r: 14, g: 165, b: 233 };
const BG_BOTTOM = { r: 2, g: 132, b: 199 };
const PADDING_RATIO = 0.1;

function parseArgs(argv) {
  const white = argv.includes('--white');
  const paths = argv.filter((a) => !a.startsWith('--'));
  const srcPath = paths[0] || (white ? DEFAULT_WHITE : DEFAULT_COLOR);
  return { white, srcPath };
}

/** Fundo claro/xadrez — logomark colorido. */
async function removeNeutralBackground(buffer) {
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
    const isNeutral = spread < 28;
    const isLightBg = lum > 175 && isNeutral;
    const isCheckerGray = lum >= 118 && lum <= 210 && isNeutral;
    if (isLightBg || isCheckerGray) {
      data[o + 3] = 0;
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

/** Xadrez/preto — preserva traços brancos do logomark. */
async function removeBackgroundWhiteMark(buffer) {
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
    if (lum > 180) {
      data[o] = 255;
      data[o + 1] = 255;
      data[o + 2] = 255;
      data[o + 3] = 255;
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function extractMarkFromSource(inputPath, white) {
  const meta = await sharp(inputPath).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const cropW = Math.round(w * 0.58);
  const cropH = Math.round(h * 0.92);
  const left = Math.round((w - cropW) / 2);
  const top = Math.round((h - cropH) / 2);

  const cropped = await sharp(inputPath)
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();

  const keyed = white
    ? await removeBackgroundWhiteMark(cropped)
    : await removeNeutralBackground(cropped);
  return sharp(keyed).trim({ threshold: 8 }).png().toBuffer();
}

async function prepareSquareMark(inputPath, outputSize, white) {
  const trimmed = await extractMarkFromSource(inputPath, white);
  const inner = Math.round(outputSize * (1 - 2 * PADDING_RATIO));
  const mark = await sharp(trimmed)
    .resize(inner, inner, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: outputSize,
      height: outputSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function makeIconSquare(size, markBuffer, markScale = 0.86) {
  const markSize = Math.round(size * markScale);
  const pad = Math.round((size - markSize) / 2);
  const rx = Math.round(size * 0.1875);

  const svgBg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgb(${BG_TOP.r},${BG_TOP.g},${BG_TOP.b})"/>
          <stop offset="100%" stop-color="rgb(${BG_BOTTOM.r},${BG_BOTTOM.g},${BG_BOTTOM.b})"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
    </svg>`;

  const bg = await sharp(Buffer.from(svgBg)).png().toBuffer();
  const mark = await sharp(markBuffer)
    .resize(markSize, markSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp(bg)
    .composite([{ input: mark, top: pad, left: pad }])
    .png()
    .toBuffer();
}

async function importColor(srcPath) {
  const mark512 = await prepareSquareMark(srcPath, 512, false);

  await sharp(mark512).toFile(join(assetsDir, 'Aero_suite_logo.png'));
  console.log('wrote', join(assetsDir, 'Aero_suite_logo.png'), '(master transparent)');

  const logoAero = await makeIconSquare(256, mark512, 0.86);
  await sharp(logoAero).toFile(join(assetsDir, 'LOGO_AERO.png'));
  console.log('wrote', join(assetsDir, 'LOGO_AERO.png'), '(icon gradient)');

  const sizes = [
    { file: 'favicon-32.png', size: 32, scale: 0.72 },
    { file: 'favicon-48.png', size: 48, scale: 0.74 },
    { file: 'apple-touch-icon.png', size: 180, scale: 0.78 },
  ];

  for (const { file, size, scale } of sizes) {
    const buf = await makeIconSquare(size, mark512, scale);
    const out = join(srcDir, file);
    await sharp(buf).toFile(out);
    console.log('wrote', out);
  }

  const png32 = await makeIconSquare(32, mark512, 0.7);
  await sharp(png32).toFile(join(srcDir, 'favicon.ico'));

  const b64 = png32.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#bg)"/>
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="32" height="32"/>
</svg>`;
  writeFileSync(join(srcDir, 'favicon.svg'), svg);
}

async function importWhite(srcPath) {
  const mark512 = await prepareSquareMark(srcPath, 512, true);
  const mark1024 = await sharp(mark512).resize(1024, 1024).png().toBuffer();

  await sharp(mark512).toFile(join(assetsDir, 'logo_side.png'));
  console.log('wrote', join(assetsDir, 'logo_side.png'), '(sidebar, transparent white)');

  await sharp(mark512).toFile(join(assetsDir, 'LOGO_AERO_WHITE.png'));
  console.log('wrote', join(assetsDir, 'LOGO_AERO_WHITE.png'), '(master white)');

  await sharp(mark1024).toFile(join(assetsDir, 'logo_side@2x.png'));
  console.log('wrote', join(assetsDir, 'logo_side@2x.png'), '(retina)');
}

async function main() {
  const { white, srcPath } = parseArgs(process.argv.slice(2));
  console.log(white ? 'mode: white logomark' : 'mode: color logomark');
  console.log('source:', srcPath);

  if (white) {
    await importWhite(srcPath);
  } else {
    await importColor(srcPath);
  }

  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
