/**
 * Utilitários compartilhados para gravação demo (Playwright).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(__dirname, '../../e2e/node_modules/playwright'));

export { chromium, __dirname };

export const DEFAULT_BASE = process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br';
export const VIEWPORT = { width: 1920, height: 1080 };

export async function loadSecrets() {
  try {
    const mod = await import('./aerosuite-site-secrets.local.mjs');
    return mod.SECRETS ?? {};
  } catch {
    return {};
  }
}

export function formatTimestamp(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const frac = Math.floor((ms % 1000) / 100);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${frac}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${frac}`;
}

export class ChapterLogger {
  /** @param {number} startedAt */
  constructor(startedAt) {
    this.startedAt = startedAt;
    this.chapters = [];
  }

  mark(step, extra = {}) {
    const elapsedMs = Date.now() - this.startedAt;
    const entry = {
      id: step.id,
      slideId: step.slideId ?? step.id,
      title: step.title,
      description: step.description,
      voiceover: step.voiceover ?? step.description,
      clipSuggestion: step.clipSuggestion ?? '',
      path: step.path ?? null,
      timestampMs: elapsedMs,
      timestamp: formatTimestamp(elapsedMs),
      ...extra,
    };
    this.chapters.push(entry);
    console.log(`[${entry.timestamp}] ${entry.title}`);
    return entry;
  }

  write(outDir, meta = {}) {
    fs.mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, 'chapter-map.json');
    const mdPath = path.join(outDir, 'GUIA-EDICAO.md');

    const payload = {
      generatedAt: new Date().toISOString(),
      ...meta,
      chapters: this.chapters,
    };
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

    const lines = [
      `# Guia de edição — ${meta.title ?? 'Demo Aero Suite'}`,
      '',
      meta.subtitle ? `_${meta.subtitle}_` : '',
      '',
      `Gerado em: ${payload.generatedAt}`,
      meta.videoFile ? `Vídeo bruto: \`${meta.videoFile}\`` : '',
      '',
      '## Como usar',
      '',
      '1. Importe o vídeo no CapCut, DaVinci Resolve ou similar.',
      '2. Use a coluna **Início** abaixo para marcar cortes.',
      '3. **Voiceover** = texto sugerido para narração ou legenda.',
      '4. **Corte sugerido** = dica de duração/efeito no clip promocional.',
      '',
      '## Capítulos',
      '',
      '| Início | ID | Tela | Corte sugerido |',
      '|--------|-----|------|----------------|',
    ];

    for (const c of this.chapters) {
      lines.push(`| **${c.timestamp}** | ${c.id} | ${c.title} | ${c.clipSuggestion || '—'} |`);
    }

    lines.push('', '## Detalhamento por cena', '');

    for (const c of this.chapters) {
      lines.push(`### ${c.timestamp} — ${c.title}`, '');
      if (c.path) lines.push(`- **Rota:** \`${c.path}\``);
      lines.push(`- **O que acontece:** ${c.description}`);
      lines.push(`- **Narração sugerida:** ${c.voiceover}`);
      if (c.clipSuggestion) lines.push(`- **Corte promocional:** ${c.clipSuggestion}`);
      lines.push('');
    }

    lines.push(
      '## Clip final sugerido (45–60 s)',
      '',
      '1. Hook (0–5 s): cadastro trial ou cockpit',
      '2. Onboarding (5–15 s): wizard empresa acelerado',
      '3. Produto (15–45 s): OS → estoque → proposta (3 cortes de 8 s)',
      '4. CTA (45–60 s): logo + aerosuite.com.br/contato',
      '',
    );

    fs.writeFileSync(mdPath, lines.filter(Boolean).join('\n'));
    console.log('CHAPTER_MAP', jsonPath);
    console.log('EDIT_GUIDE', mdPath);
    return { jsonPath, mdPath };
  }
}

export async function tryAutoLogin(page, secrets, creds = {}) {
  const email = creds.email || process.env.AEROSUITE_APP_EMAIL || secrets.appEmail || 'admin@aerosuite.com';
  const password = creds.password || process.env.AEROSUITE_APP_PASSWORD || secrets.appPassword || 'admin123';
  const tenant = creds.tenant || process.env.AEROSUITE_APP_TENANT || secrets.appTenant || 'default';

  await page.goto(`${creds.base || DEFAULT_BASE}/login`, { waitUntil: 'domcontentloaded' });
  const tenantField = page.locator('#tenantCodigo');
  if (await tenantField.isVisible().catch(() => false)) {
    await tenantField.fill(tenant);
  }
  await page.locator('#email').fill(email);
  const passField = page.locator('#password input');
  if (await passField.count()) {
    await passField.fill(password);
  }
  await page.locator('[data-testid="login-submit"], button.login-button').first().click();
  try {
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 25000 });
    return { email, tenant };
  } catch {
    return null;
  }
}

export async function waitForAuth(page, secrets, base = DEFAULT_BASE) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  const ok = await tryAutoLogin(page, secrets, { base });
  if (ok) return ok;
  console.log('\n>>> Login automático falhou — faça login manual (até 3 min)...\n');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 180000 });
  return { manual: true };
}

export async function dismissOnboardingBanner(page) {
  const dismiss = page.locator('.as-onboarding-banner__dismiss');
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

export async function runInteraction(page, interaction) {
  if (interaction === 'openFirstRow') {
    const row = page.locator('table tbody tr, .p-datatable-tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
}
