/**
 * Captura screenshots do app em app.aerosuite.com.br (login manual se necessário).
 * Uso: node capture-app-screenshots.mjs
 * Env opcional: AEROSUITE_APP_EMAIL, AEROSUITE_APP_PASSWORD
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'screenshots');
const BASE = 'https://app.aerosuite.com.br';

const shots = [
  { name: 'os-list', path: '/os', wait: 2500 },
  { name: 'estoque-itens', path: '/estoque/dashboard', wait: 3500 },
  { name: 'propostas-comerciais', path: '/propostas-comerciais', wait: 2500 },
  { name: 'dashboard', path: '/dashboard', wait: 2500 },
];

async function tryAutoLogin(page) {
  const email = process.env.AEROSUITE_APP_EMAIL;
  const password = process.env.AEROSUITE_APP_PASSWORD;
  if (!email || !password) return false;
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: /e-mail/i }).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  try {
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

async function waitForAuth(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  if (await tryAutoLogin(page)) return;
  console.log('\n>>> Faça login na janela do Chromium (até 3 min)...\n');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 180000 });
}

async function capture(page, { name, path, wait }) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(wait);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('OK', file);
  return file;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1440,900'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await waitForAuth(page);
  const files = [];
  for (const s of shots) {
    try {
      files.push(await capture(page, s));
    } catch (e) {
      console.warn('Skip', s.name, e.message);
    }
  }
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify({ base: BASE, files }, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
