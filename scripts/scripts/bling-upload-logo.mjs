/**
 * Upload logo SVG to Bling app form (file input).
 * Run from repo root:
 *   node scripts/bling-upload-logo.mjs [url]
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const logoPath = resolve(root, 'aerosuite.svg');
const targetUrl =
  process.argv[2] || 'https://www.bling.com.br/cadastro.aplicativos.php';

const puppeteerEntry = pathToFileURL(
  resolve(root, 'frontend/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js'),
).href;
const { default: puppeteer } = await import(puppeteerEntry);

if (!existsSync(logoPath)) {
  console.error('Logo not found:', logoPath);
  process.exit(1);
}

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'],
});

const page = await browser.newPage();
await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 120_000 });

console.log('Aguardando login / formulário (até 3 min)...');
console.log('Logo:', logoPath);

const input = await page.waitForSelector('input[type="file"]', { timeout: 180_000 });
await input.uploadFile(logoPath);

console.log('Arquivo enviado ao input. Confira o preview e clique em Salvar.');
await new Promise((r) => setTimeout(r, 300_000));
await browser.close();
