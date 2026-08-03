#!/usr/bin/env node
/**
 * Runs all i18n validation scripts and reports a single pass/fail exit code.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const steps = [
  { name: 'api keys (backend ↔ frontend)', cmd: 'node scripts/i18n-check-missing-keys.mjs' },
  { name: 'domain keys & backend throws', cmd: 'node scripts/i18n-audit-gaps.mjs' },
  { name: 'progress scan (api/openapi/console/fallbacks)', cmd: 'node scripts/i18n-progress-scan.mjs' },
  { name: 'UI PT literals', cmd: 'node scripts/i18n-ui-strings-scan.mjs' },
  { name: 'QA locale parity (4 languages)', cmd: 'node scripts/i18n-qa-locale-parity.mjs' },
  { name: 'backend proposta content', cmd: 'node scripts/i18n-backend-proposta-content.mjs' },
  { name: 'transactional email locale', cmd: 'node scripts/i18n-backend-transactional-email.mjs' },
  { name: 'OpenAPI centralized', cmd: 'node scripts/i18n-openapi-centralized.mjs' }
];

let failed = 0;

for (const step of steps) {
  console.log(`\n=== ${step.name} ===`);
  try {
    const out = execSync(step.cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    process.stdout.write(out);
  } catch (err) {
    failed += 1;
    const out = (err.stdout || '') + (err.stderr || '');
    process.stdout.write(out || String(err.message));
  }
}

console.log(failed === 0 ? '\n✓ All i18n checks passed.' : `\n✗ ${failed} check(s) failed.`);
process.exit(failed > 0 ? 1 : 0);
