/**
 * Imagens de mídia para LinkedIn Page e posts orgânicos.
 * Capa 1128×191 + posts 1200×627 com screenshots reais do produto.
 *
 * Uso: node build-linkedin-media.mjs
 * Saída: static/aerosuite-linkedin-*.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/node_modules/sharp'));

const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = path.join(dir, 'screenshots');
const assets = path.join(dir, '../../frontend/src/assets');
const outDir = path.join(dir, 'static');

const BG_TOP = { r: 14, g: 165, b: 233 };
const BG_BOTTOM = { r: 2, g: 132, b: 199 };
const LINKEDIN_COVER_SOURCE = path.join(assets, 'Linkedin_back.png');
const NAVY = { r: 15, g: 23, b: 42 };
const GOLD = '#e8c547';
const GOLD_DARK = '#c9a227';

const POSTS = [
  {
    id: 'hangar',
    screenshot: 'dashboard.png',
    headline: 'Hangar · Estoque · OS integrados',
    sub: 'Software MRO — demonstração em 30 min',
  },
  {
    id: 'estoque',
    screenshot: 'estoque-itens.png',
    headline: 'Rastreio de peças sem planilha',
    sub: 'FIFO · lote · certificado · vínculo com OS',
  },
  {
    id: 'os',
    screenshot: 'os-list.png',
    headline: 'Job card digital e auditável',
    sub: 'Apontamento · histórico · liberação',
  },
  {
    id: 'planilhas',
    screenshot: 'estoque-fifo.png',
    headline: 'Planilha ou software MRO?',
    sub: 'Comparativo honesto para sua oficina',
  },
];

/** Posts editoriais (Radar MRO / blog) — sem screenshot do produto. */
const EDITORIAL_POSTS = [
  {
    id: 'radar-anac',
    eyebrow: 'Radar MRO',
    headline: 'ANAC corta 40%\nda fiscalização',
    sub: 'Impacto em oficinas RBAC 145 · checklist prático',
    stat: '40%',
    statLabel: 'menos ações de fiscalização',
    bullets: ['OS auditável sempre pronta', 'Rastreio peça ↔ certificado', '5 ações para sua oficina'],
  },
];

const RADAR_CAROUSEL = [
  { step: '1', title: 'Dossiê de auditoria', sub: 'OS dos últimos 12 meses completas' },
  { step: '2', title: 'Estoque ↔ OS', sub: 'Lote, certificado e ordem vinculados' },
  { step: '3', title: 'Treinamentos', sub: 'Habilitações com evidência atualizada' },
  { step: '4', title: 'Teste em 30 min', sub: 'Responda: qual peça, quem aprovou?' },
];

const CONFORMIDADE_POST = {
  id: 'conformidade',
  screenshot: 'conformidade-painel.png',
  headline: 'Adequação integrada ao MRO',
  sub: 'SGQ · SMS · documentos · auditoria',
};

/** Carrossel Post #6 — ferramentas de adequação (1080×1080). */
const CONFORMIDADE_CAROUSEL = [
  {
    step: '1',
    kicker: 'AERO SUITE',
    title: 'Adequação que\nconversa com o MRO',
    sub: 'SGQ integrado a OS, hangar, estoque e CRS — sem planilha paralela.',
    bullets: ['Painel de qualidade unificado', 'Alertas antes do vencimento', 'Evidência na operação'],
    accent: 'cover',
  },
  {
    step: '2',
    kicker: 'DOCUMENTOS',
    title: 'MOE, POP\ne NC / CAPA',
    sub: 'Revisão controlada, vigência monitorada e fluxo CAPA por fases.',
    bullets: ['Histórico de revisões', 'Indicadores SMS', 'Export SGQ (ZIP)'],
    accent: 'docs',
  },
  {
    step: '3',
    kicker: 'PESSOAS & FERRAMENTAS',
    title: 'Treino, calibração\ne ASL',
    sub: 'Habilitações, calibração vencida e subcontratação Part-145 na mesma base.',
    bullets: ['Treinamentos obrigatórios', 'AD / SB com prazo FCU', 'Bloqueios operacionais'],
    accent: 'people',
  },
  {
    step: '4',
    kicker: 'AUDITORIA',
    title: 'Pronto para\na próxima visita',
    sub: 'Dossiê multi-OS, retenção de registros e arquivo morto orientativo.',
    bullets: ['Dossiê de auditoria', 'Retenção + ZIP', 'Demo em 30 min → contato'],
    accent: 'audit',
    cta: true,
  },
];

function gradientSvg(w, h, rx = 0) {
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(${BG_TOP.r},${BG_TOP.g},${BG_TOP.b})"/>
      <stop offset="100%" stop-color="rgb(${BG_BOTTOM.r},${BG_BOTTOM.g},${BG_BOTTOM.b})"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" ${rx ? `rx="${rx}"` : ''} fill="url(#g)"/>
</svg>`);
}

function textOverlaySvg(w, h, lines, opts = {}) {
  const { align = 'left', padX = 48, padY = 36, fontSize = 28, subSize = 18 } = opts;
  const anchor = align === 'center' ? 'middle' : 'start';
  const x = align === 'center' ? w / 2 : padX;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rows = lines.map((line, i) => {
    const size = i === 0 ? fontSize : subSize;
    const weight = i === 0 ? 700 : 500;
    const y = padY + i * (fontSize + 8);
    return `<text x="${x}" y="${y}" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(line)}</text>`;
  });
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  ${rows.join('\n  ')}
</svg>`);
}

async function loadScreenshot(name, targetW, targetH) {
  const file = path.join(shots, name);
  if (!fs.existsSync(file)) throw new Error('MISSING_SCREENSHOT ' + file);
  return sharp(file)
    .resize(targetW, targetH, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
}

async function buildCover() {
  const w = 1128;
  const h = 191;

  if (!fs.existsSync(LINKEDIN_COVER_SOURCE)) {
    throw new Error('MISSING_COVER_SOURCE ' + LINKEDIN_COVER_SOURCE);
  }

  const out = path.join(outDir, 'aerosuite-linkedin-cover-1128x191.png');
  await sharp(LINKEDIN_COVER_SOURCE)
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 6 })
    .toFile(out);

  console.log('LINKEDIN_COVER_OK', out, 'from', path.basename(LINKEDIN_COVER_SOURCE));
}

async function buildPost({ id, screenshot, headline, sub }) {
  const w = 1200;
  const h = 627;
  const panelW = Math.round(w * 0.58);
  const panelH = Math.round(h * 0.82);
  const panelTop = Math.round((h - panelH) / 2);
  const panelLeft = w - panelW - 40;

  const bg = await sharp({
    create: { width: w, height: h, channels: 3, background: NAVY },
  })
    .composite([{ input: gradientSvg(panelW + 80, h), top: 0, left: 0, blend: 'multiply' }])
    .png()
    .toBuffer();

  const screenshotBuf = await loadScreenshot(screenshot, panelW, panelH);
  const shadow = await sharp({
    create: { width: panelW + 12, height: panelH + 12, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.25 } },
  })
    .blur(8)
    .png()
    .toBuffer();

  const logoPath = path.join(assets, 'Aero_suite_logo.png');
  const logo = fs.existsSync(logoPath)
    ? await sharp(logoPath)
        .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    : null;

  const text = textOverlaySvg(w, h, [headline, sub], {
    padX: 48,
    padY: 200,
    fontSize: 36,
    subSize: 22,
  });

  const badge = textOverlaySvg(220, 40, ['aerosuite.com.br'], {
    padX: 16,
    padY: 28,
    fontSize: 16,
    subSize: 16,
  });

  const composites = [
    { input: shadow, top: panelTop + 6, left: panelLeft - 2 },
    { input: screenshotBuf, top: panelTop, left: panelLeft },
    { input: text, top: 0, left: 0 },
    { input: badge, top: h - 56, left: 48 },
  ];
  if (logo) composites.unshift({ input: logo, top: 48, left: 48 });

  const out = path.join(outDir, `aerosuite-linkedin-post-${id}-1200x627.png`);
  await sharp(bg).composite(composites).png({ compressionLevel: 6 }).toFile(out);
  console.log('LINKEDIN_POST_OK', out);
}

function escSvg(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function editorialInfographicSvg(w, h, { stat, statLabel, bullets }) {
  const rows = bullets
    .map(
      (line, i) => `
    <g transform="translate(32, ${168 + i * 52})">
      <circle cx="12" cy="12" r="12" fill="rgba(232,197,71,0.2)"/>
      <text x="12" y="17" fill="${GOLD}" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle">${i + 1}</text>
      <text x="36" y="17" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600">${escSvg(line)}</text>
    </g>`,
    )
    .join('');
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.14)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="24" fill="url(#card)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <text x="${w / 2}" y="88" fill="${GOLD}" font-family="Segoe UI, Arial, sans-serif" font-size="88" font-weight="800" text-anchor="middle">${escSvg(stat)}</text>
  <text x="${w / 2}" y="128" fill="rgba(255,255,255,0.88)" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" text-anchor="middle">${escSvg(statLabel)}</text>
  ${rows}
</svg>`);
}

function editorialTextSvg(w, h, { eyebrow, headline, sub }) {
  const headlineLines = headline.includes('\n') ? headline.split('\n') : [headline];
  const headlineRows = headlineLines
    .map(
      (line, i) =>
        `<text x="0" y="${120 + i * 48}" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="800">${escSvg(line)}</text>`,
    )
    .join('\n  ');
  const subY = 120 + headlineLines.length * 48 + 24;
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="200" height="36" rx="18" fill="rgba(232,197,71,0.18)" stroke="${GOLD_DARK}" stroke-width="1.5"/>
  <text x="100" y="24" fill="${GOLD}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="800" letter-spacing="0.12em" text-anchor="middle">${escSvg(eyebrow.toUpperCase())}</text>
  ${headlineRows}
  <text x="0" y="${subY}" fill="rgba(255,255,255,0.82)" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="500">${escSvg(sub)}</text>
</svg>`);
}

async function buildEditorialPost({ id, eyebrow, headline, sub, stat, statLabel, bullets }) {
  const w = 1200;
  const h = 627;
  const cardW = Math.round(w * 0.42);
  const cardH = Math.round(h * 0.78);
  const cardTop = Math.round((h - cardH) / 2);
  const cardLeft = w - cardW - 48;

  const bg = await sharp({
    create: { width: w, height: h, channels: 3, background: NAVY },
  })
    .composite([
      { input: gradientSvg(w, h), top: 0, left: 0, blend: 'multiply' },
      {
        input: Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${w - 120}" cy="80" r="180" fill="rgba(232,197,71,0.08)"/>
  <circle cx="80" cy="${h - 40}" r="140" fill="rgba(14,165,233,0.12)"/>
</svg>`),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  const logoPath = path.join(assets, 'Aero_suite_logo.png');
  const logo = fs.existsSync(logoPath)
    ? await sharp(logoPath)
        .resize(88, 88, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    : null;

  const text = editorialTextSvg(560, 220, { eyebrow, headline, sub });
  const card = editorialInfographicSvg(cardW, cardH, { stat, statLabel, bullets });
  const badge = textOverlaySvg(220, 40, ['aerosuite.com.br/blog'], {
    padX: 16,
    padY: 28,
    fontSize: 16,
    subSize: 16,
  });

  const composites = [
    { input: card, top: cardTop, left: cardLeft },
    { input: text, top: 140, left: 48 },
    { input: badge, top: h - 56, left: 48 },
  ];
  if (logo) composites.unshift({ input: logo, top: 48, left: 48 });

  const out = path.join(outDir, `aerosuite-linkedin-post-${id}-1200x627.png`);
  await sharp(bg).composite(composites).png({ compressionLevel: 6 }).toFile(out);
  console.log('LINKEDIN_EDITORIAL_OK', out);
}

function conformidadeCarouselSvg(size, pad, slide) {
  const innerW = size - pad * 2;
  const innerH = size - pad * 2 - 48;
  const titleLines = slide.title.split('\n');
  const titleRows = titleLines
    .map(
      (line, i) =>
        `<text x="56" y="${200 + i * 58}" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="800">${escSvg(line)}</text>`,
    )
    .join('\n  ');
  const bulletRows = (slide.bullets || [])
    .map(
      (line, i) => `
    <g transform="translate(56, ${420 + i * 56})">
      <rect x="0" y="0" width="28" height="28" rx="8" fill="rgba(232,197,71,0.22)" stroke="${GOLD_DARK}" stroke-width="1.5"/>
      <text x="14" y="20" fill="${GOLD}" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800" text-anchor="middle">${i + 1}</text>
      <text x="44" y="20" fill="rgba(255,255,255,0.92)" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600">${escSvg(line)}</text>
    </g>`,
    )
    .join('');
  const ctaBtn = slide.cta
    ? `<rect x="56" y="${innerH - 96}" width="340" height="56" rx="28" fill="${GOLD}"/>
       <text x="226" y="${innerH - 60}" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" text-anchor="middle">aerosuite.com.br/contato</text>`
    : '';
  const accentOrb =
    slide.accent === 'cover'
      ? `<circle cx="${innerW - 140}" cy="${innerH - 140}" r="110" fill="rgba(14,165,233,0.18)"/>`
      : slide.accent === 'docs'
        ? `<rect x="${innerW - 200}" y="80" width="140" height="180" rx="16" fill="rgba(232,197,71,0.12)" stroke="rgba(232,197,71,0.35)" stroke-width="2"/>`
        : slide.accent === 'people'
          ? `<circle cx="${innerW - 100}" cy="160" r="90" fill="rgba(232,197,71,0.1)"/><circle cx="${innerW - 60}" cy="220" r="50" fill="rgba(14,165,233,0.15)"/>`
          : `<polygon points="${innerW - 60},100 ${innerW - 20},280 ${innerW - 140},280" fill="rgba(232,197,71,0.12)" stroke="rgba(232,197,71,0.3)" stroke-width="2"/>`;
  return Buffer.from(`
<svg width="${innerW}" height="${innerH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(15,23,42,0.72)"/>
      <stop offset="100%" stop-color="rgba(15,23,42,0.88)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="36" fill="url(#panel)" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>
  ${accentOrb}
  <text x="56" y="80" fill="${GOLD}" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="0.16em">${escSvg(slide.kicker)}</text>
  <text x="${innerW - 56}" y="80" fill="rgba(255,255,255,0.45)" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" text-anchor="end">${escSvg(slide.step)} / 4</text>
  ${titleRows}
  <text x="56" y="${200 + titleLines.length * 58 + 28}" fill="rgba(255,255,255,0.78)" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="500">${escSvg(slide.sub)}</text>
  ${bulletRows}
  ${ctaBtn}
  <text x="56" y="${innerH - 28}" fill="rgba(255,255,255,0.45)" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500">RBAC 145 · SGQ · Aero Suite</text>
</svg>`);
}

async function buildConformidadeCarouselSlide(slide) {
  const size = 1080;
  const pad = 56;
  const bg = await sharp(gradientSvg(size, size, 48)).png().toBuffer();
  const panel = conformidadeCarouselSvg(size, pad, slide);
  const logoPath = path.join(assets, 'LOGO_AERO_WHITE.png');
  const logo = fs.existsSync(logoPath)
    ? await sharp(logoPath)
        .resize(72, 72, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    : null;
  const composites = [{ input: panel, top: pad, left: pad }];
  if (logo) composites.push({ input: logo, top: pad + 12, left: size - pad - 84 });
  const out = path.join(outDir, `aerosuite-linkedin-carousel-conformidade-${slide.step}-1080.png`);
  await sharp(bg).composite(composites).png({ compressionLevel: 6 }).toFile(out);
  console.log('LINKEDIN_CONFORMIDADE_CAROUSEL_OK', out);
}

async function buildRadarCarouselSlide({ step, title, sub }) {
  const size = 1080;
  const pad = 72;
  const bg = await sharp(gradientSvg(size, size, 48)).png().toBuffer();
  const panel = Buffer.from(`
<svg width="${size - pad * 2}" height="${size - pad * 2 - 80}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" rx="32" fill="rgba(15,23,42,0.55)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <text x="56" y="120" fill="${GOLD}" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="0.14em">RADAR MRO</text>
  <text x="56" y="220" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="800">${escSvg(step)}</text>
  <text x="56" y="310" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700">${escSvg(title)}</text>
  <text x="56" y="380" fill="rgba(255,255,255,0.82)" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="500">${escSvg(sub)}</text>
  <text x="56" y="520" fill="rgba(255,255,255,0.55)" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="500">ANAC · RBAC 145 · Aero Suite</text>
</svg>`);
  const out = path.join(outDir, `aerosuite-linkedin-carousel-radar-${step}-1080.png`);
  await sharp(bg)
    .composite([{ input: panel, top: pad, left: pad }])
    .png()
    .toFile(out);
  console.log('LINKEDIN_RADAR_CAROUSEL_OK', out);
}

function copyToDesktop() {
  const desktop = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop', 'aerosuite-linkedin-media');
  if (!process.env.USERPROFILE && !process.env.HOME) return;
  fs.mkdirSync(desktop, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (!file.startsWith('aerosuite-linkedin-') || !file.endsWith('.png')) continue;
    fs.copyFileSync(path.join(outDir, file), path.join(desktop, file));
  }
  console.log('LINKEDIN_MEDIA_COPIED', desktop);
}

async function buildCarouselSlide(index, screenshot, caption) {
  const size = 1080;
  const inner = Math.round(size * 0.88);
  const pad = Math.round((size - inner) / 2);
  const bg = await sharp(gradientSvg(size, size, 48)).png().toBuffer();
  const shot = await loadScreenshot(screenshot, inner, Math.round(inner * 0.62));
  const cap = textOverlaySvg(size, 120, [caption], {
    align: 'center',
    padX: 0,
    padY: 72,
    fontSize: 28,
    subSize: 28,
  });
  const out = path.join(outDir, `aerosuite-linkedin-carousel-${index}-1080.png`);
  await sharp(bg)
    .composite([
      { input: shot, top: pad, left: pad },
      { input: cap, top: size - 140, left: 0 },
    ])
    .png()
    .toFile(out);
  console.log('LINKEDIN_CAROUSEL_OK', out);
}

fs.mkdirSync(outDir, { recursive: true });
await buildCover();
for (const post of POSTS) await buildPost(post);
for (const post of EDITORIAL_POSTS) await buildEditorialPost(post);
await buildCarouselSlide(1, 'dashboard.png', 'Dashboard MRO');
await buildCarouselSlide(2, 'estoque-itens.png', 'Estoque rastreável');
await buildCarouselSlide(3, 'os-list.png', 'Ordens de serviço');
await buildCarouselSlide(4, 'estoque-fifo.png', 'FIFO e certificados');
for (const slide of RADAR_CAROUSEL) await buildRadarCarouselSlide(slide);
if (fs.existsSync(path.join(shots, CONFORMIDADE_POST.screenshot))) {
  await buildPost(CONFORMIDADE_POST);
  for (const slide of CONFORMIDADE_CAROUSEL) await buildConformidadeCarouselSlide(slide);
} else {
  console.warn('SKIP_CONFORMIDADE', 'missing', CONFORMIDADE_POST.screenshot);
}
copyToDesktop();

console.log('LINKEDIN_MEDIA_DONE', outDir);
