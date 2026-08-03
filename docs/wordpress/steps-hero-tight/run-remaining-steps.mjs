/**
 * Run steps from current cdp-run-state index through end.
 * Writes invoke-line.json per step; agent calls browser_cdp with that file.
 * Or set CHROME_WS for Playwright (see run-via-playwright.mjs).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const statePath = path.join(dir, 'cdp-run-state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const remaining = order.slice(state.index);
if (!remaining.length) {
  console.log('DONE');
  process.exit(0);
}
console.log('REMAINING', remaining.join(','));
