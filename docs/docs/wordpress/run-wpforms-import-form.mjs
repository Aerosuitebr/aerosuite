/**
 * Importa JSON do form via WPForms Tools (substitui form existente se possível).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';
const jsonPath = path.join(dir, 'aerosuite-wpforms-form12.json');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-tools&view=import`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e)=>e.remove()));

const importResult = await admin.evaluate(async (formJson) => {
  const body = new URLSearchParams();
  body.set('action', 'wpforms_import_form');
  body.set('form', JSON.stringify(formJson));
  body.set('overwrite', '12');
  const res = await fetch(window.ajaxurl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, raw: text.slice(0,800) }; }
}, JSON.parse(fs.readFileSync(jsonPath, 'utf8')));

console.log('IMPORT', JSON.stringify(importResult, null, 2));
await browser.close();
